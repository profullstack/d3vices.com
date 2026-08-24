import { button, el, note, stat, statGrid, status } from '../ui.js';

export const id = 'bluetooth';

export function supported() {
  return Boolean(navigator.bluetooth?.requestDevice);
}

export function mount(root) {
  const st = status('Idle');
  const sAvailable = stat('Adapter');
  const sName = stat('Device');
  const sConnected = stat('Connection');
  const sServices = stat('GATT services');
  const list = el('div.bt-services');

  if (!supported()) {
    root.append(
      st.node,
      statGrid(sAvailable),
      note(
        'This browser does not implement Web Bluetooth. It is available in Chromium-based desktop browsers and Chrome on Android; Firefox and Safari have declined to ship it. On Linux it also needs BlueZ with experimental features enabled.',
        'warn',
      ),
    );
    st.set('unsupported', 'navigator.bluetooth is not available here');
    return () => {};
  }

  const scanBtn = button('Scan for devices', () => scan());
  root.append(
    el('div.controls', scanBtn),
    st.node,
    statGrid(sAvailable, sName, sConnected, sServices),
    list,
    note(
      'Web Bluetooth cannot list nearby devices on its own — the browser shows its own chooser and only tells the page about the one device you pick. That is a deliberate privacy boundary, not a limitation of this test.',
    ),
  );

  navigator.bluetooth
    .getAvailability?.()
    .then((available) => {
      sAvailable.set(available ? 'present and powered' : 'unavailable or powered off');
    })
    .catch(() => sAvailable.set('unknown'));

  let device = null;

  async function scan() {
    st.set('running', 'Opening the browser’s device chooser…');
    try {
      device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        // Ask for the services a page is allowed to read once connected.
        optionalServices: ['device_information', 'battery_service', 'generic_access', 'generic_attribute'],
      });
    } catch (error) {
      if (error?.name === 'NotFoundError') st.set('idle', 'No device was chosen.');
      else st.set('error', `Scan failed: ${error?.message ?? error}`);
      return;
    }

    sName.set(device.name || 'unnamed device');
    st.set('running', 'Connecting…');

    try {
      const server = await device.gatt.connect();
      sConnected.set('connected');
      const services = await server.getPrimaryServices();
      sServices.set(services.length);
      list.textContent = '';
      for (const service of services) {
        const characteristics = await service.getCharacteristics().catch(() => []);
        list.append(
          el(
            'div.bt-service',
            el('strong', { text: service.uuid }),
            el('span', {
              text: `${characteristics.length} characteristic${characteristics.length === 1 ? '' : 's'}`,
            }),
          ),
        );
      }
      st.set('ready', `Connected to ${device.name || 'the device'}`);
      device.addEventListener('gattserverdisconnected', () => {
        sConnected.set('disconnected');
        st.set('idle', 'The device disconnected.');
      });
    } catch (error) {
      sConnected.set('failed');
      st.set('error', `Could not read GATT services: ${error?.message ?? error}`);
    }
  }

  return () => {
    try {
      device?.gatt?.disconnect();
    } catch {
      /* already gone */
    }
  };
}
