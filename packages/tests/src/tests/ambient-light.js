import { button, el, note, stat, statGrid, status } from '../ui.js';

export const id = 'ambient-light';

export function supported() {
  return typeof window.AmbientLightSensor === 'function';
}

export function mount(root) {
  const st = status('Idle');
  const sLux = stat('Illuminance');
  const sDescribe = stat('Roughly');
  const sMin = stat('Lowest seen');
  const sMax = stat('Highest seen');
  const gauge = el('div.light-gauge', el('div.light-gauge-fill'));
  const fill = gauge.querySelector('.light-gauge-fill');

  if (!supported()) {
    root.append(
      note(
        'This browser has no AmbientLightSensor. It ships in Chromium behind the "Generic Sensor Extra Classes" flag and is absent from Firefox and Safari entirely, so on most machines there is nothing to read here — that is the browser, not your hardware.',
        'warn',
      ),
      statGrid(sLux, sDescribe),
    );
    st.set('unsupported', 'AmbientLightSensor is not available in this browser');
    root.prepend(st.node);
    return () => {};
  }

  const startBtn = button('Start light sensor', () => (sensor ? stop() : start()));
  root.append(
    el('div.controls', startBtn),
    st.node,
    el('div.panel.panel-centre', gauge),
    statGrid(sLux, sDescribe, sMin, sMax),
    note(
      'Cover the sensor with your hand and the reading should drop within a second. The sensor is usually beside the front camera.',
    ),
  );

  let sensor = null;
  let min = Number.POSITIVE_INFINITY;
  let max = 0;

  function describe(lux) {
    if (lux < 1) return 'pitch dark';
    if (lux < 50) return 'a dim room';
    if (lux < 200) return 'a lit room at night';
    if (lux < 1000) return 'a bright room or overcast daylight';
    if (lux < 10000) return 'daylight indoors near a window';
    return 'direct sunlight';
  }

  async function start() {
    try {
      if (navigator.permissions?.query) {
        const permission = await navigator.permissions.query({ name: 'ambient-light-sensor' });
        if (permission.state === 'denied') {
          st.set('error', 'Sensor permission was denied for this site.');
          return;
        }
      }
    } catch {
      // Not every browser knows this permission name; the sensor itself will tell us.
    }

    try {
      sensor = new AmbientLightSensor({ frequency: 5 });
    } catch (error) {
      st.set('error', `The sensor could not be created: ${error?.message ?? error}`);
      return;
    }

    sensor.addEventListener('reading', () => {
      const lux = sensor.illuminance ?? 0;
      sLux.set(`${Math.round(lux)} lux`);
      sDescribe.set(describe(lux));
      min = Math.min(min, lux);
      max = Math.max(max, lux);
      sMin.set(`${Math.round(min)} lux`);
      sMax.set(`${Math.round(max)} lux`);
      // Log scale: the useful range spans five orders of magnitude.
      fill.style.height = `${Math.min(100, (Math.log10(Math.max(lux, 1)) / 5) * 100)}%`;
      st.set('ready', 'Reading');
    });

    sensor.addEventListener('error', (event) => {
      const name = event.error?.name;
      st.set(
        'error',
        name === 'NotAllowedError'
          ? 'Sensor permission was denied.'
          : name === 'NotReadableError'
            ? 'No ambient light sensor could be read on this device.'
            : `Sensor error: ${event.error?.message ?? name}`,
      );
      stop();
    });

    sensor.start();
    startBtn.textContent = 'Stop';
    st.set('running', 'Starting sensor…');
  }

  function stop() {
    sensor?.stop();
    sensor = null;
    startBtn.textContent = 'Start light sensor';
    st.set('idle', 'Stopped');
  }

  return () => stop();
}
