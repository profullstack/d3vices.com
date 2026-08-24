import { button, el, hidpiCanvas, note, stat, statGrid, status } from '../ui.js';

export const id = 'touch';

const COLOURS = [
  '#3ddc97',
  '#ff6b6b',
  '#4dabf7',
  '#ffd43b',
  '#da77f2',
  '#ff922b',
  '#20c997',
  '#f783ac',
  '#748ffc',
  '#94d82d',
];

export function supported() {
  return true;
}

export function mount(root) {
  const st = status('Ready', 'Touch the pad with one or more fingers');
  const surface = hidpiCanvas(360);
  surface.canvas.classList.add('touch-canvas');

  const sMax = stat('Max touch points', navigator.maxTouchPoints ?? 0);
  const sActive = stat('Active contacts', '0');
  const sPeak = stat('Peak simultaneous', '0');
  const sPressure = stat('Pressure');
  const sSize = stat('Contact size');
  const sType = stat('Pointer type');
  const sTilt = stat('Tilt');

  root.append(
    el(
      'div.controls',
      button('Clear', () => clear(), 'secondary'),
    ),
    st.node,
    el('div.panel', surface.canvas),
    statGrid(sMax, sActive, sPeak, sPressure, sSize, sType, sTilt),
    note(
      'Drag across the whole surface to find dead zones — a gap in the trail is a gap in the digitiser. Pressure and contact size are reported by very few devices; a flat 0.5 pressure means the browser is substituting a default, not that your screen measured one.',
    ),
  );

  const active = new Map();
  let peak = 0;

  surface.observe();

  function draw(e, isStart) {
    const rect = surface.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const colour = COLOURS[(e.pointerId ?? 0) % COLOURS.length];
    const ctx = surface.ctx;

    const prev = active.get(e.pointerId);
    ctx.strokeStyle = colour;
    ctx.lineWidth = Math.max(2, (e.width || 8) * (e.pressure ? 0.5 + e.pressure : 1));
    ctx.lineCap = 'round';
    if (prev && !isStart) {
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.fillStyle = colour;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(4, (e.width || 10) / 2), 0, Math.PI * 2);
      ctx.fill();
    }
    active.set(e.pointerId, { x, y });

    sPressure.set(e.pressure ? e.pressure.toFixed(3) : 'not reported');
    sSize.set(e.width || e.height ? `${Math.round(e.width)} × ${Math.round(e.height)}` : 'not reported');
    sType.set(e.pointerType || 'unknown');
    sTilt.set(e.tiltX || e.tiltY ? `${e.tiltX}°, ${e.tiltY}°` : 'not reported');
  }

  function onDown(e) {
    e.preventDefault();
    surface.canvas.setPointerCapture?.(e.pointerId);
    draw(e, true);
    if (active.size > peak) {
      peak = active.size;
      sPeak.set(peak);
    }
    sActive.set(active.size);
    st.set('ready', `${active.size} contact${active.size === 1 ? '' : 's'}`);
  }

  function onMove(e) {
    if (!active.has(e.pointerId)) return;
    e.preventDefault();
    draw(e, false);
  }

  function onUp(e) {
    active.delete(e.pointerId);
    sActive.set(active.size);
    st.set('ready', active.size ? `${active.size} contact${active.size === 1 ? '' : 's'}` : 'Released');
  }

  function clear() {
    surface.resize();
    surface.ctx.clearRect(0, 0, surface.cssWidth(), surface.cssHeight());
    active.clear();
    peak = 0;
    sPeak.set(0);
    sActive.set(0);
  }

  surface.canvas.addEventListener('pointerdown', onDown);
  surface.canvas.addEventListener('pointermove', onMove);
  surface.canvas.addEventListener('pointerup', onUp);
  surface.canvas.addEventListener('pointercancel', onUp);
  surface.canvas.addEventListener('pointerleave', onUp);
  // Without this, a drag scrolls the page out from under the test on mobile.
  surface.canvas.style.touchAction = 'none';

  return () => {
    surface.stop();
    surface.canvas.removeEventListener('pointerdown', onDown);
    surface.canvas.removeEventListener('pointermove', onMove);
    surface.canvas.removeEventListener('pointerup', onUp);
    surface.canvas.removeEventListener('pointercancel', onUp);
    surface.canvas.removeEventListener('pointerleave', onUp);
  };
}
