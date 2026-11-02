/* Infinity service worker: the site works offline after a visit and installs as an app.
   Pages: network first (always fresh), saved copy when offline. Design, scripts, tools and libraries: saved copy first. */
var V = '2026-11-02.13-1664cdc4', PAGES = 'inf-pages-' + V, FILES = 'inf-files-' + V;
var PRE = ['/', '/search', '/404.html', '/manifest.webmanifest', '/icons/favicon-192.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(PAGES).then(function (c) { return c.addAll(PRE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return /^inf-/.test(k) && k !== PAGES && k !== FILES; }).map(function (k) { return caches.delete(k); })); })
    .then(function () { return self.clients.claim(); }));
});
var STATIC = /^https:\/\/(assets\.infinity\.groupchaton\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com|fonts\.(googleapis|gstatic)\.com)\//;
self.addEventListener('fetch', function (e) {
  var r = e.request, u = r.url;
  if (r.method !== 'GET') return;
  if (r.mode === 'navigate' && u.indexOf(self.location.origin) === 0) {
    e.respondWith(fetch(r).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(PAGES).then(function (c) { c.put(r, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(r, { ignoreSearch: true }).then(function (m) { return m || caches.match('/'); });
    }));
    return;
  }
  if (!STATIC.test(u) || /data\/tools\.json/.test(u)) {
    if (/data\/tools\.json/.test(u)) e.respondWith(fetch(r).then(function (res) {   // the tool list: fresh when online
      var copy = res.clone(); caches.open(FILES).then(function (c) { c.put(u.split('?')[0], copy); }); return res;
    }).catch(function () { return caches.match(u.split('?')[0]); }));
    return;
  }
  e.respondWith(caches.match(r).then(function (m) {
    var net = fetch(r).then(function (res) {
      if (res.ok || res.type === 'opaque') { var copy = res.clone(); caches.open(FILES).then(function (c) { c.put(r, copy); }); }
      return res;
    });
    return m || net;
  }));
});
