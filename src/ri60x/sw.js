const CACHE = 'ri60x-unified-v1';
const CORE = [
  './', './index.html', './styles.css', './bootstrap.js', './app.js', './manifest.webmanifest', './assets/favicon.svg',
  './modules/state-manager.js', './modules/utils.js', './modules/asset-manager.js', './modules/quality-manager.js',
  './modules/scene-runtime.js', './modules/material-factory.js', './modules/vehicle-controller.js',
  './modules/camera-controller.js', './modules/overlay-manager.js', './modules/telemetry-engine.js',
  './modules/chart-renderer.js', './modules/ui-controller.js'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (!response || response.status !== 200) return response;
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match('./index.html'))));
});
