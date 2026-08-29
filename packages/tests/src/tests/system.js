import { button, el, formatBytes, note, stat, statGrid, status } from '../ui.js';

export const id = 'system';

/** Every API the other tests depend on, so one page answers "will this work here?". */
const CAPABILITIES = [
  ['getUserMedia (camera & mic)', () => Boolean(navigator.mediaDevices?.getUserMedia)],
  ['getDisplayMedia (screen share)', () => Boolean(navigator.mediaDevices?.getDisplayMedia)],
  ['enumerateDevices', () => Boolean(navigator.mediaDevices?.enumerateDevices)],
  ['MediaRecorder', () => typeof window.MediaRecorder === 'function'],
  ['Web Audio', () => Boolean(window.AudioContext || window.webkitAudioContext)],
  ['Web MIDI', () => typeof navigator.requestMIDIAccess === 'function'],
  ['Gamepad API', () => typeof navigator.getGamepads === 'function'],
  ['Pointer Events', () => typeof window.PointerEvent === 'function'],
  ['Touch Events', () => 'ontouchstart' in window],
  ['Battery Status', () => typeof navigator.getBattery === 'function'],
  ['Geolocation', () => Boolean(navigator.geolocation)],
  ['Device orientation', () => typeof window.DeviceOrientationEvent !== 'undefined'],
  ['Device motion', () => typeof window.DeviceMotionEvent !== 'undefined'],
  ['AmbientLightSensor', () => typeof window.AmbientLightSensor === 'function'],
  ['Vibration', () => typeof navigator.vibrate === 'function'],
  ['Web Bluetooth', () => Boolean(navigator.bluetooth)],
  ['WebUSB', () => Boolean(navigator.usb)],
  ['WebHID', () => Boolean(navigator.hid)],
  ['Web Serial', () => Boolean(navigator.serial)],
  ['Web NFC', () => typeof window.NDEFReader === 'function'],
  [
    'WebGL 2',
    () => {
      try {
        return Boolean(document.createElement('canvas').getContext('webgl2'));
      } catch {
        return false;
      }
    },
  ],
  ['WebGPU', () => Boolean(navigator.gpu)],
  ['WebRTC', () => typeof window.RTCPeerConnection === 'function'],
  ['Service worker', () => 'serviceWorker' in navigator],
  ['Web Share', () => typeof navigator.share === 'function'],
  ['Wake Lock', () => Boolean(navigator.wakeLock)],
  ['Clipboard read', () => Boolean(navigator.clipboard?.readText)],
  ['Notifications', () => 'Notification' in window],
  ['Secure context', () => window.isSecureContext === true],
];

export function supported() {
  return true;
}

export function mount(root) {
  const st = status('Reading', 'Building system report');

  const stats = {
    browser: stat('Browser'),
    engine: stat('Engine'),
    os: stat('Operating system'),
    platform: stat('Platform'),
    cores: stat('Logical CPU cores'),
    memory: stat('Device memory'),
    gpu: stat('GPU'),
    gpuVendor: stat('GPU vendor'),
    languages: stat('Languages'),
    timezone: stat('Time zone'),
    storage: stat('Storage quota'),
    touchPoints: stat('Touch points'),
    online: stat('Network state'),
    runtime: stat('Runtime'),
  };

  const matrix = el('div.capability-grid');
  const copyBtn = button('Copy report', () => copyReport(), 'secondary');

  root.append(
    el(
      'div.controls',
      button('Re-read', () => read(), 'secondary'),
      copyBtn,
    ),
    st.node,
    statGrid(...Object.values(stats)),
    el('h2.test-subhead', 'Device APIs in this browser'),
    matrix,
    note(
      'A red entry means this browser does not expose that API — it says nothing about whether your hardware has the feature. Safari and Firefox deliberately omit several of these, which is why a test can be unavailable on one browser and work on the next.',
    ),
  );

  function detectBrowser() {
    const ua = navigator.userAgent;
    const brands = navigator.userAgentData?.brands
      ?.filter((b) => !/Not.?A.?Brand/i.test(b.brand))
      .map((b) => `${b.brand} ${b.version}`);
    if (brands?.length) return brands.join(', ');
    const match = ua.match(/(Firefox|Edg|OPR|Chrome|Safari|Version)\/([\d.]+)/g);
    return match ? match.join(' ') : ua.slice(0, 80);
  }

  function detectEngine() {
    const ua = navigator.userAgent;
    if (/Firefox|Gecko\/\d/.test(ua) && !/like Gecko/.test(ua)) return 'Gecko';
    if (/Chrome|Chromium|Edg|OPR/.test(ua)) return 'Blink';
    if (/Safari/.test(ua)) return 'WebKit';
    return 'unknown';
  }

  function detectOs() {
    const ua = navigator.userAgent;
    const platform = navigator.userAgentData?.platform;
    if (platform) return platform;
    if (/Windows NT 10/.test(ua)) return 'Windows 10 or 11';
    if (/Windows/.test(ua)) return 'Windows';
    if (/Android/.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS or iPadOS';
    if (/Mac OS X/.test(ua)) return 'macOS';
    if (/Linux/.test(ua)) return 'Linux';
    return 'unknown';
  }

  function gpuInfo() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return { renderer: 'no WebGL', vendor: '—' };
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
      };
    } catch {
      return { renderer: 'unavailable', vendor: '—' };
    }
  }

  async function read() {
    stats.browser.set(detectBrowser());
    stats.engine.set(detectEngine());
    stats.os.set(detectOs());
    stats.platform.set(navigator.platform || 'not reported');
    stats.cores.set(navigator.hardwareConcurrency ?? 'not reported');
    stats.memory.set(navigator.deviceMemory ? `${navigator.deviceMemory} GB or more` : 'not reported');
    const gpu = gpuInfo();
    stats.gpu.set(gpu.renderer);
    stats.gpuVendor.set(gpu.vendor);
    stats.languages.set((navigator.languages || [navigator.language]).join(', '));
    stats.timezone.set(Intl.DateTimeFormat().resolvedOptions().timeZone || 'not reported');
    stats.touchPoints.set(navigator.maxTouchPoints ?? 0);
    stats.online.set(navigator.onLine ? 'online' : 'offline');

    // The desktop build injects a bridge with facts a browser cannot see.
    const native = window.d3vices?.system ? await window.d3vices.system() : null;
    stats.runtime.set(
      native
        ? `d3vices desktop ${native.appVersion} · Electron ${native.electron}`
        : isStandalone()
          ? 'installed PWA'
          : 'browser tab',
    );
    if (native) {
      stats.os.set(`${native.osName} ${native.osRelease} (${native.arch})`);
      stats.cores.set(native.cpuCount);
      stats.memory.set(`${formatBytes(native.totalMemory)} total · ${formatBytes(native.freeMemory)} free`);
    }

    if (navigator.storage?.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        stats.storage.set(`${formatBytes(estimate.usage ?? 0)} used of ${formatBytes(estimate.quota ?? 0)}`);
      } catch {
        stats.storage.set('not reported');
      }
    } else {
      stats.storage.set('not reported');
    }

    matrix.textContent = '';
    for (const [name, probe] of CAPABILITIES) {
      let ok = false;
      try {
        ok = Boolean(probe());
      } catch {
        ok = false;
      }
      matrix.append(
        el(
          `div.capability${ok ? '.is-yes' : '.is-no'}`,
          el('span.capability-mark', { text: ok ? '✓' : '✕' }),
          el('span', { text: name }),
        ),
      );
    }

    st.set('ready', 'Report ready');
  }

  function isStandalone() {
    return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  async function copyReport() {
    const lines = Object.entries(stats).map(([, s]) => s.node.textContent);
    const caps = Array.from(matrix.children).map((c) => c.textContent);
    const text = [
      'd3vices.com system report',
      new Date().toISOString(),
      '',
      ...lines,
      '',
      'APIs:',
      ...caps,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'Copied';
      setTimeout(() => {
        copyBtn.textContent = 'Copy report';
      }, 1800);
    } catch {
      copyBtn.textContent = 'Copy blocked by browser';
    }
  }

  read();
  const onOnline = () => stats.online.set(navigator.onLine ? 'online' : 'offline');
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOnline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOnline);
  };
}
