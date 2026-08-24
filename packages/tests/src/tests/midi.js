import { button, el, note, stat, statGrid, status } from '../ui.js';

export const id = 'midi';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FIRST_NOTE = 21; // A0
const LAST_NOTE = 108; // C8

function noteName(n) {
  return `${NOTE_NAMES[n % 12]}${Math.floor(n / 12) - 1}`;
}

export function supported() {
  return typeof navigator.requestMIDIAccess === 'function';
}

export function mount(root) {
  if (!supported()) {
    root.append(
      note(
        'This browser does not implement Web MIDI. Chromium-based browsers support it; Safari and Firefox do not expose it by default.',
        'error',
      ),
    );
    return () => {};
  }

  const st = status('Idle');
  const piano = el('div.piano');
  const keyNodes = new Map();
  for (let n = FIRST_NOTE; n <= LAST_NOTE; n += 1) {
    const isBlack = [1, 3, 6, 8, 10].includes(n % 12);
    const key = el(`div.piano-key.${isBlack ? 'is-black' : 'is-white'}`, {
      'data-note': n,
      title: noteName(n),
    });
    keyNodes.set(n, key);
    piano.append(key);
  }

  const log = el('div.midi-log');
  const inputs = el('div.midi-devices');

  const sInputs = stat('Inputs', '0');
  const sOutputs = stat('Outputs', '0');
  const sLastNote = stat('Last note');
  const sVelocity = stat('Velocity');
  const sChannel = stat('Channel');
  const sCC = stat('Last CC');
  const sBend = stat('Pitch bend');

  const startBtn = button('Connect MIDI', () => (access ? disconnect() : connect()));

  root.append(
    el(
      'div.controls',
      startBtn,
      button(
        'Clear log',
        () => {
          log.textContent = '';
        },
        'secondary',
      ),
    ),
    st.node,
    inputs,
    el('div.panel', piano),
    statGrid(sInputs, sOutputs, sLastNote, sVelocity, sChannel, sCC, sBend),
    log,
    note(
      'System-exclusive messages are requested too, which some browsers prompt separately for. Nothing is sent back to your device unless you ask for it, and no MIDI data leaves this page.',
    ),
  );

  let access = null;

  async function connect() {
    st.set('running', 'Requesting MIDI access…');
    try {
      access = await navigator.requestMIDIAccess({ sysex: true });
    } catch {
      // sysex is frequently refused; plain access usually still works.
      try {
        access = await navigator.requestMIDIAccess();
      } catch (error) {
        st.set(
          'error',
          error?.name === 'SecurityError'
            ? 'MIDI permission was denied.'
            : `MIDI access failed: ${error?.message ?? error}`,
        );
        return;
      }
    }
    startBtn.textContent = 'Disconnect';
    access.onstatechange = () => refreshDevices();
    refreshDevices();
    st.set('ready', 'Connected — play something');
  }

  function refreshDevices() {
    if (!access) return;
    const ins = Array.from(access.inputs.values());
    const outs = Array.from(access.outputs.values());
    sInputs.set(ins.length);
    sOutputs.set(outs.length);

    inputs.textContent = '';
    if (!ins.length) {
      inputs.append(
        note('No MIDI input is connected. Plug in a controller — it appears here without a reload.', 'warn'),
      );
    }
    for (const input of ins) {
      input.onmidimessage = onMessage;
      inputs.append(
        el(
          'div.midi-device',
          el('strong', { text: input.name || 'Unnamed input' }),
          el('span', { text: `${input.manufacturer || 'unknown maker'} · ${input.state}` }),
        ),
      );
    }
  }

  function onMessage(event) {
    const [statusByte, d1, d2] = event.data;
    const type = statusByte & 0xf0;
    const channel = (statusByte & 0x0f) + 1;
    sChannel.set(channel);

    if (type === 0x90 && d2 > 0) {
      highlight(d1, true, d2);
      sLastNote.set(`${noteName(d1)} (${d1})`);
      sVelocity.set(d2);
      addLog('note on', `${noteName(d1)} vel ${d2} ch ${channel}`);
    } else if (type === 0x80 || (type === 0x90 && d2 === 0)) {
      highlight(d1, false);
      addLog('note off', `${noteName(d1)} ch ${channel}`);
    } else if (type === 0xb0) {
      sCC.set(`CC${d1} = ${d2}`);
      addLog('control', `CC${d1} = ${d2} ch ${channel}`);
    } else if (type === 0xe0) {
      const value = ((d2 << 7) | d1) - 8192;
      sBend.set(value);
      addLog('pitch bend', String(value));
    } else if (type === 0xc0) {
      addLog('program', `#${d1} ch ${channel}`);
    } else if (statusByte === 0xf0) {
      addLog('sysex', `${event.data.length} bytes`);
    }
  }

  function highlight(n, on, velocity) {
    const key = keyNodes.get(n);
    if (!key) return;
    key.classList.toggle('is-on', on);
    key.style.opacity = on && velocity ? String(0.45 + (velocity / 127) * 0.55) : '';
  }

  function addLog(kind, detail) {
    const row = el('div.midi-row', el('span.midi-kind', { text: kind }), el('span', { text: detail }));
    log.prepend(row);
    while (log.children.length > 80) log.lastChild.remove();
  }

  function disconnect() {
    if (access) {
      for (const input of access.inputs.values()) input.onmidimessage = null;
      access.onstatechange = null;
    }
    access = null;
    startBtn.textContent = 'Connect MIDI';
    for (const key of keyNodes.values()) {
      key.classList.remove('is-on');
      key.style.opacity = '';
    }
    st.set('idle', 'Disconnected');
  }

  return () => disconnect();
}
