import {
  button,
  deviceSelect,
  el,
  hidpiCanvas,
  mediaErrorMessage,
  note,
  stat,
  statGrid,
  status,
} from '../ui.js';

export const id = 'microphone';

export function supported() {
  return Boolean(navigator.mediaDevices?.getUserMedia);
}

export function mount(root) {
  if (!supported()) {
    root.append(
      note(
        'This browser does not expose getUserMedia, so the microphone cannot be opened here. A secure origin (https or localhost) is required.',
        'error',
      ),
    );
    return () => {};
  }

  const st = status('Idle');
  const devices = deviceSelect('audioinput', 'microphone');
  const level = el('div.meter-fill');
  const meter = el('div.meter', level);
  const peakMark = el('div.meter-peak');
  meter.append(peakMark);
  const wave = hidpiCanvas(180);

  const sRms = stat('Level');
  const sPeak = stat('Peak');
  const sRate = stat('Sample rate');
  const sChannels = stat('Channels');
  const sLabel = stat('Device');

  const startBtn = button('Start microphone', () => (running ? stop() : start()));
  const recordBtn = button('Record 5s', () => toggleRecord(), 'secondary');
  recordBtn.disabled = true;
  const playback = el('audio.playback', { controls: true, style: { display: 'none' } });

  root.append(
    el('div.controls', startBtn, recordBtn, devices.node),
    st.node,
    el('div.panel', wave.canvas, meter),
    statGrid(sRms, sPeak, sRate, sChannels, sLabel),
    playback,
    note(
      'Everything here happens on your device. Audio is never uploaded — the recording is held in memory and discarded when you leave the page.',
    ),
  );

  let running = false;
  let stream = null;
  let audioCtx = null;
  let analyser = null;
  let raf = 0;
  let recorder = null;
  let chunks = [];
  let peak = 0;
  let lastUrl = null;

  wave.observe();
  devices.refresh();

  async function start() {
    st.set('running', 'Requesting permission…');
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: devices.value() ? { exact: devices.value() } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
    } catch (error) {
      st.set('error', mediaErrorMessage(error, 'microphone'));
      return;
    }

    // Labels only become readable once permission has been granted once.
    devices.refresh();

    const track = stream.getAudioTracks()[0];
    const settings = track?.getSettings?.() ?? {};
    sLabel.set(track?.label || 'Microphone');
    sChannels.set(settings.channelCount ?? 1);

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Chrome starts the context suspended until a user gesture resumes it.
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    sRate.set(`${audioCtx.sampleRate} Hz`);

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.6;
    audioCtx.createMediaStreamSource(stream).connect(analyser);

    running = true;
    peak = 0;
    startBtn.textContent = 'Stop microphone';
    recordBtn.disabled = typeof window.MediaRecorder !== 'function';
    st.set('ready', 'Listening — speak and watch the waveform');
    draw();
  }

  function draw() {
    const buffer = new Float32Array(analyser.fftSize);
    const w = () => wave.cssWidth();
    const h = () => wave.cssHeight();

    const frame = () => {
      if (!running) return;
      analyser.getFloatTimeDomainData(buffer);

      let sum = 0;
      let framePeak = 0;
      for (let i = 0; i < buffer.length; i += 1) {
        const v = buffer[i];
        sum += v * v;
        const a = Math.abs(v);
        if (a > framePeak) framePeak = a;
      }
      const rms = Math.sqrt(sum / buffer.length);
      if (framePeak > peak) peak = framePeak;

      const ctx = wave.ctx;
      const width = w();
      const height = h();
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(127,127,127,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      ctx.strokeStyle = getComputedStyle(root).getPropertyValue('--accent') || '#3ddc97';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const step = width / buffer.length;
      for (let i = 0; i < buffer.length; i += 1) {
        const y = height / 2 - buffer[i] * (height / 2) * 0.95;
        if (i === 0) ctx.moveTo(0, y);
        else ctx.lineTo(i * step, y);
      }
      ctx.stroke();

      const pct = Math.min(100, rms * 200);
      level.style.width = `${pct}%`;
      peakMark.style.left = `${Math.min(100, peak * 100)}%`;
      sRms.set(`${dbfs(rms)} dBFS`);
      sPeak.set(`${dbfs(peak)} dBFS`);

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }

  function dbfs(v) {
    if (!v) return '-∞';
    return (20 * Math.log10(v)).toFixed(1);
  }

  function toggleRecord() {
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
      return;
    }
    chunks = [];
    try {
      recorder = new MediaRecorder(stream);
    } catch {
      st.set('error', 'This browser cannot record from the microphone.');
      return;
    }
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
      playback.src = lastUrl;
      playback.style.display = '';
      recordBtn.textContent = 'Record 5s';
      st.set('ready', 'Recording ready — press play to hear yourself back');
    };
    recorder.start();
    recordBtn.textContent = 'Stop recording';
    st.set('running', 'Recording…');
    setTimeout(() => recorder?.state === 'recording' && recorder.stop(), 5000);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    if (recorder?.state === 'recording') recorder.stop();
    stream?.getTracks().forEach((t) => {
      t.stop();
    });
    audioCtx?.close();
    stream = null;
    audioCtx = null;
    analyser = null;
    level.style.width = '0%';
    startBtn.textContent = 'Start microphone';
    recordBtn.disabled = true;
    st.set('idle', 'Stopped');
    wave.ctx.clearRect(0, 0, wave.cssWidth(), wave.cssHeight());
  }

  return () => {
    stop();
    wave.stop();
    if (lastUrl) URL.revokeObjectURL(lastUrl);
  };
}
