// Keeps the app shell available so it opens like a normal phone app.
// Always asks GitHub for the newest copy first (skipping the phone's own cache),
// and only uses the saved copy when there is no internet.
// Email data is never cached here: it always comes live from Google.
const CACHE = 'my-inbox-v9';
const SHELL = ['./', './index.html', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== 'mi-files').map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then((r) => { if (!r.ok) return r; const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

// Alerts for summaries and new mail
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Pocket PA', {
    body: d.body || 'Your summary is ready.',
    icon: 'icon-192.png', badge: 'icon-192.png', tag: 'morning', renotify: true,
    data: { url: d.url || './' }
  }));
});

// Tapping the notification opens Pocket PA (or brings it to the front)
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ws) => {
    for (const w of ws) { if (w.url.startsWith(self.registration.scope) && 'focus' in w) return w.focus(); }
    return clients.openWindow(url);
  }));
});
