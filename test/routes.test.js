import { describe, expect, test } from 'bun:test';
import app from '../apps/web/src/app.js';
import { TESTS } from '../packages/tests/src/registry.js';

const get = (path, init) => app.fetch(new Request(`http://localhost${path}`, init));

describe('routes', () => {
  test('every test in the registry has a page', async () => {
    for (const t of TESTS) {
      const res = await get(`/${t.slug}`);
      expect(res.status).toBe(200);
      const html = await res.text();
      // The client mounts by this attribute; without it the page is inert.
      expect(html).toContain(`data-test="${t.id}"`);
    }
  });

  test('every page is a real document, not a quirks-mode fragment', async () => {
    for (const path of ['/', '/about', '/privacy', '/download', '/microphone']) {
      const html = await (await get(path)).text();
      expect(html.startsWith('<!doctype html>')).toBe(true);
    }
  });

  test('an unknown path renders the 404 page rather than throwing', async () => {
    const res = await get('/no-such-test');
    expect(res.status).toBe(404);
    expect(await res.text()).toContain('does not exist');
  });

  test('the sitemap lists every test exactly once', async () => {
    const xml = await (await get('/sitemap.xml')).text();
    for (const t of TESTS) expect(xml.split(`/${t.slug}<`).length - 1).toBe(1);
  });

  test('the manifest is valid JSON with the icons an install needs', async () => {
    const res = await get('/manifest.webmanifest');
    expect(res.headers.get('content-type')).toContain('application/manifest+json');
    const manifest = JSON.parse(await res.text());
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBe('standalone');
    const sizes = manifest.icons.map((i) => i.sizes);
    expect(sizes).toContain('512x512');
    expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);
  });

  test('the permissions policy allows every API a test depends on', async () => {
    const policy = (await get('/camera')).headers.get('permissions-policy') ?? '';
    // Omitting one of these blocks the API outright, and the failure surfaces in
    // the page as a hardware error rather than as a policy problem.
    for (const feature of ['camera', 'microphone', 'display-capture', 'geolocation', 'midi', 'gyroscope']) {
      expect(policy).toContain(`${feature}=(self)`);
    }
  });

  test('healthz answers for the Railway healthcheck', async () => {
    expect((await get('/healthz')).status).toBe(200);
  });
});

describe('network test endpoints', () => {
  test('ping is empty and uncacheable', async () => {
    const res = await get('/api/net/ping');
    expect(res.status).toBe(204);
    expect(res.headers.get('cache-control')).toContain('no-store');
  });

  test('download returns exactly the requested number of bytes', async () => {
    const res = await get('/api/net/download?bytes=65536');
    const body = await res.arrayBuffer();
    expect(body.byteLength).toBe(65536);
  });

  test('download is capped, so one request cannot be turned into a bandwidth bill', async () => {
    const res = await get('/api/net/download?bytes=999999999');
    expect(Number(res.headers.get('content-length'))).toBeLessThanOrEqual(64 * 1024 * 1024);
  });

  test('a nonsense size falls back rather than erroring', async () => {
    const res = await get('/api/net/download?bytes=-5');
    expect(res.status).toBe(200);
    expect(Number(res.headers.get('content-length'))).toBeGreaterThan(0);
  });

  test('download payloads are not compressible placeholder zeroes', async () => {
    // A run of zeroes compresses away in transit and would report a throughput
    // the link cannot deliver.
    const body = new Uint8Array(await (await get('/api/net/download?bytes=4096')).arrayBuffer());
    const zeroes = body.filter((b) => b === 0).length;
    expect(zeroes).toBeLessThan(body.length / 4);
  });

  test('upload reports back what it received', async () => {
    const payload = new Uint8Array(32768);
    const res = await get('/api/net/upload', { method: 'POST', body: payload });
    expect((await res.json()).received).toBe(32768);
  });
});

describe('the machine page', () => {
  test('renders and leaves a host for the native bridge to fill', async () => {
    const res = await get('/machine');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('data-machine');
    // It must degrade honestly in a browser rather than render an empty shell.
    expect(html).toContain('This machine');
  });

  test('is precached, so the desktop app still opens it offline', async () => {
    const sw = await Bun.file(`${import.meta.dir}/../apps/web/public/sw.js`).text();
    expect(sw).toContain("'/machine'");
  });
});
