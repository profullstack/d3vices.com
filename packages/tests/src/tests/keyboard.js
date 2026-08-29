import { button, el, note, stat, statGrid, status, storage } from '../ui.js';

export const id = 'keyboard';

/**
 * Layouts are described by KeyboardEvent.code, which is physical position and
 * does not change with the software layout. That is the only identifier that
 * makes "did this switch fire?" answerable — `key` would give us 'a' or 'ф'
 * depending on the OS setting, for the same physical switch.
 * Width is in units of one standard key.
 */
const K = (code, label, width = 1, extra) => ({ code, label, width, ...extra });

const FUNCTION_ROW = [
  K('Escape', 'Esc'),
  K('', '', 1, { spacer: true }),
  K('F1', 'F1'),
  K('F2', 'F2'),
  K('F3', 'F3'),
  K('F4', 'F4'),
  K('', '', 0.5, { spacer: true }),
  K('F5', 'F5'),
  K('F6', 'F6'),
  K('F7', 'F7'),
  K('F8', 'F8'),
  K('', '', 0.5, { spacer: true }),
  K('F9', 'F9'),
  K('F10', 'F10'),
  K('F11', 'F11'),
  K('F12', 'F12'),
];

const NUMBER_ROW = [
  K('Backquote', '`'),
  K('Digit1', '1'),
  K('Digit2', '2'),
  K('Digit3', '3'),
  K('Digit4', '4'),
  K('Digit5', '5'),
  K('Digit6', '6'),
  K('Digit7', '7'),
  K('Digit8', '8'),
  K('Digit9', '9'),
  K('Digit0', '0'),
  K('Minus', '-'),
  K('Equal', '='),
  K('Backspace', 'Backspace', 2),
];

const TOP_ROW = [
  K('Tab', 'Tab', 1.5),
  K('KeyQ', 'Q'),
  K('KeyW', 'W'),
  K('KeyE', 'E'),
  K('KeyR', 'R'),
  K('KeyT', 'T'),
  K('KeyY', 'Y'),
  K('KeyU', 'U'),
  K('KeyI', 'I'),
  K('KeyO', 'O'),
  K('KeyP', 'P'),
  K('BracketLeft', '['),
  K('BracketRight', ']'),
];

const HOME_ROW = [
  K('CapsLock', 'Caps', 1.75, { lock: 'CapsLock' }),
  K('KeyA', 'A'),
  K('KeyS', 'S'),
  K('KeyD', 'D'),
  K('KeyF', 'F'),
  K('KeyG', 'G'),
  K('KeyH', 'H'),
  K('KeyJ', 'J'),
  K('KeyK', 'K'),
  K('KeyL', 'L'),
  K('Semicolon', ';'),
  K('Quote', "'"),
];

const BOTTOM_ROW = [
  K('KeyZ', 'Z'),
  K('KeyX', 'X'),
  K('KeyC', 'C'),
  K('KeyV', 'V'),
  K('KeyB', 'B'),
  K('KeyN', 'N'),
  K('KeyM', 'M'),
  K('Comma', ','),
  K('Period', '.'),
  K('Slash', '/'),
];

const MODIFIER_ROW = (metaLabel) => [
  K('ControlLeft', 'Ctrl', 1.25),
  K('MetaLeft', metaLabel, 1.25),
  K('AltLeft', 'Alt', 1.25),
  K('Space', 'Space', 6.25),
  K('AltRight', 'Alt', 1.25),
  K('MetaRight', metaLabel, 1.25),
  K('ContextMenu', 'Menu', 1.25),
  K('ControlRight', 'Ctrl', 1.25),
];

const NAV_CLUSTER = [
  [K('PrintScreen', 'PrtSc'), K('ScrollLock', 'Scroll', 1, { lock: 'ScrollLock' }), K('Pause', 'Pause')],
  [K('Insert', 'Ins'), K('Home', 'Home'), K('PageUp', 'PgUp')],
  [K('Delete', 'Del'), K('End', 'End'), K('PageDown', 'PgDn')],
  [],
  [K('', '', 1, { spacer: true }), K('ArrowUp', '↑'), K('', '', 1, { spacer: true })],
  [K('ArrowLeft', '←'), K('ArrowDown', '↓'), K('ArrowRight', '→')],
];

const NUMPAD = [
  [
    K('NumLock', 'Num', 1, { lock: 'NumLock' }),
    K('NumpadDivide', '/'),
    K('NumpadMultiply', '*'),
    K('NumpadSubtract', '-'),
  ],
  [K('Numpad7', '7'), K('Numpad8', '8'), K('Numpad9', '9'), K('NumpadAdd', '+')],
  [K('Numpad4', '4'), K('Numpad5', '5'), K('Numpad6', '6')],
  [K('Numpad1', '1'), K('Numpad2', '2'), K('Numpad3', '3'), K('NumpadEnter', 'Enter')],
  [K('Numpad0', '0', 2), K('NumpadDecimal', '.')],
];

function buildMain(layout) {
  const meta = layout === 'mac' ? '⌘' : 'Win';
  const rows = [];
  rows.push(FUNCTION_ROW);
  rows.push(NUMBER_ROW);

  if (layout === 'iso') {
    // ISO: tall L-shaped Enter, so the top row loses the backslash and the home
    // row gains a Hash key; an extra IntlBackslash sits beside the left shift.
    rows.push([...TOP_ROW, K('Enter', 'Enter', 1.5)]);
    rows.push([...HOME_ROW, K('Backslash', '#', 1)]);
    rows.push([
      K('ShiftLeft', 'Shift', 1.25),
      K('IntlBackslash', '\\'),
      ...BOTTOM_ROW,
      K('ShiftRight', 'Shift', 2.75),
    ]);
  } else if (layout === 'jis') {
    rows.push([...TOP_ROW, K('Enter', 'Enter', 1.5)]);
    rows.push([...HOME_ROW, K('Backslash', ']', 1)]);
    rows.push([
      K('ShiftLeft', 'Shift', 2.25),
      ...BOTTOM_ROW,
      K('IntlRo', 'ろ'),
      K('ShiftRight', 'Shift', 1.75),
    ]);
  } else {
    rows.push([...TOP_ROW, K('Backslash', '\\', 1.5)]);
    rows.push([...HOME_ROW, K('Enter', 'Enter', 2.25)]);
    rows.push([K('ShiftLeft', 'Shift', 2.25), ...BOTTOM_ROW, K('ShiftRight', 'Shift', 2.75)]);
  }

  if (layout === 'jis') {
    rows.push([
      K('ControlLeft', 'Ctrl', 1.25),
      K('MetaLeft', 'Win', 1.25),
      K('AltLeft', 'Alt', 1.25),
      K('NonConvert', '無変換', 1.25),
      K('Space', 'Space', 3),
      K('Convert', '変換', 1.25),
      K('KanaMode', 'かな', 1.25),
      K('AltRight', 'Alt'),
      K('MetaRight', 'Win'),
      K('ControlRight', 'Ctrl', 1.25),
    ]);
  } else {
    rows.push(MODIFIER_ROW(meta));
  }
  return rows;
}

export function supported() {
  return true;
}

export function mount(root) {
  const st = status('Ready', 'Press any key');
  const board = el('div.keyboard');
  const nav = el('div.keyboard-cluster');
  const pad = el('div.keyboard-cluster');

  const sSeen = stat('Keys seen', '0');
  const sLast = stat('Last key');
  const sCode = stat('event.code');
  const sKeyVal = stat('event.key');
  const sRollover = stat('Max simultaneous', '0');
  const sRepeat = stat('Repeat rate');
  const sLocks = stat('Locks', 'none');

  const layoutSelect = el(
    'select.select',
    { 'aria-label': 'Keyboard layout' },
    el('option', { value: 'ansi' }, 'ANSI (US)'),
    el('option', { value: 'iso' }, 'ISO (UK / EU)'),
    el('option', { value: 'jis' }, 'JIS (Japan)'),
  );
  layoutSelect.value = storage.get('d3vices:keyboard-layout', guessLayout());
  layoutSelect.addEventListener('change', () => {
    storage.set('d3vices:keyboard-layout', layoutSelect.value);
    render();
  });

  const showNumpad = el('input', { type: 'checkbox', checked: true });
  showNumpad.addEventListener('change', () => render());

  const releaseBtn = button('Release keyboard (Esc Esc)', () => setCapture(!capturing), 'secondary');

  root.append(
    el(
      'div.controls',
      layoutSelect,
      el('label.checkbox', showNumpad, el('span', 'Full size (numpad)')),
      button('Reset', () => reset(), 'secondary'),
      releaseBtn,
    ),
    st.node,
    el('div.keyboard-wrap', board, el('div.keyboard-side', nav, pad)),
    statGrid(sSeen, sLast, sCode, sKeyVal, sRollover, sRepeat, sLocks),
    note(
      'A key stays marked once it has been seen, so you can work through the whole board and spot the switch that never lit. If a key does nothing here, the browser never received it — that points at the keyboard, its firmware or the OS, not at this page.',
    ),
    note(
      'This page takes over the keyboard while the test runs, which is the only way to see keys the browser would otherwise act on. Press Escape twice, or use the button above, to hand it back.',
    ),
  );

  const seen = new Set();
  const down = new Set();
  let maxDown = 0;
  const repeatTimes = [];
  let total = 0;

  /**
   * Swallowing every key is what makes this test work, and it is also a
   * keyboard trap: without a way out, someone navigating by keyboard alone
   * cannot Tab off this page or reach a browser shortcut. Two quick Escapes
   * release it, which still leaves a single Escape testable.
   */
  let capturing = true;
  let lastEscape = 0;

  function setCapture(on) {
    capturing = on;
    releaseBtn.textContent = on ? 'Release keyboard (Esc Esc)' : 'Capture keyboard';
    releaseBtn.setAttribute('aria-pressed', String(!on));
    // Lowercase: the status dot is coloured off these exact state names.
    st.set(on ? 'ready' : 'warn', on ? 'Press any key' : 'Keyboard released, keys go to the browser');
  }

  function guessLayout() {
    const lang = navigator.language || '';
    if (/^ja/i.test(lang)) return 'jis';
    if (/^(en-GB|de|fr|es|it|nl|pt|pl|sv|da|no|fi)/i.test(lang)) return 'iso';
    return 'ansi';
  }

  function keyNode(k) {
    if (k.spacer) return el('div.key-spacer', { style: { width: `calc(var(--key) * ${k.width})` } });
    const node = el(
      'div.key',
      {
        'data-code': k.code,
        style: {
          width: `calc(var(--key) * ${k.width} + var(--key-gap) * ${k.width - 1})`,
        },
      },
      el('span', { text: k.label }),
    );
    if (seen.has(k.code)) node.classList.add('is-seen');
    return node;
  }

  function render() {
    board.textContent = '';
    for (const row of buildMain(layoutSelect.value)) {
      board.append(el('div.key-row', ...row.map(keyNode)));
    }
    nav.textContent = '';
    for (const row of NAV_CLUSTER) {
      nav.append(row.length ? el('div.key-row', ...row.map(keyNode)) : el('div.key-gap'));
    }
    pad.textContent = '';
    pad.style.display = showNumpad.checked ? '' : 'none';
    if (showNumpad.checked) {
      for (const row of NUMPAD) pad.append(el('div.key-row', ...row.map(keyNode)));
    }
  }

  function nodesFor(code) {
    return root.querySelectorAll(`.key[data-code="${CSS.escape(code)}"]`);
  }

  function onKeyDown(e) {
    // Two Escapes in quick succession hand the keyboard back. Checked before
    // anything else, so it works even while every other key is being swallowed.
    if (e.code === 'Escape') {
      const now = performance.now();
      if (capturing && now - lastEscape < 700) setCapture(false);
      lastEscape = now;
    }
    if (!capturing) return;

    // The browser owns some combinations (Ctrl+W, F5). Suppressing the default
    // is what makes the test usable; it is scoped to this page only.
    if (e.code !== 'F5' && e.code !== 'F12') e.preventDefault();

    if (e.repeat) {
      repeatTimes.push(performance.now());
      if (repeatTimes.length > 8) repeatTimes.shift();
      if (repeatTimes.length >= 3) {
        const gaps = repeatTimes.slice(1).map((t, i) => t - repeatTimes[i]);
        const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        sRepeat.set(`${(1000 / avg).toFixed(1)} keys/s`);
      }
      return;
    }
    repeatTimes.length = 0;

    down.add(e.code);
    if (down.size > maxDown) {
      maxDown = down.size;
      sRollover.set(maxDown);
    }
    if (!seen.has(e.code)) {
      seen.add(e.code);
      sSeen.set(seen.size);
    }
    total += 1;

    for (const node of nodesFor(e.code)) {
      node.classList.add('is-down', 'is-seen');
    }
    // A code with no key on the rendered layout is still worth reporting.
    if (nodesFor(e.code).length === 0)
      st.set('ready', `${e.code} is not on the ${layoutSelect.value.toUpperCase()} layout shown`);
    else st.set('ready', `${total} key press${total === 1 ? '' : 'es'}`);

    sLast.set(e.key === ' ' ? 'Space' : e.key);
    sCode.set(e.code);
    sKeyVal.set(JSON.stringify(e.key));
    updateLocks(e);
  }

  function onKeyUp(e) {
    down.delete(e.code);
    for (const node of nodesFor(e.code)) node.classList.remove('is-down');
    updateLocks(e);
  }

  function updateLocks(e) {
    const locks = ['CapsLock', 'NumLock', 'ScrollLock'].filter((l) => {
      try {
        return e.getModifierState?.(l);
      } catch {
        return false;
      }
    });
    sLocks.set(locks.length ? locks.join(', ') : 'none');
    for (const l of ['CapsLock', 'NumLock', 'ScrollLock']) {
      for (const node of nodesFor(l)) node.classList.toggle('is-locked', locks.includes(l));
    }
  }

  function reset() {
    seen.clear();
    down.clear();
    maxDown = 0;
    total = 0;
    sSeen.set(0);
    sRollover.set(0);
    sRepeat.set('—');
    sLast.set('—');
    sCode.set('—');
    sKeyVal.set('—');
    st.set('ready', 'Press any key');
    render();
  }

  // A key released while the window was unfocused never sends keyup.
  const onBlur = () => {
    down.clear();
    for (const node of root.querySelectorAll('.key.is-down')) node.classList.remove('is-down');
  };

  render();
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
  };
}
