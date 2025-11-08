const CACHE_NAME = 'gu-cache-v2';
const ASSETS = [
  './mw.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Installa e pre-cacha gli asset
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Attiva e rimuove cache vecchie
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))
      )
    ).then(() => self.clients.claim())
  );
});

// Gestione fetch: network-first per HTML, cache-first per il resto
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const isHTML = event.request.headers.get('accept')?.includes('text/html');

  if (isHTML) {
    event.respondWith(
      fetch(event.request).then(resp => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, resp.clone());
          return resp;
        });
      }).catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(resp => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, resp.clone());
            return resp;
          });
        });
      })
    );
  }
});
