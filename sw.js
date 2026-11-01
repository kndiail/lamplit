/* 提灯者 PWA：离线缓存 */
const CACHE = 'lamplit-v4.4.0';
const CORE = [
  './', './index.html', './css/style.css', './manifest.webmanifest',
  './js/lib.js', './js/art.js', './js/audio.js', './js/meta.js',
  './js/story.js', './js/dungeon.js', './js/rhythm.js', './js/world.js', './js/game.js',
  './assets/fonts/zpix.woff2',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/icons/maskable-512.png'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => {
    if (hit) return hit;
    return fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html'));
  }));
});
