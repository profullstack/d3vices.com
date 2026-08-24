/**
 * Tiny DOM helpers shared by every test module. No framework, no build-time
 * dependency: these run identically in a browser tab, an installed PWA and an
 * Electron renderer.
 */

/** el('div.card', { id: 'x' }, child, child) */
export function el(spec, props, ...children) {
  const [tag, ...classes] = String(spec).split('.');
  const node = document.createElement(tag || 'div');
  if (classes.length) node.className = classes.join(' ');
  if (props && typeof props === 'object' && !(props instanceof Node) && !Array.isArray(props)) {
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') node.className = [node.className, v].filter(Boolean).join(' ');
      else if (k === 'text') node.textContent = String(v);
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function')
        node.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
      else node.setAttribute(k, v === true ? '' : String(v));
    }
  } else if (props !== undefined && props !== null) {
    children.unshift(props);
  }
  for (const child of children.flat(Infinity)) {
    if (child === undefined || child === null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function button(label, onClick, variant = 'primary') {
  return el(`button.btn.btn-${variant}`, { type: 'button', onClick }, label);
}

/** A labelled readout whose value is updated in place. */
export function stat(label, initial = '—') {
  const value = el('div.stat-value', { text: initial });
  const node = el('div.stat', el('div.stat-label', { text: label }), value);
  return {
    node,
    set: (v) => {
      value.textContent = v === undefined || v === null || v === '' ? '—' : String(v);
    },
  };
}

export function statGrid(...stats) {
  return el('div.stat-grid', ...stats.map((s) => s.node));
}

/**
 * The status pill every test shares: idle -> running -> ready | error.
 * A test that cannot run at all on this platform reports 'unsupported', which
 * is a fact about the browser, not a failure of the hardware.
 */
export function status(initial = 'Idle') {
  const dot = el('span.status-dot');
  const text = el('span.status-text', { text: initial });
  const node = el('div.status', dot, text);
  return {
    node,
    set(state, message) {
      node.dataset.state = state;
      text.textContent = message ?? state;
    },
  };
}

export function note(text, kind = 'info') {
  return el(`p.note.note-${kind}`, { text });
}

/** A canvas that stays sharp on HiDPI and follows its container's width. */
export function hidpiCanvas(height = 180) {
  const canvas = el('canvas.canvas', { height });
  const ctx = canvas.getContext('2d');
  let ro;
  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || canvas.parentElement?.clientWidth || 600;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const observe = () => {
    resize();
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(resize);
      ro.observe(canvas);
    } else {
      window.addEventListener('resize', resize);
    }
  };
  const stop = () => {
    ro?.disconnect();
    window.removeEventListener('resize', resize);
  };
  return {
    canvas,
    ctx,
    observe,
    stop,
    resize,
    cssWidth: () => canvas.clientWidth || 600,
    cssHeight: () => height,
  };
}

/** A <select> of media devices, repopulated once labels unlock after permission. */
export function deviceSelect(kind, label) {
  const select = el('select.select', { 'aria-label': label });
  select.append(el('option', { value: '' }, `Default ${label}`));
  const refresh = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    let devices = [];
    try {
      devices = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === kind);
    } catch {
      return [];
    }
    const previous = select.value;
    select.textContent = '';
    select.append(el('option', { value: '' }, `Default ${label}`));
    devices.forEach((d, i) => {
      // Labels are empty until the user has granted permission at least once.
      select.append(el('option', { value: d.deviceId }, d.label || `${label} ${i + 1}`));
    });
    if (previous && devices.some((d) => d.deviceId === previous)) select.value = previous;
    return devices;
  };
  return { node: select, refresh, value: () => select.value || undefined };
}

export function formatBytes(n) {
  if (!Number.isFinite(n)) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/** Human-readable reason a getUserMedia-style call failed. */
export function mediaErrorMessage(error, what = 'device') {
  const name = error?.name || '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return `Permission was denied. Allow ${what} access for this site, then start the test again.`;
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return `No ${what} was found. Connect one and reload the page.`;
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return `The ${what} is busy. Another application is probably using it — close it and try again.`;
  }
  if (name === 'OverconstrainedError') {
    return `The selected ${what} cannot deliver the requested settings.`;
  }
  if (name === 'SecurityError') {
    return `Blocked by the browser. ${what} access needs a secure origin (https or localhost).`;
  }
  return error?.message ? `${name || 'Error'}: ${error.message}` : 'The test could not start.';
}

/** localStorage that never throws (Safari private mode, disabled storage). */
export const storage = {
  get(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* storage disabled */
    }
  },
};
