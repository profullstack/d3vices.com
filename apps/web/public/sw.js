/**
 * d3vices service worker.
 *
 * A hardware diagnostic has to work when the network is the broken thing, so
 * every page and every asset is precached at install and served from the cache
 * first. The only exception is the network test's own endpoints, which must
 * never be cached — a cached response would report an infinitely fast link.
 *
 * Serving cache-first means `VERSION` is how a change reaches anyone who has
 * been here before: `activate` deletes every cache whose key is not the current
 * one, and the key is derived from this string. Leave it alone while shipping a
 * markup change and returning readers keep the page they already have, with no
 * error anywhere to say so — which is exactly how the first ad unit shipped
 * invisible. **Bump it in the same commit as any change to a precached page.**
 */
const VERSION = 'v6';
const CACHE = `d3vices-${VERSION}`;

const PRECACHE = [
  '/',
  '/about',
  '/privacy',
  '/pricing',
  '/changelog',
  '/download',
  '/machine',
  '/static/css/style.css',
  '/static/js/app.js',
  '/icons/icon-192x192.png',
  '/favicon.ico',
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

  // Stale-while-revalidate: instant from cache, refreshed for next time. The
  // refresh is started out here, rather than inside respondWith, so it can be
  // handed to waitUntil below while the event is still indisputably active.
  const revalidated = (async () => {
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      return null;
    }
  })();

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request, { ignoreSearch: true });

      if (cached) return cached;

      const fresh = await revalidated;
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

  // The refresh has to outlive the response it did not provide. A cache hit
  // settles respondWith immediately, and the worker may then be terminated
  // before the fetch it started ever writes anything — so the stale copy is
  // served again on the next visit, and on the one after that. Holding the
  // event open until the write lands is what makes this stale-while-revalidate
  // rather than stale-forever.
  event.waitUntil(revalidated);
});
