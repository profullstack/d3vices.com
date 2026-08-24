import { button, el, note, status } from '../ui.js';

export const id = 'display';

const PATTERNS = [
  { name: 'White', css: '#ffffff', hint: 'Dust, dead pixels and screen-door effect show up best on white.' },
  {
    name: 'Black',
    css: '#000000',
    hint: 'Stuck subpixels and backlight bleed are visible on black in a dark room.',
  },
  { name: 'Red', css: '#ff0000' },
  { name: 'Green', css: '#00ff00' },
  { name: 'Blue', css: '#0000ff' },
  { name: 'Cyan', css: '#00ffff' },
  { name: 'Magenta', css: '#ff00ff' },
  { name: 'Yellow', css: '#ffff00' },
  { name: 'Grey 50%', css: '#808080', hint: 'An even mid-grey exposes tint and uniformity problems.' },
  {
    name: 'Greyscale ramp',
    css: 'linear-gradient(to right, #000 0%, #fff 100%)',
    hint: 'Look for banding — distinct steps instead of a smooth fade.',
  },
  { name: 'RGB ramp', css: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' },
  {
    name: 'Grid',
    css: 'repeating-linear-gradient(0deg,#fff 0 1px,#000 1px 32px), repeating-linear-gradient(90deg,#fff 0 1px,#000 1px 32px)',
    hint: 'Check geometry and sharpness across the whole panel.',
  },
];

export function supported() {
  return true;
}

export function mount(root) {
  const st = status('Idle');
  const surface = el('div.display-surface', { tabindex: '0' });
  const hint = el('div.display-hint');
  surface.append(hint);

  let index = 0;
  let active = false;

  const grid = el(
    'div.pattern-grid',
    ...PATTERNS.map((p, i) =>
      el(
        'button.pattern-swatch',
        {
          type: 'button',
          title: p.name,
          style: { background: p.css },
          onClick: () => enter(i),
        },
        el('span.pattern-name', { text: p.name }),
      ),
    ),
  );

  root.append(
    el(
      'div.controls',
      button('Start full-screen test', () => enter(0)),
    ),
    st.node,
    grid,
    surface,
    note(
      'Arrow keys or click move between patterns. Escape leaves. On a phone, tap the right half to advance and the left half to go back.',
    ),
  );

  function apply() {
    const p = PATTERNS[index];
    surface.style.background = p.css;
    hint.textContent = `${index + 1}/${PATTERNS.length} · ${p.name}${p.hint ? ` — ${p.hint}` : ''} · Esc to exit`;
    // Keep the hint legible whichever colour is underneath it.
    hint.style.color = ['White', 'Yellow', 'Cyan', 'Grey 50%', 'Greyscale ramp'].includes(p.name)
      ? '#000'
      : '#fff';
  }

  function enter(i) {
    index = i;
    active = true;
    surface.classList.add('is-active');
    apply();
    surface.focus();
    surface.requestFullscreen?.().catch(() => {
      // Fullscreen can be refused; the overlay still covers the viewport.
    });
    st.set('running', 'Full-screen pattern test running');
    document.addEventListener('keydown', onKey);
    surface.addEventListener('click', onClick);
    showHintBriefly();
  }

  let hintTimer = 0;
  function showHintBriefly() {
    hint.style.opacity = '1';
    clearTimeout(hintTimer);
    hintTimer = window.setTimeout(() => {
      hint.style.opacity = '0';
    }, 2600);
  }

  function exit() {
    active = false;
    surface.classList.remove('is-active');
    document.removeEventListener('keydown', onKey);
    surface.removeEventListener('click', onClick);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    st.set('idle', 'Stopped');
  }

  function next(delta) {
    index = (index + delta + PATTERNS.length) % PATTERNS.length;
    apply();
    showHintBriefly();
  }

  function onKey(e) {
    if (!active) return;
    if (e.key === 'Escape') {
      exit();
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
      e.preventDefault();
      next(1);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      next(-1);
    }
  }

  function onClick(e) {
    next(e.clientX < window.innerWidth / 2 ? -1 : 1);
  }

  const onFsChange = () => {
    // Leaving fullscreen with F11 or the system gesture must also leave the test.
    if (active && !document.fullscreenElement) exit();
  };
  document.addEventListener('fullscreenchange', onFsChange);

  return () => {
    exit();
    clearTimeout(hintTimer);
    document.removeEventListener('fullscreenchange', onFsChange);
  };
}
