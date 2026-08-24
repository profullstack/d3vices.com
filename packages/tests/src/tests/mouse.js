import { button, el, note, stat, statGrid, status } from '../ui.js';

export const id = 'mouse';

const BUTTONS = [
  { bit: 0, name: 'Left' },
  { bit: 1, name: 'Middle' },
  { bit: 2, name: 'Right' },
  { bit: 3, name: 'Back' },
  { bit: 4, name: 'Forward' },
];

export function supported() {
  return true;
}

export function mount(root) {
  const st = status('Ready', 'Move and click inside the pad');

  const pad = el('div.mouse-pad', { tabindex: '0' });
  const body = el('div.mouse-body');
  const buttonNodes = new Map();
  for (const b of BUTTONS) {
    const node = el(`div.mouse-btn.mouse-btn-${b.name.toLowerCase()}`, { text: b.name });
    buttonNodes.set(b.bit, node);
    body.append(node);
  }
  const wheelNode = el('div.mouse-wheel', el('div.mouse-wheel-inner'));
  body.append(wheelNode);
  pad.append(body, el('div.mouse-hint', { text: 'Click, scroll and move here' }));

  const sButtons = stat('Buttons seen', '0 / 5');
  const sLast = stat('Last button');
  const sPos = stat('Position');
  const sMovement = stat('Movement');
  const sPolling = stat('Polling rate');
  const sWheelY = stat('Wheel Y');
  const sWheelX = stat('Wheel X');
  const sDouble = stat('Double-click gap');
  const sPointer = stat('Pointer type');

  root.append(
    el(
      'div.controls',
      button('Reset', () => reset(), 'secondary'),
    ),
    st.node,
    pad,
    statGrid(sButtons, sLast, sPos, sMovement, sPolling, sWheelY, sWheelX, sDouble, sPointer),
    note(
      'Back and forward buttons only register if the browser does not consume them for navigation first — inside this pad they are intercepted. A double-click gap far below your system setting on a single physical press is the signature of a worn switch double-firing.',
    ),
  );

  const seen = new Set();
  const moveTimes = [];
  let lastDownAt = 0;
  let wheelX = 0;
  let wheelY = 0;

  function markButton(bit) {
    if (!seen.has(bit)) {
      seen.add(bit);
      sButtons.set(`${seen.size} / ${BUTTONS.length}`);
    }
    buttonNodes.get(bit)?.classList.add('is-seen');
  }

  function onPointerDown(e) {
    e.preventDefault();
    pad.focus();
    const bit = e.button;
    markButton(bit);
    buttonNodes.get(bit)?.classList.add('is-down');
    sLast.set(`${BUTTONS.find((b) => b.bit === bit)?.name ?? `Button ${bit}`} (button ${bit})`);
    sPointer.set(`${e.pointerType}${e.pressure ? ` · pressure ${e.pressure.toFixed(2)}` : ''}`);

    const now = performance.now();
    if (lastDownAt && bit === 0) {
      const gap = now - lastDownAt;
      if (gap < 700) sDouble.set(`${Math.round(gap)} ms${gap < 60 ? ' — suspiciously fast' : ''}`);
    }
    if (bit === 0) lastDownAt = now;
    st.set('ready', 'Registering input');
  }

  function onPointerUp(e) {
    buttonNodes.get(e.button)?.classList.remove('is-down');
  }

  function onPointerMove(e) {
    const rect = pad.getBoundingClientRect();
    sPos.set(`${Math.round(e.clientX - rect.left)}, ${Math.round(e.clientY - rect.top)}`);
    if (e.movementX !== undefined) sMovement.set(`${e.movementX}, ${e.movementY}`);

    // Polling rate estimate: the browser coalesces pointer events to the frame
    // rate unless getCoalescedEvents is available, so prefer the coalesced list.
    const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [e];
    const now = performance.now();
    for (let i = 0; i < events.length; i += 1) moveTimes.push(now - (events.length - 1 - i) * 0);
    while (moveTimes.length > 60) moveTimes.shift();
    if (moveTimes.length >= 20) {
      const span = moveTimes[moveTimes.length - 1] - moveTimes[0];
      if (span > 0) sPolling.set(`~${Math.round(((moveTimes.length - 1) * 1000) / span)} Hz`);
    }
  }

  function onWheel(e) {
    e.preventDefault();
    wheelY += e.deltaY;
    wheelX += e.deltaX;
    sWheelY.set(`${Math.round(wheelY)} (${e.deltaY > 0 ? 'down' : 'up'})`);
    sWheelX.set(Math.round(wheelX));
    wheelNode.classList.remove('spin-up', 'spin-down');
    void wheelNode.offsetWidth;
    wheelNode.classList.add(e.deltaY > 0 ? 'spin-down' : 'spin-up');
  }

  const onContextMenu = (e) => e.preventDefault();
  const onAuxClick = (e) => e.preventDefault();

  function reset() {
    seen.clear();
    wheelX = 0;
    wheelY = 0;
    lastDownAt = 0;
    moveTimes.length = 0;
    sButtons.set('0 / 5');
    for (const node of buttonNodes.values()) node.classList.remove('is-seen', 'is-down');
    for (const s of [sLast, sPos, sMovement, sPolling, sWheelY, sWheelX, sDouble, sPointer]) s.set('—');
  }

  pad.addEventListener('pointerdown', onPointerDown);
  pad.addEventListener('pointerup', onPointerUp);
  pad.addEventListener('pointermove', onPointerMove);
  pad.addEventListener('wheel', onWheel, { passive: false });
  pad.addEventListener('contextmenu', onContextMenu);
  pad.addEventListener('auxclick', onAuxClick);

  return () => {
    pad.removeEventListener('pointerdown', onPointerDown);
    pad.removeEventListener('pointerup', onPointerUp);
    pad.removeEventListener('pointermove', onPointerMove);
    pad.removeEventListener('wheel', onWheel);
    pad.removeEventListener('contextmenu', onContextMenu);
    pad.removeEventListener('auxclick', onAuxClick);
  };
}
