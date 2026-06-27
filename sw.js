/* GlukoPrior Service Worker
   Strategi:
   - App shell (HTML/manifest/ikon)  -> cache-first dengan update di latar belakang
   - Google Fonts (CSS & file font)  -> stale-while-revalidate
   - Lainnya                          -> network-first, fallback ke cache
*/
const VERSION = 'glukoprior-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/assets/css/style.css',
  '/assets/js/data.js',
  '/assets/js/engine.js',
  '/assets/js/icons.js',
  '/assets/js/render.js',
  '/assets/js/app.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navigasi halaman -> app shell (cache-first agar bisa offline)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cached) =>
        cached || fetch(request).catch(() => caches.match('/index.html'))
      )
    );
    return;
  }

  // Google Fonts -> stale-while-revalidate
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Aset internal -> cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached || fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return res;
        }).catch(() => cached)
      )
    );
    return;
  }

  // Lainnya -> network-first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

function staleWhileRevalidate(request) {
  return caches.open(RUNTIME_CACHE).then((cache) =>
    cache.match(request).then((cached) => {
      const network = fetch(request).then((res) => {
        cache.put(request, res.clone());
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
}
