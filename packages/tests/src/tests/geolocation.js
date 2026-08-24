import { button, el, note, stat, statGrid, status } from '../ui.js';

export const id = 'geolocation';

export function supported() {
  return Boolean(navigator.geolocation);
}

export function mount(root) {
  if (!supported()) {
    root.append(note('This browser does not expose the Geolocation API.', 'error'));
    return () => {};
  }

  const st = status('Idle');
  const sLat = stat('Latitude');
  const sLon = stat('Longitude');
  const sAccuracy = stat('Accuracy');
  const sAltitude = stat('Altitude');
  const sAltAccuracy = stat('Altitude accuracy');
  const sHeading = stat('Heading');
  const sSpeed = stat('Speed');
  const sUpdated = stat('Last fix');
  const sFixes = stat('Fixes', '0');

  const link = el(
    'a.maplink',
    { target: '_blank', rel: 'noopener noreferrer', style: { display: 'none' } },
    'Open this position in a map ↗',
  );
  const startBtn = button('Start location test', () => (watchId === null ? start() : stop()));

  root.append(
    el('div.controls', startBtn),
    st.node,
    statGrid(sLat, sLon, sAccuracy, sAltitude, sAltAccuracy, sHeading, sSpeed, sUpdated, sFixes),
    link,
    note(
      'The first fix is usually the coarsest — it often comes from your IP address or nearby wifi. Leave the watch running and the accuracy figure should tighten as GPS or more access points come in. Altitude, heading and speed are only filled in by devices with a real GNSS receiver, so a desktop leaves them empty.',
    ),
  );

  let watchId = null;
  let fixes = 0;

  function start() {
    st.set('running', 'Requesting permission…');
    fixes = 0;
    watchId = navigator.geolocation.watchPosition(onFix, onError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 30000,
    });
    startBtn.textContent = 'Stop';
  }

  function onFix(position) {
    const c = position.coords;
    fixes += 1;
    sFixes.set(fixes);
    sLat.set(c.latitude.toFixed(6));
    sLon.set(c.longitude.toFixed(6));
    sAccuracy.set(`± ${Math.round(c.accuracy)} m`);
    sAltitude.set(c.altitude === null ? 'not reported' : `${Math.round(c.altitude)} m`);
    sAltAccuracy.set(c.altitudeAccuracy === null ? 'not reported' : `± ${Math.round(c.altitudeAccuracy)} m`);
    sHeading.set(
      c.heading === null || Number.isNaN(c.heading) ? 'not reported' : `${Math.round(c.heading)}°`,
    );
    sSpeed.set(c.speed === null ? 'not reported' : `${(c.speed * 3.6).toFixed(1)} km/h`);
    sUpdated.set(new Date(position.timestamp).toLocaleTimeString());
    link.href = `https://www.openstreetmap.org/?mlat=${c.latitude}&mlon=${c.longitude}#map=16/${c.latitude}/${c.longitude}`;
    link.style.display = '';
    st.set('ready', `Fix ${fixes} — accurate to about ${Math.round(c.accuracy)} m`);
  }

  function onError(error) {
    const messages = {
      1: 'Permission was denied. Allow location access for this site and try again.',
      2: 'Position unavailable — no location source could produce a fix.',
      3: 'Timed out waiting for a fix.',
    };
    st.set('error', messages[error.code] ?? error.message);
  }

  function stop() {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    startBtn.textContent = 'Start location test';
    st.set('idle', 'Stopped');
  }

  return () => stop();
}
