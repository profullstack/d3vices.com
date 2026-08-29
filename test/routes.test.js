import { describe, expect, test } from 'bun:test';
import app from '../apps/web/src/app.js';
import { THEME_SCRIPT, THEME_SCRIPT_HASH } from '../apps/web/src/inline-scripts.js';
import { config } from '../packages/config/src/index.js';
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

  test('a trailing slash redirects instead of 404ing', async () => {
    // Anything that appends a slash — a crawler, a copied link, a CMS — used to
    // get the 404 page for a page that exists.
    for (const path of ['/camera/', '/about/', '/download/']) {
      const res = await get(path);
      expect(res.status).toBe(308);
      expect(new URL(res.headers.get('location')).pathname).toBe(path.slice(0, -1));
    }
  });

  test('the root is left alone by the slash redirect', async () => {
    expect((await get('/')).status).toBe(200);
  });

  test('the 404 page is noindex and claims no canonical', async () => {
    // It answers at every wrong URL, so a canonical would point all of them at
    // /404 — which 404s in turn.
    const html = await (await get('/no-such-test')).text();
    expect(html).toContain('name="robots" content="noindex');
    expect(html).not.toContain('rel="canonical"');
  });

  test('a real page still carries its canonical', async () => {
    expect(await (await get('/camera')).text()).toContain('rel="canonical"');
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

describe('what agents and answer engines read', () => {
  test('llms.txt lists every test, so it cannot drift from the registry', async () => {
    const res = await get('/llms.txt');
    expect(res.status).toBe(200);
    const txt = await res.text();
    expect(txt.startsWith('# d3vices')).toBe(true);
    // The spec wants a blockquote summary and linked, described resources.
    expect(txt).toContain('\n> ');
    // Absolute URLs, built from the configured site URL: an answer engine that
    // reads this file has no base to resolve a relative link against.
    for (const t of TESTS) expect(txt).toContain(`](${config.siteUrl}/${t.slug}):`);
    for (const path of ['/about', '/privacy', '/download']) {
      expect(txt).toContain(`${config.siteUrl}${path}`);
    }
  });

  test('llms-full.txt carries the long description, not just the blurb', async () => {
    const txt = await (await get('/llms-full.txt')).text();
    for (const t of TESTS) {
      expect(txt).toContain(`### ${t.name}`);
      expect(txt).toContain(t.description);
    }
  });

  test('skill.md is honest that a test cannot be run remotely', async () => {
    const txt = await (await get('/skill.md')).text();
    expect(txt).toContain('cannot');
    expect(txt).toContain('/api/net/ping');
  });

  test('security.txt has the fields RFC 9116 requires and does not expire in the past', async () => {
    const txt = await (await get('/.well-known/security.txt')).text();
    expect(txt).toContain('Contact:');
    const expires = txt.match(/^Expires: (.+)$/m)?.[1];
    expect(new Date(expires).getTime()).toBeGreaterThan(Date.now());
  });

  test('robots.txt names the AI crawlers and still points at the sitemap', async () => {
    const txt = await (await get('/robots.txt')).text();
    for (const bot of [
      'GPTBot',
      'ClaudeBot',
      'PerplexityBot',
      'Google-Extended',
      'OAI-SearchBot',
      'Applebot-Extended',
      'CCBot',
    ]) {
      expect(txt).toContain(`User-agent: ${bot}`);
    }
    expect(txt).toContain('Sitemap:');
    // Every group carries the same rules, so a parser that reads only the first
    // matching group still gets the whole policy.
    const groups = txt.split('User-agent:').length - 1;
    expect(txt.split('Disallow: /api/').length - 1).toBe(groups);
  });
});

describe('security headers', () => {
  test('HSTS is set and is not asking to be preloaded', async () => {
    const hsts = (await get('/')).headers.get('strict-transport-security') ?? '';
    expect(hsts).toContain('max-age=31536000');
    expect(hsts).toContain('includeSubDomains');
    // The preload list is one-way and hard to leave; its own operator says so.
    expect(hsts).not.toContain('preload');
  });

  test('the CSP allows the inline theme script by hash, not by unsafe-inline', async () => {
    const csp = (await get('/')).headers.get('content-security-policy') ?? '';
    expect(csp).toContain(THEME_SCRIPT_HASH);
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).not.toContain('unsafe-eval');
  });

  test('the CSP admits the sources the instruments actually use', async () => {
    const csp = (await get('/camera')).headers.get('content-security-policy') ?? '';
    // A camera preview is a mediastream, a recording is a blob and a canvas
    // still is a data: URL. Omit one and the test fails looking like hardware.
    expect(csp).toContain('media-src');
    for (const source of ['blob:', 'mediastream:', 'data:']) expect(csp).toContain(source);
    expect(csp).toContain('https://fonts.gstatic.com');
    expect(csp).toContain("frame-ancestors 'none'");
  });

  test('the hash in the policy matches the script the page actually serves', async () => {
    // Two copies of that script would drift, and the page would break silently
    // in production while every test here still passed.
    expect(await (await get('/')).text()).toContain(THEME_SCRIPT);
  });
});

describe('caching', () => {
  test('html is cacheable but short-lived', async () => {
    const cc = (await get('/')).headers.get('cache-control') ?? '';
    expect(cc).toContain('public');
    expect(cc).toContain('max-age=300');
  });

  test('a versioned asset is immutable and an unversioned one is not', async () => {
    const versioned = (await get('/static/css/style.css?v=abc123')).headers.get('cache-control') ?? '';
    expect(versioned).toContain('immutable');
    const plain = (await get('/static/img/og.png')).headers.get('cache-control') ?? '';
    expect(plain).not.toContain('immutable');
  });

  test('the service worker is never cached', async () => {
    // It is how every other cached thing gets replaced. Cache it and a bad
    // deploy has no way back out.
    expect((await get('/sw.js')).headers.get('cache-control')).toBe('no-cache');
  });

  test('the network endpoints keep their own no-store', async () => {
    const cc = (await get('/api/net/download?bytes=1024')).headers.get('cache-control') ?? '';
    expect(cc).toContain('no-store');
  });
});

describe('compression', () => {
  const gz = (path) => get(path, { headers: { 'Accept-Encoding': 'gzip' } });

  test('html and css go out compressed', async () => {
    expect((await gz('/')).headers.get('content-encoding')).toBe('gzip');
    expect((await gz('/static/css/style.css')).headers.get('content-encoding')).toBe('gzip');
  });

  test('the speed test payload is left alone', async () => {
    // Compressing a throughput measurement reports a link speed the wire cannot
    // deliver, so this response declares identity and must stay that way.
    const res = await gz('/api/net/download?bytes=65536');
    expect(res.headers.get('content-encoding')).toBe('identity');
    expect((await res.arrayBuffer()).byteLength).toBe(65536);
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
