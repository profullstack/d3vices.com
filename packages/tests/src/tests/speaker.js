import { button, el, note, stat, statGrid, status } from '../ui.js';

export const id = 'speaker';

export function supported() {
  return Boolean(window.AudioContext || window.webkitAudioContext);
}

export function mount(root) {
  if (!supported()) {
    root.append(note('This browser has no Web Audio support, so tones cannot be generated here.', 'error'));
    return () => {};
  }

  const st = status('Idle');
  const sChannel = stat('Channel', 'Both');
  const sFreq = stat('Frequency', '440 Hz');
  const sState = stat('Output', 'Silent');

  let channel = 'both';
  const channelButtons = ['left', 'both', 'right'].map((c) =>
    button(
      c === 'left' ? 'Left only' : c === 'right' ? 'Right only' : 'Both',
      () => {
        channel = c;
        sChannel.set(c === 'both' ? 'Both' : c === 'left' ? 'Left' : 'Right');
        applyPan();
        for (const b of channelButtons) b.classList.toggle('is-active', b.dataset.channel === c);
      },
      'secondary',
    ),
  );
  channelButtons.forEach((b, i) => {
    b.dataset.channel = ['left', 'both', 'right'][i];
  });
  channelButtons[1].classList.add('is-active');

  const freq = el('input.range', { type: 'range', min: 20, max: 20000, value: 440, step: 1 });
  freq.addEventListener('input', () => {
    const v = Number(freq.value);
    sFreq.set(`${v} Hz`);
    if (osc) osc.frequency.setTargetAtTime(v, ctx.currentTime, 0.01);
  });

  const toneBtn = button('Play tone', () => (osc ? stopAll() : playTone()));
  const sweepBtn = button('Sweep 20 Hz → 20 kHz', () => (osc ? stopAll() : sweep()), 'secondary');
  const noiseBtn = button('White noise', () => (noise ? stopAll() : playNoise()), 'secondary');

  root.append(
    el('div.controls', toneBtn, sweepBtn, noiseBtn),
    el('div.controls', ...channelButtons),
    el('label.field', el('span', 'Frequency'), freq),
    st.node,
    statGrid(sChannel, sFreq, sState),
    note(
      'If you hear the left tone from the right speaker, your channels are swapped somewhere between the browser and the driver. A tone you cannot hear at all near 20 Hz or 20 kHz is normal — very few speakers reproduce the extremes.',
    ),
  );

  let ctx = null;
  let osc = null;
  let noise = null;
  let gain = null;
  let panner = null;

  function ensureCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function chain() {
    gain = ctx.createGain();
    gain.gain.value = 0.0001;
    panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      gain.connect(panner);
      panner.connect(ctx.destination);
    } else {
      gain.connect(ctx.destination);
    }
    applyPan();
    // Ramp in: a square-edged start pops, and a pop is indistinguishable from a blown driver.
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
  }

  function applyPan() {
    if (!panner) return;
    panner.pan.value = channel === 'left' ? -1 : channel === 'right' ? 1 : 0;
  }

  function playTone() {
    ensureCtx();
    chain();
    osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = Number(freq.value);
    osc.connect(gain);
    osc.start();
    toneBtn.textContent = 'Stop';
    sState.set('Tone');
    st.set('running', 'Playing');
  }

  function sweep() {
    ensureCtx();
    chain();
    osc = ctx.createOscillator();
    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(20, now);
    osc.frequency.exponentialRampToValueAtTime(20000, now + 10);
    osc.connect(gain);
    osc.start();
    osc.onended = () => stopAll();
    osc.stop(now + 10);
    sweepBtn.textContent = 'Stop';
    sState.set('Sweep');
    st.set('running', 'Sweeping 20 Hz to 20 kHz over ten seconds');
  }

  function playNoise() {
    ensureCtx();
    chain();
    const seconds = 2;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    noise.connect(gain);
    noise.start();
    noiseBtn.textContent = 'Stop';
    sState.set('White noise');
    st.set('running', 'Playing white noise');
  }

  function stopAll() {
    try {
      osc?.stop();
    } catch {
      /* already stopped by its own schedule */
    }
    try {
      noise?.stop();
    } catch {
      /* already stopped */
    }
    osc = null;
    noise = null;
    gain?.disconnect();
    panner?.disconnect();
    toneBtn.textContent = 'Play tone';
    sweepBtn.textContent = 'Sweep 20 Hz → 20 kHz';
    noiseBtn.textContent = 'White noise';
    sState.set('Silent');
    st.set('idle', 'Stopped');
  }

  return () => {
    stopAll();
    ctx?.close();
  };
}
