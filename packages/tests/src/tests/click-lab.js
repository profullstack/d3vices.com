import { button, el, note, stat, statGrid, status, storage } from '../ui.js';

/**
 * The shared engine behind the click-speed, Kohi and jitter tests. They differ
 * only in the durations offered and in which statistics are worth showing, so
 * they share one timing implementation rather than three that drift apart.
 *
 * The clock starts on the FIRST click, never on a countdown: a countdown
 * measures your reaction to the countdown as well as your clicking.
 */
export function clickLab({ storageKey, durations, defaultDuration, showConsistency = false, ranks }) {
  return function mount(root) {
    const st = status('Ready', 'Click the pad to start');
    const pad = el(
      'div.click-pad',
      { tabindex: '0' },
      el('div.click-pad-inner', el('div.click-big', { text: '0' }), el('div.click-sub', { text: 'clicks' })),
    );
    const bigNode = pad.querySelector('.click-big');
    const subNode = pad.querySelector('.click-sub');

    const sCps = stat('Clicks per second');
    const sClicks = stat('Clicks', '0');
    const sLeft = stat('Time left');
    const sBest = stat('Personal best');
    const sRank = stat('Rank');
    const sConsistency = showConsistency ? stat('Consistency (σ)') : null;
    const sFastest = showConsistency ? stat('Fastest gap') : null;

    let duration = defaultDuration;
    const durationButtons = durations.map((d) =>
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
      b.dataset.duration = String(durations[i]);
    });
    durationButtons[durations.indexOf(defaultDuration)]?.classList.add('is-active');

    const history = el('ol.history');

    root.append(
      durations.length > 1
        ? el(
            'div.controls',
            ...durationButtons,
            button('Reset', () => reset(), 'ghost'),
          )
        : el(
            'div.controls',
            button('Reset', () => reset(), 'ghost'),
          ),
      st.node,
      pad,
      statGrid(...[sCps, sClicks, sLeft, sBest, sRank, sConsistency, sFastest].filter(Boolean)),
      el(
        'div.history-wrap',
        el('h3', 'Recent runs'),
        history,
        button(
          'Clear history',
          () => {
            storage.remove(storageKey);
            renderHistory();
          },
          'ghost',
        ),
      ),
      note(
        'Scores are kept in this browser only — there is no account and no leaderboard to game. The clock starts on your first click.',
      ),
    );

    let running = false;
    let clicks = 0;
    let startedAt = 0;
    let raf = 0;
    const times = [];

    function onPress(e) {
      e.preventDefault();
      pad.focus();
      const now = performance.now();

      if (!running) {
        running = true;
        clicks = 0;
        times.length = 0;
        startedAt = now;
        st.set('running', 'Go!');
        setDurationButtonsDisabled(true);
        tick();
      }
      if (now - startedAt > duration * 1000) return;

      clicks += 1;
      times.push(now);
      bigNode.textContent = String(clicks);
      sClicks.set(clicks);

      const elapsed = (now - startedAt) / 1000;
      if (elapsed > 0.05) sCps.set((clicks / elapsed).toFixed(2));

      ripple(e);
    }

    function ripple(e) {
      const rect = pad.getBoundingClientRect();
      const dot = el('span.click-ripple', {
        style: {
          left: `${(e.clientX ?? rect.width / 2) - rect.left}px`,
          top: `${(e.clientY ?? rect.height / 2) - rect.top}px`,
        },
      });
      pad.append(dot);
      setTimeout(() => dot.remove(), 500);
    }

    function tick() {
      const loop = () => {
        if (!running) return;
        const elapsed = (performance.now() - startedAt) / 1000;
        const left = Math.max(0, duration - elapsed);
        sLeft.set(`${left.toFixed(2)}s`);
        subNode.textContent = `${left.toFixed(1)}s left`;
        pad.style.setProperty('--progress', `${Math.min(100, (elapsed / duration) * 100)}%`);
        if (left <= 0) finish();
        else raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    function finish() {
      running = false;
      cancelAnimationFrame(raf);
      setDurationButtonsDisabled(false);
      const cps = clicks / duration;
      sCps.set(cps.toFixed(2));
      sLeft.set('0.00s');
      subNode.textContent = 'click to run again';

      if (showConsistency && times.length > 2) {
        const gaps = times.slice(1).map((t, i) => t - times[i]);
        const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        const variance = gaps.reduce((a, b) => a + (b - mean) ** 2, 0) / gaps.length;
        sConsistency.set(`${Math.sqrt(variance).toFixed(1)} ms`);
        sFastest.set(`${Math.round(Math.min(...gaps))} ms`);
      }

      const rank = rankFor(cps);
      sRank.set(rank);
      st.set('ready', `${cps.toFixed(2)} clicks per second — ${rank}`);

      const entry = { cps: Number(cps.toFixed(2)), clicks, duration, at: Date.now() };
      const all = storage.get(storageKey, []);
      all.unshift(entry);
      storage.set(storageKey, all.slice(0, 20));
      renderHistory();
    }

    function rankFor(cps) {
      for (const r of ranks) if (cps >= r.min) return r.name;
      return ranks[ranks.length - 1].name;
    }

    function setDurationButtonsDisabled(disabled) {
      for (const b of durationButtons) b.disabled = disabled;
    }

    function renderHistory() {
      const all = storage.get(storageKey, []);
      history.textContent = '';
      const best = all.reduce((m, r) => Math.max(m, r.cps), 0);
      sBest.set(best ? `${best.toFixed(2)} CPS` : '—');
      if (!all.length) {
        history.append(el('li.history-empty', { text: 'No runs yet.' }));
        return;
      }
      for (const r of all.slice(0, 8)) {
        history.append(
          el(
            'li.history-row',
            el('span.history-cps', { text: `${r.cps.toFixed(2)} CPS` }),
            el('span', { text: `${r.clicks} clicks in ${r.duration}s` }),
            el('time', { text: new Date(r.at).toLocaleString() }),
          ),
        );
      }
    }

    function reset() {
      running = false;
      cancelAnimationFrame(raf);
      clicks = 0;
      times.length = 0;
      bigNode.textContent = '0';
      subNode.textContent = `${duration}s run — click to start`;
      pad.style.setProperty('--progress', '0%');
      sCps.set('—');
      sClicks.set(0);
      sLeft.set(`${duration.toFixed(2)}s`);
      sRank.set('—');
      sConsistency?.set('—');
      sFastest?.set('—');
      setDurationButtonsDisabled(false);
      st.set('idle', 'Click the pad to start');
    }

    const onKey = (e) => {
      if (e.key === ' ' && document.activeElement === pad) onPress(e);
    };
    pad.addEventListener('pointerdown', onPress);
    pad.addEventListener('keydown', onKey);
    pad.addEventListener('contextmenu', (e) => e.preventDefault());
    pad.style.touchAction = 'manipulation';

    reset();
    renderHistory();

    return () => {
      cancelAnimationFrame(raf);
      pad.removeEventListener('pointerdown', onPress);
      pad.removeEventListener('keydown', onKey);
    };
  };
}

export const CLICK_RANKS = [
  { min: 12, name: 'Inhuman — check your mouse for double-firing' },
  { min: 10, name: 'Elite' },
  { min: 8, name: 'Very fast' },
  { min: 6.5, name: 'Fast' },
  { min: 5, name: 'Above average' },
  { min: 3.5, name: 'Average' },
  { min: 0, name: 'Warming up' },
];
