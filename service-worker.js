// Solo recursos de Caja Fácil; IndexedDB no se modifica.
const CACHE = 'caja-facil-v4.2';
const ASSETS = ['./', './index.html', './styles.css?v=4.2', './app.js?v=4.2', './manifest.json?v=4.2', './icon-192.png', './icon-512.png'];
const assetURLs = ASSETS.map(asset => new URL(asset, self.registration.scope).href);
const assetPaths = new Set(assetURLs.map(url => new URL(url).pathname));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(assetURLs.map(url => new Request(url, {cache: 'reload'})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('caja-facil-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !assetPaths.has(url.pathname)) return;
  const response = (async () => {
    const cache = await caches.open(CACHE);
    try {
      const fresh = await fetch(event.request, {cache: 'no-cache'});
      if (!fresh.ok) throw new Error('Recurso no disponible');
      const type = fresh.headers.get('content-type') || '';
      if (url.pathname.endsWith('.css') && !type.includes('text/css')) throw new Error('CSS no válido');
      if (url.pathname.endsWith('.js') && !/(javascript|ecmascript)/i.test(type)) throw new Error('JavaScript no válido');
      await cache.put(event.request, fresh.clone());
      return fresh;
    } catch (error) {
      const exact = await cache.match(event.request);
      const canonical = assetURLs.find(asset => new URL(asset).pathname === url.pathname);
      const saved = exact || (canonical && await cache.match(canonical));
      if (saved) return saved;
      throw error;
    }
  })();
  event.respondWith(response);
  event.waitUntil(response.then(() => undefined, () => undefined));
});
