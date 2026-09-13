const CACHE = 'studymate-v1-3';
const APP_SHELL = [
  './', './index.html', './style.css', './app.js', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png'
];
const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(async cache => {
    await cache.addAll(APP_SHELL);
    for (const url of CDN_ASSETS) {
      try { await cache.add(url); } catch (e) { /* online fallback remains available */ }
    }
    await self.skipWaiting();
  }));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(resp => {
    const copy = resp.clone();
    if (resp.ok || resp.type === 'opaque') caches.open(CACHE).then(c => c.put(req, copy));
    return resp;
  }).catch(() => caches.match('./index.html'))));
});
