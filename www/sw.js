/* Network-first so a new deploy is never hidden behind an old cache; the cache is only the offline fallback. */
const C = 'styly-v3';
const FILES = ['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./css/fonts.css','./css/styles.css','./js/core.js','./js/color.js','./js/screens.js','./js/app.js',
  './fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2','./fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2','./fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2','./fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2',
  './fonts/ibm-plex-sans-arabic-latin-400-normal.woff2','./fonts/ibm-plex-sans-arabic-latin-500-normal.woff2','./fonts/ibm-plex-sans-arabic-latin-600-normal.woff2','./fonts/ibm-plex-sans-arabic-latin-700-normal.woff2'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(FILES))); });
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {
    if (r && r.ok && new URL(e.request.url).origin === location.origin) { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); }
    return r;
  }).catch(() => caches.match(e.request)));
});
