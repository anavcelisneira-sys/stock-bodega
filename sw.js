/* Stock Bodega — cache para uso sin señal.
   Subi la version cada vez que edites index.html, asi el telefono toma los cambios. */
const VERSION = 'stock-v5';
const BASE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => Promise.allSettled(BASE.map(u => c.add(new Request(u, {mode: 'no-cors'})))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                          // los POST de sincronizacion nunca se cachean
  if (req.url.includes('script.google.com')) return;         // ni las llamadas a Sheets
  if (req.url.includes('script.googleusercontent.com')) return;

  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) {
        fetch(req).then(r => {                               // refresca en segundo plano
          if (r && (r.ok || r.type === 'opaque')) caches.open(VERSION).then(c => c.put(req, r));
        }).catch(() => {});
        return hit;
      }
      return fetch(req).then(r => {
        if (r && (r.ok || r.type === 'opaque')) {
          const copia = r.clone();
          caches.open(VERSION).then(c => c.put(req, copia));
        }
        return r;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
