/**
 * d3vices service worker.
 *
 * A hardware diagnostic has to work when the network is the broken thing, so
 * every page and every asset is precached at install and served from the cache
 * first. The only exception is the network test's own endpoints, which must
 * never be cached — a cached response would report an infinitely fast link.
 */
const VERSION = 'v1';
const CACHE = `d3vices-${VERSION}`;

const PRECACHE = [
  '/',
  '/about',
  '/privacy',
  '/download',
  '/machine',
  '/static/css/style.css',
  '/static/js/app.js',
  '/static/img/icon.svg',
  '/manifest.webmanifest',
  // Every test page, so the whole suite survives going offline.
  '/microphone',
  '/speaker',
  '/camera',
  '/screen-share',
  '/display',
  '/screen-info',
  '/keyboard',
  '/mouse',
  '/touch',
  '/gamepad',
  '/midi',
  '/click-speed-test',
  '/kohi-click-test',
  '/jitter-click-test',
  '/reaction-time-test',
  '/scroll-speed-test',
  '/network',
  '/battery',
  '/geolocation',
  '/motion-sensors',
  '/ambient-light',
  '/vibration',
  '/bluetooth',
  '/system',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // addAll rejects the whole batch if any single request fails, which would
      // leave the app with no offline support at all because one page 404'd.
      await Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Caching a speed test would make it measure the disk.
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request, { ignoreSearch: true });

      // Stale-while-revalidate: instant from cache, refreshed for next time.
      const network = fetch(request)
        .then((response) => {
          if (response.ok && response.type === 'basic') cache.put(request, response.clone());
          return response;
        })
        .catch(() => null);

      if (cached) return cached;

      const fresh = await network;
      if (fresh) return fresh;

      // Offline and never cached: a navigation still gets the shell.
      if (request.mode === 'navigate') {
        const home = await cache.match('/');
        if (home) return home;
      }
      return new Response('Offline and this page was never cached.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' },
      });
    })(),
  );
});
