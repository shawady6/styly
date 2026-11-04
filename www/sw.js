/* Network-first so a new deploy is never hidden behind an old cache; the cache is only the offline fallback. */
const C = 'styly-v6';
const FILES = ['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./css/fonts.css','./css/styles.css','./js/core.js','./js/color.js','./js/screens.js','./js/update.js','./js/analyze.js','./js/wardrobe.js','./js/app.js',
  './fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2','./fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2','./fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2','./fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2',
  './fonts/ibm-plex-sans-arabic-latin-400-normal.woff2','./fonts/ibm-plex-sans-arabic-latin-500-normal.woff2','./fonts/ibm-plex-sans-arabic-latin-600-normal.woff2','./fonts/ibm-plex-sans-arabic-latin-700-normal.woff2'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))); });
self.addEventListener('activate', e => e.waitUntil((async () => {
  const ks = await caches.keys();
  const upgraded = ks.some(k => k !== C);   // an older Styly cache existed: open pages may still be showing the old UI
  await Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)));
  await self.clients.claim();
  if (upgraded) for (const w of await self.clients.matchAll({ type: 'window' })) { try { w.navigate(w.url); } catch (err) {} }
})()));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const same = new URL(e.request.url).origin === location.origin;
  if (!same) return;   // never intercept cross-origin calls (update check, etc.)
  // bypass the browser HTTP cache so "network-first" really is the network
  e.respondWith(fetch(same ? new Request(e.request.url, { cache: 'no-store', credentials: 'same-origin' }) : e.request).then(r => {
    if (r && r.ok && same) { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); }
    return r;
  }).catch(() => caches.match(e.request)));
});
