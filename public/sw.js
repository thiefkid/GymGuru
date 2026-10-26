// Offline support: the page is network-first (so updates arrive), hashed build assets are cache-first.
const CACHE = 'gymguru-v1';

async function precache() {
  const cache = await caches.open(CACHE);
  const index = await fetch('./', { cache: 'no-store' });
  await cache.put('./', index.clone());
  const html = await index.text();
  const assets = [...html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)].map((m) => new URL(m[1], self.registration.scope).href);
  await Promise.all(
    assets.map(async (url) => {
      const res = await fetch(url);
      if (!res.ok) return;
      await cache.put(url, res.clone());
      if (url.endsWith('.css')) {
        // Fonts referenced by the stylesheet.
        const css = await res.text();
        const fonts = [...css.matchAll(/url\(([^)]+\.woff2)\)/g)].map((m) => new URL(m[1].replace(/["']/g, ''), url).href);
        await cache.addAll(fonts).catch(() => {});
      }
    }),
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./')),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
