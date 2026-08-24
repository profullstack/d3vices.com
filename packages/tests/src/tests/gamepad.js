import { button, el, note, stat, statGrid, status } from '../ui.js';

export const id = 'gamepad';

const STANDARD_BUTTONS = [
  'A / Cross',
  'B / Circle',
  'X / Square',
  'Y / Triangle',
  'LB / L1',
  'RB / R1',
  'LT / L2',
  'RT / R2',
  'Back / Share',
  'Start / Options',
  'L3',
  'R3',
  'D-pad up',
  'D-pad down',
  'D-pad left',
  'D-pad right',
  'Guide',
];

export function supported() {
  return typeof navigator.getGamepads === 'function';
}

export function mount(root) {
  if (!supported()) {
    root.append(note('This browser does not implement the Gamepad API.', 'error'));
    return () => {};
  }

  const st = status('Waiting', 'Connect a controller and press any button');
  const padList = el('select.select', { 'aria-label': 'Controller' });
  const buttonsBox = el('div.gamepad-buttons');
  const axesBox = el('div.gamepad-axes');

  const sId = stat('Controller');
  const sMapping = stat('Mapping');
  const sButtons = stat('Buttons');
  const sAxes = stat('Axes');
  const sDrift = stat('Stick drift', 'centre the sticks');
  const sHaptics = stat('Rumble');

  const rumbleBtn = button('Test rumble', () => rumble(), 'secondary');
  rumbleBtn.disabled = true;

  root.append(
    el('div.controls', padList, rumbleBtn),
    st.node,
    el('div.panel', buttonsBox, axesBox),
    statGrid(sId, sMapping, sButtons, sAxes, sDrift, sHaptics),
    note(
      'Browsers hide connected controllers until one of their buttons is pressed, so an idle pad will not appear here until you press something. Stick drift is measured with the sticks at rest: anything above roughly 0.08 will pull in a game that does not apply its own dead zone.',
    ),
  );

  let raf = 0;
  let current = null;
  let driftPeak = 0;
  const buttonNodes = [];
  const axisNodes = [];

  function pads() {
    return Array.from(navigator.getGamepads() || []).filter(Boolean);
  }

  function refreshList() {
    const all = pads();
    const previous = padList.value;
    padList.textContent = '';
    if (!all.length) {
      padList.append(el('option', { value: '' }, 'No controller detected'));
      return;
    }
    for (const p of all)
      padList.append(el('option', { value: String(p.index) }, `${p.index}: ${p.id.slice(0, 48)}`));
    if (all.some((p) => String(p.index) === previous)) padList.value = previous;
  }

  function buildFor(pad) {
    buttonsBox.textContent = '';
    axesBox.textContent = '';
    buttonNodes.length = 0;
    axisNodes.length = 0;

    pad.buttons.forEach((_, i) => {
      const fill = el('div.gp-btn-fill');
      const node = el(
        'div.gp-btn',
        fill,
        el('span.gp-btn-label', {
          text: pad.mapping === 'standard' ? (STANDARD_BUTTONS[i] ?? `Button ${i}`) : `Button ${i}`,
        }),
      );
      buttonNodes.push({ node, fill });
      buttonsBox.append(node);
    });

    for (let i = 0; i < pad.axes.length; i += 2) {
      const dot = el('div.gp-stick-dot');
      const stick = el('div.gp-stick', el('div.gp-stick-cross'), dot);
      const readout = el('div.gp-axis-readout');
      axisNodes.push({ dot, readout, xi: i, yi: i + 1 });
      axesBox.append(
        el('div.gp-axis-group', el('div.stat-label', { text: `Axes ${i} / ${i + 1}` }), stick, readout),
      );
    }

    sId.set(pad.id);
    sMapping.set(pad.mapping || 'non-standard');
    sButtons.set(pad.buttons.length);
    sAxes.set(pad.axes.length);
    sHaptics.set(pad.vibrationActuator ? 'supported' : 'not supported');
    rumbleBtn.disabled = !pad.vibrationActuator;
    driftPeak = 0;
  }

  function loop() {
    const all = pads();
    if (!all.length) {
      st.set('idle', 'No controller detected — press a button on your pad');
      current = null;
      raf = requestAnimationFrame(loop);
      return;
    }

    const wanted =
      padList.value === '' ? all[0] : all.find((p) => String(p.index) === padList.value) || all[0];
    if (!current || current.index !== wanted.index || current.buttons.length !== wanted.buttons.length) {
      current = wanted;
      refreshList();
      padList.value = String(wanted.index);
      buildFor(wanted);
      st.set('ready', 'Controller connected');
    }
    current = wanted;

    wanted.buttons.forEach((b, i) => {
      const target = buttonNodes[i];
      if (!target) return;
      const value = typeof b === 'object' ? b.value : b;
      const pressed = typeof b === 'object' ? b.pressed : b > 0.5;
      target.fill.style.height = `${Math.round(value * 100)}%`;
      target.node.classList.toggle('is-pressed', pressed);
      if (pressed) target.node.classList.add('is-seen');
    });

    let resting = 0;
    for (const a of axisNodes) {
      const x = wanted.axes[a.xi] ?? 0;
      const y = wanted.axes[a.yi] ?? 0;
      a.dot.style.transform = `translate(${x * 42}px, ${y * 42}px)`;
      a.readout.textContent = `${x.toFixed(3)}, ${y.toFixed(3)}`;
      resting = Math.max(resting, Math.abs(x), Math.abs(y));
    }
    // Peak deflection while nothing is being pushed is the useful drift number.
    if (resting > driftPeak) {
      driftPeak = resting;
      sDrift.set(`${driftPeak.toFixed(3)}${driftPeak > 0.08 ? ' — drifting' : ''}`);
    }

    raf = requestAnimationFrame(loop);
  }

  async function rumble() {
    const pad = pads().find((p) => String(p.index) === padList.value);
    const actuator = pad?.vibrationActuator;
    if (!actuator) return;
    try {
      await actuator.playEffect('dual-rumble', { duration: 600, strongMagnitude: 1, weakMagnitude: 0.6 });
      sHaptics.set('fired');
    } catch (error) {
      sHaptics.set(`refused: ${error.name}`);
    }
  }

  const onConnect = () => refreshList();
  window.addEventListener('gamepadconnected', onConnect);
  window.addEventListener('gamepaddisconnected', onConnect);
  padList.addEventListener('change', () => {
    current = null;
  });

  refreshList();
  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('gamepadconnected', onConnect);
    window.removeEventListener('gamepaddisconnected', onConnect);
  };
}
