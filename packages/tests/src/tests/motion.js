import { button, el, note, stat, statGrid, status } from '../ui.js';

export const id = 'motion';

export function supported() {
  return (
    typeof window.DeviceOrientationEvent !== 'undefined' || typeof window.DeviceMotionEvent !== 'undefined'
  );
}

export function mount(root) {
  if (!supported()) {
    root.append(
      note(
        'This browser exposes neither DeviceOrientationEvent nor DeviceMotionEvent. Most desktops have no motion sensors to report.',
        'warn',
      ),
    );
    return () => {};
  }

  const st = status('Idle');
  const cube = el(
    'div.cube',
    ...['front', 'back', 'right', 'left', 'top', 'bottom'].map((face) =>
      el(`div.cube-face.cube-${face}`, { text: face }),
    ),
  );
  const scene = el('div.cube-scene', cube);

  const sAlpha = stat('Alpha (compass)');
  const sBeta = stat('Beta (front/back tilt)');
  const sGamma = stat('Gamma (left/right tilt)');
  const sAbsolute = stat('Absolute');
  const sAccel = stat('Acceleration');
  const sAccelG = stat('With gravity');
  const sRotation = stat('Rotation rate');
  const sInterval = stat('Sample interval');
  const sEvents = stat('Events', '0');

  const startBtn = button('Start motion test', () => (listening ? stop() : start()));

  root.append(
    el('div.controls', startBtn),
    st.node,
    el('div.panel.panel-centre', scene),
    statGrid(sAlpha, sBeta, sGamma, sAbsolute, sAccel, sAccelG, sRotation, sInterval, sEvents),
    note(
      'iOS requires an explicit permission request from a real tap, which is why this test has a button rather than starting on its own. Alpha is only a true compass heading when the event reports itself as absolute.',
    ),
  );

  let listening = false;
  let events = 0;

  async function start() {
    // iOS 13+ gates both event types behind a request that must come from a gesture.
    for (const Ctor of [window.DeviceOrientationEvent, window.DeviceMotionEvent]) {
      if (typeof Ctor?.requestPermission === 'function') {
        try {
          const result = await Ctor.requestPermission();
          if (result !== 'granted') {
            st.set(
              'error',
              'Motion access was denied. On iOS, re-enable it in Settings → Safari → Motion & Orientation Access.',
            );
            return;
          }
        } catch (error) {
          st.set('error', `Motion permission request failed: ${error?.message ?? error}`);
          return;
        }
      }
    }

    window.addEventListener('deviceorientation', onOrientation);
    window.addEventListener('deviceorientationabsolute', onOrientation);
    window.addEventListener('devicemotion', onMotion);
    listening = true;
    events = 0;
    startBtn.textContent = 'Stop';
    st.set('running', 'Listening — tilt and move your device');

    // A device with no sensors fires nothing at all, which is worth saying.
    setTimeout(() => {
      if (listening && events === 0) {
        st.set(
          'warn',
          'No motion events arrived. This device probably has no motion sensors, or the browser is blocking them.',
        );
      }
    }, 2500);
  }

  function onOrientation(e) {
    events += 1;
    sEvents.set(events);
    const alpha = e.alpha ?? 0;
    const beta = e.beta ?? 0;
    const gamma = e.gamma ?? 0;
    sAlpha.set(e.alpha === null ? 'not reported' : `${alpha.toFixed(1)}°`);
    sBeta.set(e.beta === null ? 'not reported' : `${beta.toFixed(1)}°`);
    sGamma.set(e.gamma === null ? 'not reported' : `${gamma.toFixed(1)}°`);
    sAbsolute.set(e.absolute ? 'yes — true compass heading' : 'no — relative to where it started');
    cube.style.transform = `rotateX(${beta}deg) rotateY(${gamma}deg) rotateZ(${alpha}deg)`;
    if (st.node.dataset.state !== 'ready') st.set('ready', 'Receiving orientation');
  }

  function onMotion(e) {
    events += 1;
    const a = e.acceleration;
    const ag = e.accelerationIncludingGravity;
    const r = e.rotationRate;
    sAccel.set(a && a.x !== null ? `${fmt(a.x)}, ${fmt(a.y)}, ${fmt(a.z)} m/s²` : 'not reported');
    sAccelG.set(ag && ag.x !== null ? `${fmt(ag.x)}, ${fmt(ag.y)}, ${fmt(ag.z)} m/s²` : 'not reported');
    sRotation.set(
      r && r.alpha !== null ? `${fmt(r.alpha)}, ${fmt(r.beta)}, ${fmt(r.gamma)} °/s` : 'not reported',
    );
    sInterval.set(e.interval ? `${e.interval} ms` : 'not reported');
  }

  const fmt = (v) => (v === null || v === undefined ? '—' : v.toFixed(2));

  function stop() {
    window.removeEventListener('deviceorientation', onOrientation);
    window.removeEventListener('deviceorientationabsolute', onOrientation);
    window.removeEventListener('devicemotion', onMotion);
    listening = false;
    startBtn.textContent = 'Start motion test';
    st.set('idle', 'Stopped');
  }

  return () => stop();
}
