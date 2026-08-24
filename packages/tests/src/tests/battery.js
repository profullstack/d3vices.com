import { el, formatDuration, note, stat, statGrid, status } from '../ui.js';

export const id = 'battery';

export function supported() {
  return typeof navigator.getBattery === 'function';
}

export function mount(root) {
  if (!supported()) {
    root.append(
      note(
        'This browser does not expose the Battery Status API. Firefox and Safari removed it for fingerprinting reasons, and it is not available on desktop Safari at all. That is a browser policy decision, not a fault in your battery.',
        'warn',
      ),
    );
    return () => {};
  }

  const st = status('Reading', 'Reading battery status');
  const fill = el('div.battery-fill');
  const pct = el('div.battery-pct', { text: '—' });
  const graphic = el('div.battery', fill, pct, el('div.battery-cap'));

  const sLevel = stat('Charge');
  const sCharging = stat('State');
  const sTimeFull = stat('Time to full');
  const sTimeEmpty = stat('Time remaining');

  root.append(
    st.node,
    el('div.panel.panel-centre', graphic),
    statGrid(sLevel, sCharging, sTimeFull, sTimeEmpty),
    note(
      'Times are the browser’s own estimate and often read as unknown right after a state change — the operating system needs a little while to settle on a figure.',
    ),
  );

  let battery = null;
  const events = ['levelchange', 'chargingchange', 'chargingtimechange', 'dischargingtimechange'];

  function update() {
    if (!battery) return;
    const level = Math.round(battery.level * 100);
    sLevel.set(`${level}%`);
    pct.textContent = `${level}%`;
    fill.style.width = `${level}%`;
    fill.classList.toggle('is-low', level <= 20 && !battery.charging);
    fill.classList.toggle('is-charging', battery.charging);
    sCharging.set(battery.charging ? 'Charging' : 'On battery');
    sTimeFull.set(
      battery.charging && Number.isFinite(battery.chargingTime) && battery.chargingTime > 0
        ? formatDuration(battery.chargingTime)
        : battery.charging
          ? 'unknown'
          : '—',
    );
    sTimeEmpty.set(
      !battery.charging && Number.isFinite(battery.dischargingTime)
        ? formatDuration(battery.dischargingTime)
        : !battery.charging
          ? 'unknown'
          : '—',
    );
    st.set('ready', battery.charging ? 'Charging' : 'Running on battery');
  }

  navigator
    .getBattery()
    .then((b) => {
      battery = b;
      for (const e of events) b.addEventListener(e, update);
      update();
    })
    .catch((error) => {
      st.set('error', `Battery status unavailable: ${error?.message ?? error}`);
    });

  return () => {
    if (battery) for (const e of events) battery.removeEventListener(e, update);
  };
}
