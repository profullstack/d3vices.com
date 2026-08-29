import { button, el, note, stat, statGrid, status } from '../ui.js';

export const id = 'screen-info';

export function supported() {
  return true;
}

export function mount(root) {
  const st = status('Reading', 'Reading display information');

  const stats = {
    resolution: stat('Screen resolution'),
    available: stat('Available area'),
    viewport: stat('Viewport'),
    dpr: stat('Device pixel ratio'),
    physical: stat('Physical pixels'),
    depth: stat('Colour depth'),
    gamut: stat('Colour gamut'),
    hdr: stat('Dynamic range'),
    refresh: stat('Refresh rate', 'measuring…'),
    orientation: stat('Orientation'),
    touch: stat('Touch points'),
    motion: stat('Reduced motion'),
    scheme: stat('Colour scheme'),
    safeArea: stat('Safe-area insets'),
  };

  root.append(
    el(
      'div.controls',
      button('Re-read', () => read(), 'secondary'),
    ),
    st.node,
    statGrid(...Object.values(stats)),
    note(
      'Physical pixels are the CSS resolution multiplied by the device pixel ratio — on a HiDPI display these differ, and that difference is why a 4K laptop reports 1920 × 1080 to the page. The refresh rate is measured from animation frames, so a browser that throttles a background tab will read low.',
    ),
  );

  function q(query) {
    return typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
  }

  /** The desktop build can see every display; a browser only ever sees one. */
  async function readNativeDisplays() {
    if (!window.d3vices?.displays) return;
    const displays = await window.d3vices.displays();
    if (!displays?.length) return;
    const list = el('div.display-list');
    for (const d of displays) {
      list.append(
        el(
          'div.display-row',
          el('strong', {
            text: `${d.label}${d.isPrimary ? ' (primary)' : ''}${d.internal ? ' · built in' : ''}`,
          }),
          el('span', {
            text: `${d.bounds.width} × ${d.bounds.height} @ ${d.scaleFactor}× · ${d.refreshRate ? `${d.refreshRate} Hz` : 'refresh rate not reported'} · ${d.colorDepth}-bit ${d.colorSpace || ''}`.trim(),
          }),
        ),
      );
    }
    root.append(el('h2.test-subhead', `All displays (${displays.length})`), list);
  }

  function read() {
    const s = window.screen || {};
    const dpr = window.devicePixelRatio || 1;
    stats.resolution.set(s.width && s.height ? `${s.width} × ${s.height}` : '—');
    stats.available.set(s.availWidth && s.availHeight ? `${s.availWidth} × ${s.availHeight}` : '—');
    stats.viewport.set(`${window.innerWidth} × ${window.innerHeight}`);
    stats.dpr.set(dpr);
    stats.physical.set(s.width ? `${Math.round(s.width * dpr)} × ${Math.round(s.height * dpr)}` : '—');
    stats.depth.set(s.colorDepth ? `${s.colorDepth}-bit` : '—');
    stats.gamut.set(
      q('(color-gamut: rec2020)')
        ? 'rec2020'
        : q('(color-gamut: p3)')
          ? 'display-p3'
          : q('(color-gamut: srgb)')
            ? 'sRGB'
            : 'not reported',
    );
    stats.hdr.set(
      q('(dynamic-range: high)')
        ? 'high (HDR)'
        : q('(dynamic-range: standard)')
          ? 'standard'
          : 'not reported',
    );
    stats.orientation.set(
      s.orientation?.type || (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'),
    );
    stats.touch.set(navigator.maxTouchPoints ?? 0);
    stats.motion.set(q('(prefers-reduced-motion: reduce)') ? 'reduce' : 'no-preference');
    stats.scheme.set(q('(prefers-color-scheme: dark)') ? 'dark' : 'light');

    const probe = el('div', {
      style: {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '0',
        height: '0',
        paddingTop: 'env(safe-area-inset-top)',
        paddingRight: 'env(safe-area-inset-right)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
      },
    });
    document.body.append(probe);
    const cs = getComputedStyle(probe);
    const insets = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map((v) =>
      Math.round(Number.parseFloat(v) || 0),
    );
    probe.remove();
    stats.safeArea.set(insets.some((v) => v > 0) ? insets.join(' / ') : 'none');

    st.set('ready', 'Display information read');
  }

  /**
   * Refresh rate from the interval between animation frames. The median of many
   * frames, not the mean: one long frame from a garbage collection would drag a
   * mean well below the real rate.
   */
  function measureRefresh() {
    const gaps = [];
    let last = 0;
    let frames = 0;
    let raf = 0;
    const tick = (now) => {
      if (last) gaps.push(now - last);
      last = now;
      frames += 1;
      if (frames < 120) raf = requestAnimationFrame(tick);
      else {
        gaps.sort((a, b) => a - b);
        const median = gaps[Math.floor(gaps.length / 2)];
        stats.refresh.set(median > 0 ? `${Math.round(1000 / median)} Hz` : '—');
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }

  read();
  readNativeDisplays();
  const stopRefresh = measureRefresh();
  const onResize = () => read();
  window.addEventListener('resize', onResize);
  window.screen?.orientation?.addEventListener?.('change', onResize);

  return () => {
    stopRefresh();
    window.removeEventListener('resize', onResize);
    window.screen?.orientation?.removeEventListener?.('change', onResize);
  };
}
