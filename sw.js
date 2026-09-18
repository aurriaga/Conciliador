/* Conciliador de Cartolas — service worker
   Guarda la app y las librerías para que abra sin internet. */
const VERSION = 'conciliador-v2';
const BASE = new URL('./', self.location).pathname;
const APP = [BASE, BASE + 'index.html', BASE + 'manifest.webmanifest', BASE + 'icono-192.png', BASE + 'icono-512.png', BASE + 'icono-maskable.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(APP)).then(() => self.skipWaiting()).catch(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const externo = /cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/.test(url.host);
  // La app: primero la red (para tomar actualizaciones), con respaldo en caché
  if (!externo && url.origin === self.location.origin) {
    e.respondWith(
      fetch(req).then((res) => { const copia = res.clone(); caches.open(VERSION).then((c) => c.put(req, copia)); return res; })
        .catch(() => caches.match(req).then((r) => r || caches.match(BASE + 'index.html')))
    );
    return;
  }
  // Librerías y fuentes: primero la caché
  if (externo) {
    e.respondWith(
      caches.match(req).then((r) => r || fetch(req).then((res) => { const copia = res.clone(); caches.open(VERSION).then((c) => c.put(req, copia)); return res; }))
    );
  }
});
