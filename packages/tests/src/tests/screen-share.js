import { button, el, mediaErrorMessage, note, stat, statGrid, status } from '../ui.js';

export const id = 'screen-share';

export function supported() {
  return Boolean(navigator.mediaDevices?.getDisplayMedia);
}

export function mount(root) {
  if (!supported()) {
    root.append(
      note(
        'This browser does not expose getDisplayMedia. Screen sharing is unavailable on most mobile browsers and needs a secure origin on desktop.',
        'error',
      ),
    );
    return () => {};
  }

  const st = status('Idle');
  const video = el('video.preview', { autoplay: true, playsinline: true, muted: true });
  video.muted = true;

  const sRes = stat('Capture resolution');
  const sFps = stat('Frame rate');
  const sSurface = stat('Surface');
  const sCursor = stat('Cursor');
  const sAudio = stat('System audio');
  const sLabel = stat('Source');

  const startBtn = button('Share a screen', () => (running ? stop() : start()));

  root.append(
    el('div.controls', startBtn),
    st.node,
    el('div.panel.panel-video', video),
    statGrid(sRes, sFps, sSurface, sCursor, sAudio, sLabel),
    note(
      'Nothing is transmitted. The captured frames are rendered in this tab only, and the capture ends the moment you press stop or use the browser’s own sharing bar.',
    ),
  );

  let running = false;
  let stream = null;

  async function start() {
    st.set('running', 'Waiting for you to pick a source…');
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 60 } },
        // Chromium can capture tab audio; Firefox and Safari ignore this.
        audio: true,
      });
    } catch (error) {
      // A user who closes the picker is not an error worth shouting about.
      if (error?.name === 'NotAllowedError') st.set('idle', 'Sharing was cancelled.');
      else st.set('error', mediaErrorMessage(error, 'screen'));
      return;
    }

    video.srcObject = stream;
    running = true;
    startBtn.textContent = 'Stop sharing';

    const track = stream.getVideoTracks()[0];
    const settings = track?.getSettings?.() ?? {};
    sRes.set(settings.width && settings.height ? `${settings.width} × ${settings.height}` : '—');
    sFps.set(settings.frameRate ? `${Math.round(settings.frameRate)} fps` : '—');
    sSurface.set(settings.displaySurface || 'unknown');
    sCursor.set(settings.cursor || 'not reported');
    sAudio.set(stream.getAudioTracks().length ? 'captured' : 'not shared');
    sLabel.set(track?.label || 'Screen');
    st.set('ready', 'Sharing is live — this is what a meeting would see');

    // The browser's own "Stop sharing" bar ends the track without telling the page.
    track.addEventListener('ended', () => stop());
  }

  function stop() {
    running = false;
    stream?.getTracks().forEach((t) => {
      t.stop();
    });
    stream = null;
    video.srcObject = null;
    startBtn.textContent = 'Share a screen';
    st.set('idle', 'Stopped');
  }

  return () => stop();
}
