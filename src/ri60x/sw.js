const CACHE = 'ri60x-unified-v2';
const CORE = [
  './', './index.html', './styles.css', './bootstrap.js', './app.js', './manifest.webmanifest', './assets/favicon.svg',
  './modules/state-manager.js', './modules/utils.js', './modules/asset-manager.js', './modules/quality-manager.js',
  './modules/scene-runtime.js', './modules/material-factory.js', './modules/vehicle-controller.js',
  './modules/camera-controller.js', './modules/overlay-manager.js', './modules/telemetry-engine.js',
  './modules/chart-renderer.js', './modules/ui-controller.js', './modules/fallback-ui.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

async function networkFirst(request, fallbackRequest) {
  try {
    const response = await fetch(request);
    if (response?.status === 200) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) || (fallbackRequest ? caches.match(fallbackRequest) : Response.error());
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, './index.html'));
    return;
  }

  if (/\.(?:js|css|html|webmanifest)$/.test(url.pathname)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || networkFirst(event.request, './index.html')));
});
