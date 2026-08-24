import { button, el, note, stat, statGrid, status, storage } from '../ui.js';

export const id = 'reaction';

const ROUNDS = 5;
const STORAGE_KEY = 'd3vices:reaction-history';

export function supported() {
  return true;
}

export function mount(root) {
  const st = status('Ready', 'Click the panel to begin');
  const pad = el(
    'div.reaction-pad',
    { tabindex: '0', 'data-state': 'idle' },
    el('div.reaction-headline', { text: 'Click to begin' }),
    el('div.reaction-sub', { text: 'Then wait for green' }),
  );
  const headline = pad.querySelector('.reaction-headline');
  const sub = pad.querySelector('.reaction-sub');

  const sLast = stat('Last');
  const sMedian = stat('Median');
  const sBest = stat('Best');
  const sRound = stat('Round', `0 / ${ROUNDS}`);
  const sAllTime = stat('All-time best');

  const rounds = el('div.reaction-rounds');
  const colourBlind = el('input', { type: 'checkbox' });
  colourBlind.checked = storage.get('d3vices:reaction-highcontrast', false);
  colourBlind.addEventListener('change', () => {
    storage.set('d3vices:reaction-highcontrast', colourBlind.checked);
    pad.classList.toggle('is-highcontrast', colourBlind.checked);
  });
  pad.classList.toggle('is-highcontrast', colourBlind.checked);

  root.append(
    el(
      'div.controls',
      button('Reset', () => resetSession(), 'secondary'),
      el('label.checkbox', colourBlind, el('span', 'High-contrast mode (not red/green)')),
    ),
    st.node,
    pad,
    rounds,
    statGrid(sLast, sMedian, sBest, sRound, sAllTime),
    note(
      'Five rounds give a median rather than one lucky number. Your reaction includes your display’s own latency and the browser’s frame timing, so this measures the whole chain from screen to switch, not your nervous system alone.',
    ),
  );

  let state = 'idle'; // idle | waiting | signal | done
  let waitTimer = 0;
  let signalAt = 0;
  const results = [];

  function setPad(next, title, subtitle) {
    state = next;
    pad.dataset.state = next;
    headline.textContent = title;
    sub.textContent = subtitle;
  }

  function beginRound() {
    if (results.length >= ROUNDS) resetSession();
    setPad(
      'waiting',
      'Wait…',
      colourBlind.checked ? 'Click when the panel turns light' : 'Click when the panel turns green',
    );
    st.set('running', `Round ${results.length + 1} of ${ROUNDS}`);
    // A random 1.2–4.5s delay: anything predictable can be anticipated, which
    // measures rhythm rather than reaction.
    const delay = 1200 + Math.random() * 3300;
    waitTimer = window.setTimeout(() => {
      signalAt = performance.now();
      setPad('signal', 'Now!', 'Click');
    }, delay);
  }

  function onPress() {
    pad.focus();
    if (state === 'idle' || state === 'done') {
      beginRound();
      return;
    }
    if (state === 'waiting') {
      clearTimeout(waitTimer);
      setPad('idle', 'Too soon', 'Click to try that round again');
      st.set('error', 'You clicked before the signal — that round does not count');
      return;
    }
    if (state === 'signal') {
      const ms = Math.round(performance.now() - signalAt);
      results.push(ms);
      sLast.set(`${ms} ms`);
      sRound.set(`${results.length} / ${ROUNDS}`);
      renderRounds();

      const sorted = [...results].sort((a, b) => a - b);
      sMedian.set(`${sorted[Math.floor(sorted.length / 2)]} ms`);
      sBest.set(`${sorted[0]} ms`);

      if (results.length >= ROUNDS) {
        const median = sorted[Math.floor(sorted.length / 2)];
        const history = storage.get(STORAGE_KEY, []);
        history.unshift({ median, best: sorted[0], at: Date.now() });
        storage.set(STORAGE_KEY, history.slice(0, 20));
        renderAllTime();
        setPad('done', `${median} ms`, 'Median of five — click to run again');
        st.set('ready', `Median ${median} ms · ${describe(median)}`);
      } else {
        setPad('idle', `${ms} ms`, 'Click for the next round');
        st.set('ready', `${ms} ms`);
      }
    }
  }

  function describe(ms) {
    if (ms < 180) return 'exceptional';
    if (ms < 220) return 'fast';
    if (ms < 270) return 'about average';
    if (ms < 350) return 'a little slow';
    return 'slow — check whether your display is in a high-latency mode';
  }

  function renderRounds() {
    rounds.textContent = '';
    for (let i = 0; i < ROUNDS; i += 1) {
      rounds.append(
        el(`div.reaction-round${results[i] !== undefined ? '.is-done' : ''}`, {
          text: results[i] !== undefined ? `${results[i]} ms` : `${i + 1}`,
        }),
      );
    }
  }

  function renderAllTime() {
    const history = storage.get(STORAGE_KEY, []);
    const best = history.reduce((m, r) => (m === null ? r.best : Math.min(m, r.best)), null);
    sAllTime.set(best === null ? '—' : `${best} ms`);
  }

  function resetSession() {
    clearTimeout(waitTimer);
    results.length = 0;
    sLast.set('—');
    sMedian.set('—');
    sBest.set('—');
    sRound.set(`0 / ${ROUNDS}`);
    renderRounds();
    setPad('idle', 'Click to begin', 'Then wait for green');
    st.set('idle', 'Ready');
  }

  const onKey = (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && document.activeElement === pad) {
      e.preventDefault();
      onPress();
    }
  };

  pad.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    onPress();
  });
  pad.addEventListener('keydown', onKey);
  pad.style.touchAction = 'manipulation';

  resetSession();
  renderAllTime();

  return () => {
    clearTimeout(waitTimer);
    pad.removeEventListener('keydown', onKey);
  };
}
