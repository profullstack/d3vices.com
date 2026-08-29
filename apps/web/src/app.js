import { config } from '@d3vices/config';
import { TEST_BY_SLUG, TESTS } from '@d3vices/tests/registry';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
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
 * The tests read from real hardware, so the browser will only run most of them
 * on a secure origin. These headers are what let that happen without opening
 * the page up to being framed or injected into.
 */
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('X-Frame-Options', 'DENY');
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

app.get('/robots.txt', (c) => c.text(`User-agent: *\nAllow: /\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`));

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
