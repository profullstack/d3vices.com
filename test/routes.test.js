import { describe, expect, test } from 'bun:test';
import app from '../apps/web/src/app.js';
import { THEME_SCRIPT, THEME_SCRIPT_HASH } from '../apps/web/src/inline-scripts.js';
import { config } from '../packages/config/src/index.js';
import { TEST_BY_SLUG, TESTS } from '../packages/tests/src/registry.js';

const get = (path, init) => app.fetch(new Request(`http://localhost${path}`, init));

/** One directive out of a CSP header, so an assertion cannot match a neighbour. */
const directive = (csp, name) =>
  csp
    .split(';')
    .map((d) => d.trim())
    .find((d) => d === name || d.startsWith(`${name} `)) ?? '';

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

describe('structured data and page content', () => {
  const jsonLd = async (path) => {
    const html = await (await get(path)).text();
    return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) =>
      JSON.parse(m[1]),
    );
  };

  test('every block of structured data is parseable', async () => {
    // A JSON-LD block with a syntax error is ignored in silence, so the only
    // way to know it is wrong is to parse it.
    for (const path of ['/', '/camera', '/microphone', '/system']) {
      expect((await jsonLd(path)).length).toBeGreaterThan(0);
    }
  });

  test('the homepage declares an FAQ, a publisher and where to find it elsewhere', async () => {
    const graph = (await jsonLd('/'))[0]['@graph'];
    const byType = (type) => graph.find((n) => [n['@type']].flat().includes(type));
    expect(byType('FAQPage').mainEntity.length).toBeGreaterThanOrEqual(4);
    expect(byType('Organization').sameAs).toContain('https://github.com/profullstack');
    expect(byType('WebApplication').dateModified).toBeTruthy();
  });

  test('each test page carries its own questions, not a shared block', async () => {
    const seen = new Set();
    for (const t of TESTS) {
      const graph = (await jsonLd(`/${t.slug}`))[0]['@graph'];
      const faq = graph.find((n) => n['@type'] === 'FAQPage');
      expect(faq.mainEntity.length).toBeGreaterThanOrEqual(3);
      for (const question of faq.mainEntity) {
        // Two pages sharing a question would put the duplicate content back.
        expect(seen.has(question.name)).toBe(false);
        seen.add(question.name);
        expect(question.acceptedAnswer.text.length).toBeGreaterThan(40);
      }
    }
  });

  test('the questions are in the markup, not only in the JSON-LD', async () => {
    // Structured data that describes content the page does not contain is the
    // one thing search engines treat as a penalty rather than a signal.
    const html = await (await get('/camera')).text();
    for (const { q } of TEST_BY_SLUG.camera.faq) expect(html).toContain(q);
  });

  test('the homepage meta description fits in a snippet', async () => {
    const html = await (await get('/')).text();
    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
    expect(description.length).toBeGreaterThan(50);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  test('headings nest without skipping a level', async () => {
    // A skipped level breaks the outline a screen reader navigates by, and it
    // happened here because a smaller font was wanted, not a deeper section.
    for (const path of ['/', '/about', '/privacy', '/download', '/camera', '/no-such-test']) {
      const html = await (await get(path)).text();
      const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
      expect(levels.filter((l) => l === 1).length).toBe(1);
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i]).toBeLessThanOrEqual(levels[i - 1] + 1);
      }
    }
  });

  test('the homepage offers a table and a list for a snippet to lift', async () => {
    const html = await (await get('/')).text();
    expect(html).toContain('<table');
    expect(html).toContain('<caption>');
    expect(html).toContain('<ul');
    expect(html).toContain('<time datetime=');
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

describe('the ad unit', () => {
  const frames = (html) => html.split('/api/ads/frame').length - 1;

  test('a page carries one ad and no more', async () => {
    // Impressions meter server-side at fill time, so a second unit bills a
    // second impression for the same reader whether or not anyone saw it.
    for (const path of ['/', '/camera', '/system']) {
      expect(frames(await (await get(path)).text())).toBe(1);
    }
  });

  test('it sits after the instrument, never before it', async () => {
    // Someone who came to find out whether their microphone works should reach
    // it without passing an ad.
    const html = await (await get('/camera')).text();
    expect(html.indexOf('/api/ads/frame')).toBeGreaterThan(html.indexOf('data-test="camera"'));
  });

  test('no ad on the pages that answer for the site', async () => {
    for (const path of ['/about', '/privacy', '/download']) {
      expect(frames(await (await get(path)).text())).toBe(0);
    }
  });

  test('it is a cross-origin frame, not the vendor script', async () => {
    // ad.js injects the creative as a srcdoc iframe, and a srcdoc document
    // inherits this page's CSP — which is why using it would have cost
    // 'unsafe-inline' in style-src and an open img-src, site-wide.
    const html = await (await get('/')).text();
    expect(html).toContain(`${config.ads.origin}/api/ads/frame`);
    expect(html).not.toContain('ad.js');
    expect(html).not.toContain('data-cp-ad');
  });

  test('it asks for the one format that is actually fluid', async () => {
    // Every banner creative is laid out at its format's fixed pixel width, so a
    // narrower frame clips it instead of reflowing.
    expect(await (await get('/')).text()).toContain('format=text_link');
  });

  test('the frame is sandboxed to opening its own link and nothing else', async () => {
    const tag = (await (await get('/')).text()).match(/<iframe[^>]*>/)?.[0] ?? '';
    expect(tag).toContain('sandbox=');
    expect(tag).not.toContain('allow-scripts');
    expect(tag).not.toContain('allow-same-origin');
    expect(tag).toContain('loading="lazy"');
  });

  test('advertising costs the policy exactly one directive', async () => {
    const csp = (await get('/')).headers.get('content-security-policy') ?? '';
    expect(directive(csp, 'frame-src')).toContain(config.ads.origin);
    // And nothing anywhere else: no script, no fetch, no image, no style.
    for (const name of ['script-src', 'connect-src', 'img-src', 'style-src', 'default-src']) {
      expect(directive(csp, name)).not.toContain(config.ads.origin);
    }
  });

  test('the ad did not loosen the policy it was added to', async () => {
    const csp = (await get('/')).headers.get('content-security-policy') ?? '';
    expect(csp).not.toContain('*');
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).not.toContain('unsafe-eval');
  });

  test('the privacy page still describes what the site actually does', async () => {
    // The one page that would become untrue if an ad were added quietly.
    const html = await (await get('/privacy')).text();
    expect(html.toLowerCase()).toContain('ad');
  });

  test('an empty slot takes the ad and its directive off the site', async () => {
    // This is how the static export switches advertising off: the desktop app
    // ships that output and makes no network request unless you run the network
    // test, and an ad frame is a network request. The config reads the variable
    // when it is imported, so this has to be a fresh process.
    const proc = Bun.spawn(
      [
        'bun',
        '-e',
        'const a=(await import("./apps/web/src/app.js")).default;const r=await a.fetch(new Request("http://localhost/"));console.log(r.headers.get("content-security-policy"));console.log(await r.text())',
      ],
      { cwd: `${import.meta.dir}/..`, env: { ...process.env, ADS_SLOT: '' }, stdout: 'pipe', stderr: 'pipe' },
    );
    const out = await new Response(proc.stdout).text();
    expect(await proc.exited).toBe(0);
    expect(out).toContain('<!doctype html>');
    expect(out).not.toContain('/api/ads/frame');
    // No leftover rule about something the site no longer does.
    expect(out).not.toContain('frame-src');
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
