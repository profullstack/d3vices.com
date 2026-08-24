import { button, el, note, stat, statGrid, status } from '../ui.js';

export const id = 'vibration';

const PATTERNS = [
  { name: 'Short buzz', pattern: 200 },
  { name: 'Long buzz', pattern: 1000 },
  { name: 'Double tap', pattern: [100, 80, 100] },
  { name: 'SOS', pattern: [100, 80, 100, 80, 100, 240, 300, 80, 300, 80, 300, 240, 100, 80, 100, 80, 100] },
  { name: 'Heartbeat', pattern: [120, 90, 220, 600, 120, 90, 220] },
];

export function supported() {
  return typeof navigator.vibrate === 'function';
}

export function mount(root) {
  const st = status('Idle');
  const sSupported = stat('API present', supported() ? 'yes' : 'no');
  const sLast = stat('Last pattern');
  const sAccepted = stat('Call accepted');

  if (!supported()) {
    root.append(
      st.node,
      statGrid(sSupported),
      note(
        'This browser does not implement the Vibration API. Desktop browsers and iOS Safari have no vibration motor to drive — the API is Android-only in practice.',
        'warn',
      ),
    );
    st.set('unsupported', 'navigator.vibrate is not available here');
    return () => {};
  }

  const buttons = PATTERNS.map((p) =>
    button(
      p.name,
      () => {
        // A `true` return only means the call was accepted. A desktop Chrome
        // accepts it and nothing moves, which is why this is labelled carefully.
        const accepted = navigator.vibrate(p.pattern);
        sLast.set(p.name);
        sAccepted.set(accepted ? 'yes' : 'no');
        st.set(
          accepted ? 'ready' : 'warn',
          accepted
            ? 'The browser accepted the call. If nothing moved, this device has no vibration motor.'
            : 'The browser refused the call.',
        );
      },
      'secondary',
    ),
  );

  root.append(
    el(
      'div.controls',
      ...buttons,
      button(
        'Stop',
        () => {
          navigator.vibrate(0);
          st.set('idle', 'Stopped');
        },
        'ghost',
      ),
    ),
    st.node,
    statGrid(sSupported, sLast, sAccepted),
    note(
      'Chrome on Android requires you to have interacted with the page before it will vibrate, which a button press satisfies.',
    ),
  );

  return () => {
    try {
      navigator.vibrate(0);
    } catch {
      /* nothing to cancel */
    }
  };
}
