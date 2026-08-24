import { button, deviceSelect, el, mediaErrorMessage, note, stat, statGrid, status } from '../ui.js';

export const id = 'camera';

export function supported() {
  return Boolean(navigator.mediaDevices?.getUserMedia);
}

export function mount(root) {
  if (!supported()) {
    root.append(
      note(
        'This browser does not expose getUserMedia, so the camera cannot be opened here. A secure origin (https or localhost) is required.',
        'error',
      ),
    );
    return () => {};
  }

  const st = status('Idle');
  const devices = deviceSelect('videoinput', 'camera');
  const video = el('video.preview', { autoplay: true, playsinline: true, muted: true });
  video.muted = true;

  const sRes = stat('Resolution');
  const sFps = stat('Frame rate');
  const sMeasured = stat('Measured FPS');
  const sFacing = stat('Facing');
  const sLabel = stat('Device');

  const startBtn = button('Start camera', () => (running ? stop() : start()));
  const snapBtn = button('Take snapshot', () => snapshot(), 'secondary');
  snapBtn.disabled = true;
  const shots = el('div.shots');

  root.append(
    el('div.controls', startBtn, snapBtn, devices.node),
    st.node,
    el('div.panel.panel-video', video),
    statGrid(sRes, sFps, sMeasured, sFacing, sLabel),
    shots,
    note(
      'The preview never leaves your device. A snapshot is drawn to a canvas in this tab and is only saved if you download it yourself.',
    ),
  );

  let running = false;
  let stream = null;
  let raf = 0;
  const urls = [];

  devices.refresh();

  async function start() {
    st.set('running', 'Requesting permission…');
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: devices.value()
          ? { deviceId: { exact: devices.value() } }
          : { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
    } catch (error) {
      st.set('error', mediaErrorMessage(error, 'camera'));
      return;
    }

    devices.refresh();
    video.srcObject = stream;
    running = true;
    startBtn.textContent = 'Stop camera';
    snapBtn.disabled = false;

    const track = stream.getVideoTracks()[0];
    const settings = track?.getSettings?.() ?? {};
    // The negotiated settings are what the camera actually delivers, which is
    // routinely not what was asked for.
    sRes.set(settings.width && settings.height ? `${settings.width} × ${settings.height}` : '—');
    sFps.set(settings.frameRate ? `${Math.round(settings.frameRate)} fps` : '—');
    sFacing.set(settings.facingMode || (isDesktopish() ? 'n/a' : 'unknown'));
    sLabel.set(track?.label || 'Camera');
    st.set('ready', 'Camera is live');

    measureFps();
    track.addEventListener('ended', () => stop());
  }

  function isDesktopish() {
    return !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  /**
   * Measured frame rate, not the negotiated one. requestVideoFrameCallback
   * counts real decoded frames; without it we fall back to counting rAF ticks,
   * which measures the compositor rather than the camera and is labelled so.
   */
  function measureFps() {
    if (typeof video.requestVideoFrameCallback === 'function') {
      let frames = 0;
      let since = performance.now();
      const onFrame = () => {
        if (!running) return;
        frames += 1;
        const now = performance.now();
        if (now - since >= 1000) {
          sMeasured.set(`${Math.round((frames * 1000) / (now - since))} fps`);
          frames = 0;
          since = now;
        }
        video.requestVideoFrameCallback(onFrame);
      };
      video.requestVideoFrameCallback(onFrame);
      return;
    }
    let ticks = 0;
    let since = performance.now();
    const loop = () => {
      if (!running) return;
      ticks += 1;
      const now = performance.now();
      if (now - since >= 1000) {
        sMeasured.set(`~${Math.round((ticks * 1000) / (now - since))} fps (display)`);
        ticks = 0;
        since = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  function snapshot() {
    if (!running || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      urls.push(url);
      const link = el('a.shot', {
        href: url,
        download: `d3vices-snapshot-${Date.now()}.png`,
        title: 'Download this frame',
      });
      link.append(el('img', { src: url, alt: 'Camera snapshot' }));
      shots.prepend(link);
      while (shots.children.length > 4) shots.lastChild.remove();
    }, 'image/png');
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    stream?.getTracks().forEach((t) => {
      t.stop();
    });
    stream = null;
    video.srcObject = null;
    startBtn.textContent = 'Start camera';
    snapBtn.disabled = true;
    sMeasured.set('—');
    st.set('idle', 'Stopped');
  }

  return () => {
    stop();
    urls.forEach((u) => {
      URL.revokeObjectURL(u);
    });
  };
}
