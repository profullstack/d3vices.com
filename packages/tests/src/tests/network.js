import { button, el, note, stat, statGrid, status } from '../ui.js';

export const id = 'network';

/**
 * Throughput is measured against sized endpoints (/api/net/download, /api/net/upload)
 * and the payload grows until a transfer takes long enough to be meaningful.
 * Timing a small fixed asset measures the round trip, not the link: on a fast
 * connection the whole file lands inside one RTT and the result is a reading of
 * your latency wearing a megabit label.
 */
const TARGET_MS = 2500;
const SIZES = [256 * 1024, 1024 * 1024, 4 * 1024 * 1024, 16 * 1024 * 1024, 48 * 1024 * 1024];

export function supported() {
  return typeof fetch === 'function';
}

export function mount(root) {
  const st = status('Idle');
  // In the desktop build the app is served from a loopback server, so a test
  // against a relative URL would measure a socket to itself. The bridge points
  // it at the public endpoints instead.
  const base = window.d3vices?.netBase ?? '';
  const bar = el('div.progress-fill');
  const progress = el('div.progress', bar);
  const phase = el('div.progress-label', { text: 'Not started' });

  const sLatency = stat('Latency');
  const sJitter = stat('Jitter');
  const sLoss = stat('Failed probes', '0');
  const sDown = stat('Download');
  const sUp = stat('Upload');
  const sEffective = stat('Reported type');
  const sDownlink = stat('Reported downlink');
  const sRtt = stat('Reported RTT');
  const sSaveData = stat('Save-Data');

  const startBtn = button('Run network test', () => (running ? abort() : run()));

  root.append(
    el('div.controls', startBtn),
    st.node,
    progress,
    phase,
    statGrid(sLatency, sJitter, sLoss, sDown, sUp, sEffective, sDownlink, sRtt, sSaveData),
    note(
      'Latency and jitter come from repeated timed probes; throughput is measured against a payload that grows until the transfer is long enough to mean something. The "reported" values are what the browser claims, which is a coarse estimate rather than a measurement — and Firefox and Safari do not provide them at all.',
    ),
  );

  let running = false;
  let controller = null;

  readReported();

  function readReported() {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) {
      sEffective.set('not exposed');
      sDownlink.set('not exposed');
      sRtt.set('not exposed');
      sSaveData.set('not exposed');
      return;
    }
    sEffective.set(c.effectiveType || '—');
    sDownlink.set(c.downlink ? `${c.downlink} Mbps` : '—');
    sRtt.set(c.rtt !== undefined ? `${c.rtt} ms` : '—');
    sSaveData.set(c.saveData ? 'on' : 'off');
  }

  function setProgress(pct, label) {
    bar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    phase.textContent = label;
  }

  async function run() {
    running = true;
    controller = new AbortController();
    startBtn.textContent = 'Stop';
    st.set('running', 'Testing…');
    for (const s of [sLatency, sJitter, sDown, sUp]) s.set('…');
    sLoss.set(0);

    try {
      await latency();
      if (!running) return;
      await download();
      if (!running) return;
      await upload();
      setProgress(100, 'Complete');
      st.set('ready', 'Test complete');
    } catch (error) {
      if (error?.name === 'AbortError') {
        st.set('idle', 'Stopped');
        setProgress(0, 'Stopped');
      } else {
        st.set('error', `Test failed: ${error?.message ?? error}`);
      }
    } finally {
      running = false;
      controller = null;
      startBtn.textContent = 'Run network test';
      readReported();
    }
  }

  async function latency() {
    const samples = [];
    let failed = 0;
    for (let i = 0; i < 12 && running; i += 1) {
      setProgress((i / 12) * 25, `Measuring latency (${i + 1}/12)`);
      const started = performance.now();
      try {
        // A cache-busting query and no-store: a cached 304 would time the disk.
        const res = await fetch(`${base}/api/net/ping?n=${i}-${Math.random()}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        await res.arrayBuffer();
        samples.push(performance.now() - started);
      } catch (error) {
        if (error?.name === 'AbortError') throw error;
        failed += 1;
        sLoss.set(failed);
      }
    }
    if (!samples.length) {
      sLatency.set('unreachable');
      return;
    }
    // Discard the first probe: it pays for connection setup that later probes reuse.
    const timed = samples.length > 3 ? samples.slice(1) : samples;
    const mean = timed.reduce((a, b) => a + b, 0) / timed.length;
    const variance = timed.reduce((a, b) => a + (b - mean) ** 2, 0) / timed.length;
    sLatency.set(`${Math.round(mean)} ms`);
    sJitter.set(`${Math.round(Math.sqrt(variance))} ms`);
  }

  async function download() {
    let best = 0;
    for (const size of SIZES) {
      if (!running) return;
      setProgress(
        25 + (SIZES.indexOf(size) / SIZES.length) * 40,
        `Download — ${Math.round((size / 1024 / 1024) * 10) / 10 || '0.25'} MB`,
      );
      const started = performance.now();
      const res = await fetch(`${base}/api/net/download?bytes=${size}&r=${Math.random()}`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      const reader = res.body?.getReader();
      let received = 0;
      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          received += value.length;
        }
      } else {
        received = (await res.arrayBuffer()).byteLength;
      }
      const seconds = (performance.now() - started) / 1000;
      const mbps = (received * 8) / seconds / 1e6;
      best = Math.max(best, mbps);
      sDown.set(`${mbps.toFixed(1)} Mbps`);
      // Stop growing once a transfer took long enough to be a real measurement.
      if (seconds * 1000 >= TARGET_MS) break;
    }
    sDown.set(`${best.toFixed(1)} Mbps`);
  }

  async function upload() {
    let best = 0;
    for (const size of [256 * 1024, 1024 * 1024, 4 * 1024 * 1024, 16 * 1024 * 1024]) {
      if (!running) return;
      setProgress(
        65 + (size / (16 * 1024 * 1024)) * 30,
        `Upload — ${Math.round((size / 1024 / 1024) * 10) / 10 || '0.25'} MB`,
      );
      const payload = new Uint8Array(size);
      // Random bytes: a buffer of zeroes compresses to nothing in transit and
      // would report a throughput the link cannot actually deliver.
      for (let i = 0; i < size; i += 4096)
        crypto.getRandomValues(payload.subarray(i, Math.min(i + 4096, size)));
      const started = performance.now();
      await fetch(`${base}/api/net/upload`, {
        method: 'POST',
        body: payload,
        cache: 'no-store',
        signal: controller.signal,
      });
      const seconds = (performance.now() - started) / 1000;
      const mbps = (size * 8) / seconds / 1e6;
      best = Math.max(best, mbps);
      sUp.set(`${mbps.toFixed(1)} Mbps`);
      if (seconds * 1000 >= TARGET_MS) break;
    }
    sUp.set(`${best.toFixed(1)} Mbps`);
  }

  function abort() {
    running = false;
    controller?.abort();
  }

  return () => abort();
}
