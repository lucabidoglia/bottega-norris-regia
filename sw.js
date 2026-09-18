/*
 * Service worker minimale: mette in cache la "shell" statica dell'app
 * (le 4 pagine, CSS, JS, font) cosi' l'icona installata su Android/desktop
 * apre l'app anche offline o con connessione debole. I dati demo sono
 * incorporati nelle pagine stesse (non serve cache dedicata); i dati reali
 * caricati localmente vivono in IndexedDB, mai passati dalla rete.
 *
 * Strategia: "stale while revalidate" — risponde subito dalla cache se
 * presente, aggiorna la cache in background per la prossima visita.
 */
const CACHE_NAME = 'bn-regia-v1';
const SHELL_FILES = [
  './index.html',
  './analitica.html',
  './budget.html',
  './yoy.html',
  './css/shell.css',
  './css/analitica.css',
  './css/budget.css',
  './css/yoy.css',
  './js/shell.js',
  './js/analitica.js',
  './js/budget.js',
  './js/yoy.js',
  './js/data-loader.js',
  './assets/fonts/playfair-display-700-normal.ttf',
  './assets/fonts/playfair-display-900-normal.ttf',
  './assets/fonts/space-grotesk-400-normal.ttf',
  './assets/fonts/space-grotesk-500-normal.ttf',
  './assets/fonts/jetbrains-mono-400-normal.ttf',
  './assets/fonts/jetbrains-mono-500-normal.ttf',
  './manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // non tocca Chart.js da CDN, ecc.

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const network = fetch(event.request).then((resp) => {
        if (resp && resp.ok) cache.put(event.request, resp.clone());
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
