import { button, el, note, stat, statGrid, status, storage } from '../ui.js';

export const id = 'scroll';

const STORAGE_KEY = 'd3vices:scroll-history';

/**
 * Wheel deltas arrive in three different units depending on the device and the
 * browser. Normalising to "lines" is what lets a trackpad, a notched wheel and
 * a free-spinning wheel be compared on one scale.
 */
function toLines(delta, mode) {
  if (mode === 1) return delta; // DOM_DELTA_LINE
  if (mode === 2) return delta * 30; // DOM_DELTA_PAGE, ~30 lines to a page
  return delta / 16; // DOM_DELTA_PIXEL, ~16px to a line
}

export function supported() {
  return true;
}

export function mount(root) {
  const st = status('Ready', 'Scroll inside the pad to start');
  const pad = el(
    'div.scroll-pad',
    { tabindex: '0' },
    el('div.scroll-arrow.up', { text: '▲' }),
    el('div.scroll-readout', el('div.click-big', { text: '0' }), el('div.click-sub', { text: 'lines' })),
    el('div.scroll-arrow.down', { text: '▼' }),
  );
  const bigNode = pad.querySelector('.click-big');
  const subNode = pad.querySelector('.click-sub');
  const upArrow = pad.querySelector('.scroll-arrow.up');
  const downArrow = pad.querySelector('.scroll-arrow.down');

  const sSpeed = stat('Lines per second');
  const sLines = stat('Lines', '0');
  const sEvents = stat('Wheel events', '0');
  const sLeft = stat('Time left');
  const sMode = stat('Delta mode');
  const sBest = stat('Personal best');

  let duration = 5;
  const durationButtons = [5, 10, 30].map((d) =>
    button(
      `${d}s`,
      () => {
        if (running) return;
        duration = d;
        for (const b of durationButtons) b.classList.toggle('is-active', Number(b.dataset.duration) === d);
        reset();
      },
      'secondary',
    ),
  );
  durationButtons.forEach((b, i) => {
    b.dataset.duration = String([5, 10, 30][i]);
  });
  durationButtons[0].classList.add('is-active');

  root.append(
    el(
      'div.controls',
      ...durationButtons,
      button('Reset', () => reset(), 'ghost'),
    ),
    st.node,
    pad,
    statGrid(sSpeed, sLines, sEvents, sLeft, sMode, sBest),
    note(
      'Deltas are normalised to lines: a pixel-mode trackpad and a line-mode wheel produce very different raw numbers for the same physical movement. Direction is ignored — spinning either way counts.',
    ),
  );

  let running = false;
  let lines = 0;
  let events = 0;
  let startedAt = 0;
  let raf = 0;

  function onWheel(e) {
    e.preventDefault();
    const now = performance.now();
    if (!running) {
      running = true;
      lines = 0;
      events = 0;
      startedAt = now;
      st.set('running', 'Go!');
      for (const b of durationButtons) b.disabled = true;
      tick();
    }
    if (now - startedAt > duration * 1000) return;

    lines += Math.abs(toLines(e.deltaY, e.deltaMode)) + Math.abs(toLines(e.deltaX, e.deltaMode));
    events += 1;
    bigNode.textContent = String(Math.round(lines));
    sLines.set(Math.round(lines));
    sEvents.set(events);
    sMode.set(['pixel', 'line', 'page'][e.deltaMode] ?? e.deltaMode);

    const arrow = e.deltaY < 0 ? upArrow : downArrow;
    arrow.classList.remove('is-hit');
    void arrow.offsetWidth;
    arrow.classList.add('is-hit');
  }

  function tick() {
    const loop = () => {
      if (!running) return;
      const elapsed = (performance.now() - startedAt) / 1000;
      const left = Math.max(0, duration - elapsed);
      sLeft.set(`${left.toFixed(2)}s`);
      subNode.textContent = `${left.toFixed(1)}s left`;
      if (elapsed > 0.05) sSpeed.set((lines / elapsed).toFixed(1));
      pad.style.setProperty('--progress', `${Math.min(100, (elapsed / duration) * 100)}%`);
      if (left <= 0) finish();
      else raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  function finish() {
    running = false;
    cancelAnimationFrame(raf);
    for (const b of durationButtons) b.disabled = false;
    const lps = lines / duration;
    sSpeed.set(lps.toFixed(1));
    sLeft.set('0.00s');
    subNode.textContent = 'scroll to run again';
    st.set('ready', `${lps.toFixed(1)} lines per second`);

    const history = storage.get(STORAGE_KEY, []);
    history.unshift({ lps: Number(lps.toFixed(1)), duration, at: Date.now() });
    storage.set(STORAGE_KEY, history.slice(0, 20));
    renderBest();
  }

  function renderBest() {
    const history = storage.get(STORAGE_KEY, []);
    const best = history.reduce((m, r) => Math.max(m, r.lps), 0);
    sBest.set(best ? `${best.toFixed(1)} lines/s` : '—');
  }

  function reset() {
    running = false;
    cancelAnimationFrame(raf);
    lines = 0;
    events = 0;
    bigNode.textContent = '0';
    subNode.textContent = `${duration}s run — scroll to start`;
    pad.style.setProperty('--progress', '0%');
    sSpeed.set('—');
    sLines.set(0);
    sEvents.set(0);
    sLeft.set(`${duration.toFixed(2)}s`);
    for (const b of durationButtons) b.disabled = false;
    st.set('idle', 'Scroll inside the pad to start');
  }

  pad.addEventListener('wheel', onWheel, { passive: false });
  reset();
  renderBest();

  return () => {
    cancelAnimationFrame(raf);
    pad.removeEventListener('wheel', onWheel);
  };
}
