// Keep the legacy URL/scope so existing Expo installations update this worker.
const VERSION = '__BUILD_VERSION__';
const CACHE = 'wakosen-astro-' + VERSION;
const CORE = ['/', '/classes/', '/events/', '/meals/', '/school-rules/', '/settings/', '/changelog/', '/rule-detail/', '/404.html', '/manifest.json'];
const ASSETS = __BUILD_ASSETS__;
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll([...CORE, ...ASSETS]);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if ((key.startsWith('wakayamaapp-') || key.startsWith('wakosen-astro-')) && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // API requests are handled by the page data layer; no cross-origin SW fetch.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        const route = /^\/school-rules\/[^/]+\/?$/.test(url.pathname) ? '/rule-detail/' : url.pathname.replace(/\/?$/, '/');
        return await cache.match(request) || await cache.match(route) || await cache.match('/404.html');
      }
    })());
  } else if (ASSETS.includes(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })());
  }
});
