import { config } from '@d3vices/config';
import { TEST_BY_SLUG, TESTS } from '@d3vices/tests/registry';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { compress } from 'hono/compress';
import { llmsFullTxt, llmsTxt, robotsTxt, securityTxt, skillMd } from './agents.js';
import { THEME_SCRIPT_HASH } from './inline-scripts.js';
import { About } from './pages/About.jsx';
import { Download } from './pages/Download.jsx';
import { Home } from './pages/Home.jsx';
import { Machine } from './pages/Machine.jsx';
import { NotFound } from './pages/NotFound.jsx';
import { Privacy } from './pages/Privacy.jsx';
import { TestPage } from './pages/TestPage.jsx';
import { render } from './render.js';

const app = new Hono();

/**
 * A trailing slash is a different URL to the router, so `/camera/` fell through
 * to the 404 page while `/camera` served the test. Every such URL is a dead link
 * for anything that appends one. Redirect instead of routing both, so each page
 * keeps exactly one address and the canonical stays true.
 */
app.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/+$/, '');
    // 308 rather than 301: the network test uploads by POST, and a 301 would let
    // a client turn that into a GET.
    return c.redirect(url.toString(), 308);
  }
  return next();
});

/**
 * The analytics script, when one is configured, is the only third-party origin
 * the policy below has to make room for.
 */
const analyticsOrigin = (() => {
  if (!config.analytics.src) return null;
  try {
    return new URL(config.analytics.src).origin;
  } catch {
    return null; // a same-origin path needs no extra source
  }
})();

/**
 * Everything the page is allowed to load, named explicitly. The tests are the
 * awkward part: a camera preview is a `mediastream:`, a recorded clip and a
 * captured still are `blob:`, and a canvas snapshot is a `data:` URL, so the
 * media and image sources have to admit all three or the instrument fails with
 * an error that reads like broken hardware.
 *
 * The single inline script is allowed by hash rather than by 'unsafe-inline',
 * which is the whole point of having a policy at all.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  // The same statement as X-Frame-Options: DENY, for browsers that prefer CSP.
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' ${THEME_SCRIPT_HASH}${analyticsOrigin ? ` ${analyticsOrigin}` : ''}`,
  "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "media-src 'self' blob: mediastream: data:",
  `connect-src 'self'${analyticsOrigin ? ` ${analyticsOrigin}` : ''}`,
  "worker-src 'self'",
  "manifest-src 'self'",
].join('; ');

/**
 * Text responses went out uncompressed: 20KB of HTML and a 60KB stylesheet on
 * every cold load. The middleware leaves the network test alone by itself — that
 * response declares `Content-Encoding: identity`, and an already-encoded body is
 * skipped — which matters, because compressing a throughput measurement would
 * report a link speed the wire cannot deliver.
 */
app.use('*', compress());

/**
 * Nothing here sent a Cache-Control header, so every client had to guess.
 * Assets are addressed with `?v=<commit>`, which makes a versioned URL safe to
 * keep forever; an unversioned one is an icon or the OG image, and those get a
 * week so a replacement is not stuck behind a year-long cache.
 */
const CACHE_HTML = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';
const CACHE_IMMUTABLE = 'public, max-age=31536000, immutable';
const CACHE_ASSET = 'public, max-age=604800';
const CACHE_META = 'public, max-age=3600';

function cacheControlFor(pathname, search) {
  // The service worker script is how every other cached thing gets replaced. If
  // it is itself cached, a bad deploy has no way back out.
  if (pathname === '/sw.js') return 'no-cache';
  if (pathname.startsWith('/api/')) return null; // those routes set their own
  if (pathname.startsWith('/static/') || pathname.startsWith('/icons/')) {
    return search.has('v') ? CACHE_IMMUTABLE : CACHE_ASSET;
  }
  if (pathname === '/favicon.ico') return CACHE_ASSET;
  return CACHE_META;
}

/**
 * The tests read from real hardware, so the browser will only run most of them
 * on a secure origin. These headers are what let that happen without opening
 * the page up to being framed or injected into.
 */
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('X-Frame-Options', 'DENY');
  // Railway terminates TLS in front of this, so every real request is already
  // https; the header is what stops the first one of a session being plain.
  // Deliberately not preloaded — that list is one-way and hard to leave.
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.header('Content-Security-Policy', CSP);

  if (!c.res.headers.has('Cache-Control')) {
    const { pathname, searchParams } = new URL(c.req.url);
    const html = (c.res.headers.get('Content-Type') ?? '').startsWith('text/html');
    const value = html ? CACHE_HTML : cacheControlFor(pathname, searchParams);
    if (value) c.header('Cache-Control', value);
  }
  // Self-only for everything the tests use. A permissions policy that omits an
  // API blocks it outright — the tests would fail with a name that looks like a
  // hardware fault, so every API any test touches has to be listed here.
  c.header(
    'Permissions-Policy',
    [
      'camera=(self)',
      'microphone=(self)',
      'display-capture=(self)',
      'geolocation=(self)',
      'midi=(self)',
      'bluetooth=(self)',
      'accelerometer=(self)',
      'gyroscope=(self)',
      'magnetometer=(self)',
      'ambient-light-sensor=(self)',
      'gamepad=(self)',
      'fullscreen=(self)',
      'usb=(self)',
      'hid=(self)',
      'serial=(self)',
      'interest-cohort=()',
    ].join(', '),
  );
});

app.get('/healthz', (c) => c.text('ok'));

// ---------------------------------------------------------------- network API
//
// The network test needs endpoints whose size it controls. Timing a fixed
// static asset measures the round trip rather than the link: on a fast
// connection the whole file arrives inside one RTT.

const MAX_DOWNLOAD = 64 * 1024 * 1024;

app.get('/api/net/ping', (c) => {
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate');
  return c.body(null, 204);
});

app.get('/api/net/download', (c) => {
  const requested = Number(c.req.query('bytes') ?? 1024 * 1024);
  const bytes = Math.min(Number.isFinite(requested) && requested > 0 ? requested : 1024 * 1024, MAX_DOWNLOAD);

  // Streamed in chunks so a 48MB body never has to be resident all at once, and
  // filled with random data — a run of zeroes compresses away in transit and
  // would report a throughput the link cannot actually deliver.
  const CHUNK = 64 * 1024;
  let sent = 0;
  const stream = new ReadableStream({
    pull(controller) {
      if (sent >= bytes) {
        controller.close();
        return;
      }
      const size = Math.min(CHUNK, bytes - sent);
      const chunk = new Uint8Array(size);
      crypto.getRandomValues(chunk);
      controller.enqueue(chunk);
      sent += size;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(bytes),
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Content-Encoding': 'identity',
    },
  });
});

app.post('/api/net/upload', async (c) => {
  // Drain the body without keeping it: the measurement is the transfer time.
  const reader = c.req.raw.body?.getReader();
  let received = 0;
  if (reader) {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;
    }
  }
  c.header('Cache-Control', 'no-store');
  return c.json({ received });
});

// ------------------------------------------------------------------- app meta

app.get('/manifest.webmanifest', (c) => {
  c.header('Content-Type', 'application/manifest+json; charset=utf-8');
  return c.body(
    JSON.stringify({
      id: '/',
      name: 'd3vices — hardware diagnostics',
      short_name: 'd3vices',
      description:
        'Open-source hardware diagnostics. Test your microphone, camera, screen, keyboard, sensors and network — on your device, offline.',
      start_url: '/?source=pwa',
      scope: '/',
      display: 'standalone',
      orientation: 'any',
      background_color: '#0b0f14',
      theme_color: '#0b0f14',
      categories: ['utilities', 'productivity'],
      icons: [
        { src: '/icons/icon-48x48.png', sizes: '48x48', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-256x256.png', sizes: '256x256', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        // The "any" art is transparent with its own margin, which a mask would
        // crop into. The maskable is opaque and inset to the safe zone instead.
        { src: '/icons/icon-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
      // Long-press the installed icon to jump straight to the test you need.
      shortcuts: ['microphone', 'camera', 'keyboard', 'network'].map((slug) => {
        const test = TEST_BY_SLUG[slug];
        return {
          name: test.name,
          short_name: test.short,
          url: `/${test.slug}`,
          description: test.blurb,
        };
      }),
    }),
  );
});

app.get('/robots.txt', (c) => c.text(robotsTxt()));

/**
 * What an answer engine or an agent reads instead of crawling 24 pages. All of
 * it is generated from the test registry, so adding a test adds it here too.
 */
app.get('/llms.txt', (c) => c.text(llmsTxt()));
app.get('/llms-full.txt', (c) => c.text(llmsFullTxt()));
app.get('/skill.md', (c) => c.text(skillMd()));
app.get('/.well-known/security.txt', (c) => c.text(securityTxt()));

app.get('/sitemap.xml', (c) => {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: '/', priority: '1.0', freq: 'weekly' },
    ...TESTS.map((t) => ({ loc: `/${t.slug}`, priority: '0.9', freq: 'monthly' })),
    { loc: '/download', priority: '0.7', freq: 'monthly' },
    { loc: '/about', priority: '0.5', freq: 'yearly' },
    { loc: '/privacy', priority: '0.3', freq: 'yearly' },
  ];
  c.header('Content-Type', 'application/xml; charset=utf-8');
  return c.body(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map(
        (u) =>
          `  <url><loc>${config.siteUrl}${u.loc === '/' ? '/' : u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.freq}</changefreq><priority>${u.priority}</priority></url>`,
      )
      .join('\n')}\n</urlset>\n`,
  );
});

// The service worker must be served from the root to control the whole scope.
app.get('/sw.js', serveStatic({ path: './apps/web/public/sw.js' }));

// A browser asks for /favicon.ico before it has parsed a single <link>, and
// Windows only reads the tile config from the path the meta tag names.
app.get('/favicon.ico', serveStatic({ path: './apps/web/public/icons/favicon.ico' }));
app.get('/browserconfig.xml', serveStatic({ path: './apps/web/public/icons/browserconfig.xml' }));

app.use('/icons/*', serveStatic({ root: './apps/web/public' }));
app.use('/static/*', serveStatic({ root: './apps/web/public' }));

// ---------------------------------------------------------------------- pages

app.get('/', (c) => render(c, <Home />));
app.get('/about', (c) => render(c, <About />));
app.get('/privacy', (c) => render(c, <Privacy />));
app.get('/download', (c) => render(c, <Download release={process.env.RELEASE_URL || ''} />));
// Meaningful only in the desktop build; in a browser it says so and links to it.
app.get('/machine', (c) => render(c, <Machine />));

app.get('/:slug', (c) => {
  const test = TEST_BY_SLUG[c.req.param('slug')];
  if (!test) return render(c, <NotFound />, 404);
  return render(c, <TestPage test={test} />);
});

app.notFound((c) => render(c, <NotFound />, 404));

app.onError((error, c) => {
  console.error('[web] unhandled', error);
  return render(c, <NotFound />, 500);
});

export default app;
