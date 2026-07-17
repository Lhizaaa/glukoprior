/* GlukoPrior Service Worker
   Strategi:
   - Navigasi halaman              -> selalu ke jaringan (tidak diintersep SW),
                                       agar redirect clean-URL server tidak memicu ERR_FAILED
   - Aset internal (CSS/JS/ikon)   -> cache-first dengan update di latar belakang
   - Google Fonts (CSS & file font)-> stale-while-revalidate
   - Lainnya                        -> network-first, fallback ke cache
*/
const VERSION = 'glukoprior-v3';
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

/* Hanya aset yang di-serve 200 langsung (tanpa redirect clean-URL).
   Halaman HTML sengaja TIDAK di-precache di sini karena sebagian server
   dev (mis. `serve` dengan cleanUrls) me-redirect /*.html -> /* (301). */
const APP_SHELL = [
  '/',
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
      .then((cache) => Promise.allSettled(APP_SHELL.map((u) => cache.add(u))))
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

  // Navigasi halaman -> biarkan browser menanganinya sendiri (ikuti redirect
  // server dengan benar). SW TIDAK boleh mengembalikan response redirect untuk
  // navigasi karena browser akan menolaknya (ERR_FAILED).
  if (request.mode === 'navigate') return;

  const url = new URL(request.url);

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
          if (res && res.ok && !res.redirected) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          }
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
