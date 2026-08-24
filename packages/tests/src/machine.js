import { button, el, formatBytes, formatDuration, note, stat, statGrid, status } from './ui.js';

/**
 * The "This machine" screen. Everything here comes from the desktop bridge —
 * a browser tab can see one display, no disks and no CPU model, so in a browser
 * this page says exactly that instead of rendering an empty shell.
 */
export function mountMachine(root) {
  const bridge = window.d3vices;

  if (!bridge?.system) {
    root.textContent = '';
    root.append(
      note(
        'This page reads your machine directly, which a browser tab is not allowed to do — it can see one display, no disks and no CPU model. Install the desktop app and this fills in.',
        'warn',
      ),
      el('div.controls', el('a.btn.btn-primary', { href: '/download' }, 'Get the desktop app')),
    );
    return () => {};
  }

  const st = status('Reading', 'Reading this machine');
  const sSystem = stat('System');
  const sCpu = stat('Processor');
  const sMemory = stat('Memory');
  const sUptime = stat('Uptime');
  const sRuntime = stat('Runtime');
  const sHost = stat('Host');

  const displayStage = el('div.display-stage');
  const displayList = el('div.display-list');
  const diskList = el('div.disk-list');
  const deviceList = el('div.display-list');

  const copyBtn = button('Copy report', () => copyReport(), 'secondary');

  root.textContent = '';
  root.append(
    el('div.controls', copyBtn),
    st.node,
    statGrid(sSystem, sCpu, sMemory, sUptime, sRuntime, sHost),
    el(
      'div.machine-cols',
      el('div', el('h3.rack-group', { text: 'DISPLAYS' }), displayStage, displayList),
      el(
        'div',
        el('h3.rack-group', { text: 'DEVICES' }),
        deviceList,
        el('h3.rack-group', { text: 'DISKS', style: { marginTop: '1.4rem' } }),
        diskList,
      ),
    ),
    note(
      'Nothing on this page is transmitted. "Copy report" puts the readings on your clipboard, and that is the only thing here that moves data anywhere.',
    ),
  );

  let snapshot = null;

  (async () => {
    try {
      const [system, displays, disks] = await Promise.all([
        bridge.system(),
        bridge.displays?.() ?? [],
        bridge.disks?.() ?? [],
      ]);
      snapshot = { system, displays, disks };

      sSystem.set(`${system.osName} ${system.osRelease}`);
      sCpu.set(`${system.cpuModel} · ${system.cpuCount} cores`);
      sMemory.set(`${formatBytes(system.totalMemory)} · ${formatBytes(system.freeMemory)} free`);
      sUptime.set(formatDuration(system.uptime));
      sRuntime.set(`Electron ${system.electron} · Chromium ${system.chrome}`);
      sHost.set(`${system.hostname} (${system.arch})`);

      renderDisplays(displays);
      renderDisks(disks);
      await renderDevices();

      st.set('ready', 'Report ready');
    } catch (error) {
      st.set('error', `Could not read this machine: ${error?.message ?? error}`);
    }
  })();

  /** Displays drawn to relative scale — the part a browser genuinely cannot show. */
  function renderDisplays(displays) {
    displayStage.textContent = '';
    displayList.textContent = '';
    if (!displays.length) {
      displayList.append(note('No displays were reported.', 'warn'));
      return;
    }

    const widest = Math.max(...displays.map((d) => d.bounds.width));
    for (const d of displays) {
      const scale = Math.max(0.16, (d.bounds.width / widest) * 0.52);
      const box = el(
        'div.display-box',
        {
          class: d.isPrimary ? 'display-box is-primary' : 'display-box',
          style: {
            width: `${Math.round(d.bounds.width * scale * 0.11)}px`,
            height: `${Math.round(d.bounds.height * scale * 0.11)}px`,
          },
        },
        el('span', { text: `${d.bounds.width} × ${d.bounds.height}` }),
        el('span', { text: `${d.scaleFactor}× · ${d.refreshRate ? `${d.refreshRate} Hz` : 'rate n/a'}` }),
      );
      displayStage.append(box);

      displayList.append(
        el(
          'div.display-row',
          el('strong', { text: d.label }),
          el('span', {
            text: `${d.isPrimary ? 'PRIMARY' : 'EXTERNAL'}${d.internal ? ' · BUILT IN' : ''} · ${d.colorDepth}-bit`,
          }),
        ),
      );
    }
  }

  function renderDisks(disks) {
    diskList.textContent = '';
    if (!disks.length) {
      diskList.append(note('No disks were reported on this platform.', 'warn'));
      return;
    }
    for (const disk of disks) {
      if (!disk.size) continue;
      const usedPct = Math.round(((disk.size - disk.free) / disk.size) * 100);
      const fill = el('div.disk-fill', { style: { width: `${usedPct}%` } });
      if (usedPct >= 95) fill.classList.add('is-full');
      diskList.append(
        el(
          'div.disk-row',
          el(
            'div.disk-head',
            el('span.disk-mount', { text: disk.mount }),
            el('span.disk-free', { text: `${formatBytes(disk.free)} free of ${formatBytes(disk.size)}` }),
          ),
          el('div.disk-bar', fill),
        ),
      );
    }
  }

  /**
   * Device labels are only readable once media permission has been granted at
   * least once — that is true in Electron as well as in a browser, so the page
   * says which state it is in rather than pretending the names are always there.
   */
  async function renderDevices() {
    deviceList.textContent = '';
    if (!navigator.mediaDevices?.enumerateDevices) {
      deviceList.append(note('This runtime cannot enumerate media devices.', 'warn'));
      return;
    }
    const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
    const wanted = devices.filter((d) => d.kind !== 'audiooutput' || d.deviceId !== 'default');
    if (!wanted.length) {
      deviceList.append(note('No audio or video devices were found.', 'warn'));
      return;
    }
    const KIND = { audioinput: 'AUDIO IN', audiooutput: 'AUDIO OUT', videoinput: 'VIDEO IN' };
    let unnamed = 0;
    for (const d of wanted) {
      if (!d.label) unnamed += 1;
      deviceList.append(
        el(
          'div.display-row',
          el('strong', { text: d.label || `Unnamed ${KIND[d.kind]?.toLowerCase() ?? d.kind}` }),
          el('span', { text: KIND[d.kind] ?? d.kind.toUpperCase() }),
        ),
      );
    }
    if (unnamed) {
      deviceList.append(
        note(
          `${unnamed} device${unnamed === 1 ? '' : 's'} could not be named — labels unlock after you grant microphone or camera access once, in the desktop app as well as in a browser.`,
        ),
      );
    }
  }

  async function copyReport() {
    if (!snapshot) return;
    const { system, displays, disks } = snapshot;
    const lines = [
      'd3vices machine report',
      new Date().toISOString(),
      '',
      `System    ${system.osName} ${system.osRelease} (${system.arch})`,
      `Processor ${system.cpuModel} · ${system.cpuCount} cores`,
      `Memory    ${formatBytes(system.totalMemory)} total · ${formatBytes(system.freeMemory)} free`,
      `Runtime   d3vices ${system.appVersion} · Electron ${system.electron} · Chromium ${system.chrome}`,
      '',
      'Displays:',
      ...displays.map(
        (d) =>
          `  ${d.label} — ${d.bounds.width}x${d.bounds.height} @ ${d.scaleFactor}x${d.refreshRate ? `, ${d.refreshRate}Hz` : ''}${d.isPrimary ? ' (primary)' : ''}`,
      ),
      '',
      'Disks:',
      ...disks
        .filter((d) => d.size)
        .map((d) => `  ${d.mount} — ${formatBytes(d.free)} free of ${formatBytes(d.size)}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      copyBtn.textContent = 'Copied';
      setTimeout(() => {
        copyBtn.textContent = 'Copy report';
      }, 1800);
    } catch {
      copyBtn.textContent = 'Copy blocked';
    }
  }

  return () => {};
}

/** The always-visible status bar in the desktop build. */
export async function mountStatusBar() {
  const bar = document.querySelector('[data-status-bar]');
  const bridge = window.d3vices;
  if (!bar || !bridge?.system) return;

  try {
    const [system, displays] = await Promise.all([bridge.system(), bridge.displays?.() ?? []]);
    bar.querySelector('[data-status-system]').textContent =
      `${system.osName} ${system.osRelease} · ${system.arch}`;
    bar.querySelector('[data-status-cpu]').textContent = `${system.cpuCount} cores`;
    bar.querySelector('[data-status-memory]').textContent =
      `${formatBytes(system.totalMemory)} · ${formatBytes(system.freeMemory)} free`;
    bar.querySelector('[data-status-displays]').textContent =
      `${displays.length} display${displays.length === 1 ? '' : 's'}`;
    bar.hidden = false;
  } catch {
    // A status bar that cannot be filled is better left hidden than half-empty.
  }
}
