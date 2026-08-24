const {
  app,
  BrowserWindow,
  desktopCapturer,
  ipcMain,
  Menu,
  screen,
  session,
  shell,
  systemPreferences,
} = require('electron');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { startServer } = require('./server.js');

const execFileAsync = promisify(execFile);
const SITE_ROOT = path.join(__dirname, '..', 'site');

// Screen capture on Wayland goes through xdg-desktop-portal and PipeWire. Without
// this, getDisplayMedia on a Wayland session returns a black frame or nothing.
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-features', 'WebRTCPipeWireCapturer');
}

let mainWindow = null;
let httpServer = null;

async function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 480,
    minHeight: 520,
    backgroundColor: '#0b0f14',
    title: 'd3vices',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: process.platform !== 'darwin',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // The tests are the whole product; without this the renderer cannot open
      // a camera or a microphone at all.
      webSecurity: true,
    },
  });

  await mainWindow.loadURL(`http://127.0.0.1:${port}/`);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Anything that is not this app opens in the user's real browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://127.0.0.1:${port}`)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

function configurePermissions(port) {
  const ses = session.defaultSession;
  const origin = `http://127.0.0.1:${port}`;

  // Everything these tests need, and nothing else. A permission missing here is
  // refused silently by Chromium and surfaces in the page as a hardware error.
  const ALLOWED = new Set([
    'media',
    'audioCapture',
    'videoCapture',
    'display-capture',
    'geolocation',
    'midi',
    'midiSysex',
    'notifications',
    'fullscreen',
    'pointerLock',
    'clipboard-read',
    'clipboard-sanitized-write',
    'hid',
    'usb',
    'serial',
    'bluetooth',
  ]);

  ses.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const requesting = details?.requestingUrl || webContents?.getURL() || '';
    callback(requesting.startsWith(origin) && ALLOWED.has(permission));
  });
  ses.setPermissionCheckHandler(
    (_wc, permission, requestingOrigin) =>
      (requestingOrigin === origin || requestingOrigin === '') && ALLOWED.has(permission),
  );

  // Since Electron 17 getDisplayMedia does nothing unless the app supplies a
  // source. Chromium's own picker is used where the platform has one, so the
  // user chooses a window rather than the app choosing for them.
  ses.setDisplayMediaRequestHandler(
    async (_request, callback) => {
      try {
        const sources = await desktopCapturer.getSources({
          types: ['screen', 'window'],
          thumbnailSize: { width: 0, height: 0 },
        });
        if (!sources.length) {
          callback({});
          return;
        }
        callback({ video: sources[0], audio: process.platform === 'win32' ? 'loopback' : undefined });
      } catch {
        callback({});
      }
    },
    // Ask Chromium to show its native picker when the platform supports it.
    { useSystemPicker: true },
  );

  // Web Bluetooth, WebHID and WebUSB each hand the app a device list and wait
  // for a choice. Without a handler the promise never settles and the test
  // simply hangs, which reads as broken hardware.
  ses.on('select-bluetooth-device', (event, devices, callback) => {
    event.preventDefault();
    if (!devices.length) callback('');
    else callback(devices[0].deviceId);
  });
  ses.on('select-hid-device', (event, details, callback) => {
    event.preventDefault();
    callback(details.deviceList[0]?.deviceId ?? null);
  });
  ses.on('select-usb-device', (event, details, callback) => {
    event.preventDefault();
    callback(details.deviceList[0]?.deviceId ?? null);
  });
}

// ------------------------------------------------------------------ native IPC

ipcMain.handle('d3vices:system', () => ({
  appVersion: app.getVersion(),
  electron: process.versions.electron,
  chrome: process.versions.chrome,
  node: process.versions.node,
  platform: process.platform,
  arch: process.arch,
  osName: osDisplayName(),
  osRelease: os.release(),
  cpuModel: os.cpus()[0]?.model ?? 'unknown',
  cpuCount: os.cpus().length,
  totalMemory: os.totalmem(),
  freeMemory: os.freemem(),
  uptime: os.uptime(),
  hostname: os.hostname(),
}));

ipcMain.handle('d3vices:displays', () => {
  const primary = screen.getPrimaryDisplay();
  return screen.getAllDisplays().map((d) => ({
    id: d.id,
    isPrimary: d.id === primary.id,
    label: d.label || `Display ${d.id}`,
    bounds: d.bounds,
    workArea: d.workArea,
    scaleFactor: d.scaleFactor,
    rotation: d.rotation,
    colorDepth: d.colorDepth,
    colorSpace: d.colorSpace,
    // Chromium reports 0 when it does not know, which is not the same as 0 Hz.
    refreshRate: d.displayFrequency || null,
    internal: d.internal,
  }));
});

ipcMain.handle('d3vices:disks', async () => {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execFileAsync('wmic', ['logicaldisk', 'get', 'caption,freespace,size'], {
        windowsHide: true,
      });
      return stdout
        .split(/\r?\n/)
        .slice(1)
        .map((line) => line.trim().split(/\s+/))
        .filter((parts) => parts.length === 3)
        .map(([mount, free, size]) => ({ mount, free: Number(free), size: Number(size) }));
    }
    const { stdout } = await execFileAsync('df', ['-kP']);
    return stdout
      .split('\n')
      .slice(1)
      .map((line) => line.trim().split(/\s+/))
      .filter((parts) => parts.length >= 6 && parts[0].startsWith('/'))
      .map((parts) => ({
        mount: parts[5],
        size: Number(parts[1]) * 1024,
        free: Number(parts[3]) * 1024,
      }));
  } catch {
    return [];
  }
});

/**
 * macOS refuses camera and microphone access to an app that has not asked the
 * system for it first — the browser-level prompt alone is not enough, and the
 * failure looks like a device that will not open.
 */
ipcMain.handle('d3vices:media-access', async (_event, kind) => {
  if (process.platform !== 'darwin') return 'granted';
  const status = systemPreferences.getMediaAccessStatus(kind);
  if (status === 'granted') return 'granted';
  const ok = await systemPreferences.askForMediaAccess(kind);
  return ok ? 'granted' : 'denied';
});

ipcMain.handle('d3vices:open-external', (_event, url) => {
  if (/^https?:\/\//.test(url)) shell.openExternal(url);
});

/**
 * CI has no way to click through the app, so the app proves itself: load a test
 * page, wait for the module to replace its placeholder, and report.
 */
async function runSmokeTest(port) {
  try {
    await mainWindow.loadURL(`http://127.0.0.1:${port}/keyboard`);
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const mounted = await mainWindow.webContents.executeJavaScript(
      `(() => {
        const host = document.querySelector('[data-test]');
        return Boolean(host) && !host.textContent.includes('Loading the test') && host.children.length > 0;
      })()`,
    );
    const bridged = await mainWindow.webContents.executeJavaScript(
      'Boolean(window.d3vices && window.d3vices.isDesktop)',
    );
    const info = await mainWindow.webContents.executeJavaScript('window.d3vices.system()');

    if (!mounted) throw new Error('the test module never mounted');
    if (!bridged) throw new Error('the preload bridge is missing');
    if (!info?.cpuCount) throw new Error('the native system bridge returned nothing');

    console.log(
      `[smoke] ok — Electron ${process.versions.electron}, ${info.osName} ${info.arch}, ${info.cpuCount} cores`,
    );
    app.exit(0);
  } catch (error) {
    console.error(`[smoke] FAILED: ${error?.message ?? error}`);
    app.exit(1);
  }
}

function osDisplayName() {
  if (process.platform === 'darwin') return 'macOS';
  if (process.platform === 'win32') return 'Windows';
  return os.type();
}

// ---------------------------------------------------------------- app lifecycle

app.whenReady().then(async () => {
  const started = await startServer(SITE_ROOT);
  httpServer = started.server;
  configurePermissions(started.port);
  Menu.setApplicationMenu(await buildMenu(started.port));
  await createWindow(started.port);

  if (process.env.D3VICES_SMOKE) {
    await runSmokeTest(started.port);
    return;
  }

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow(started.port);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  httpServer?.close();
});

async function buildMenu(port) {
  // The registry is ESM and shared verbatim with the website; the packaging
  // step copies it in so the menu and the site can never list different tests.
  const { TESTS, GROUPS } = await import('./registry.mjs');
  const testMenus = GROUPS.map((group) => ({
    label: group.name,
    submenu: TESTS.filter((t) => t.group === group.id).map((t) => ({
      label: t.short,
      click: () => mainWindow?.loadURL(`http://127.0.0.1:${port}/${t.slug}`),
    })),
  }));

  return Menu.buildFromTemplate([
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Home',
          accelerator: 'CmdOrCtrl+H',
          click: () => mainWindow?.loadURL(`http://127.0.0.1:${port}/`),
        },
        { type: 'separator' },
        process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' },
      ],
    },
    { label: 'Tests', submenu: testMenus },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [
        { label: 'd3vices.com', click: () => shell.openExternal('https://d3vices.com') },
        {
          label: 'Source on GitHub',
          click: () => shell.openExternal('https://github.com/profullstack/d3vices.com'),
        },
      ],
    },
  ]);
}
