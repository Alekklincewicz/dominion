// DOMINION Service Worker v2
// Only caches GET requests. POST (AI, auth) always goes direct to network.

const CACHE = 'dominion-v2';

const PRECACHE = [
  '/',
  '/index.html',
  '/firebase-config.js',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

const CDN_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'www.gstatic.com',
];

// ── INSTALL ───────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ── ACTIVATE: evict old caches ────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH ─────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  // RULE 1: Never touch non-GET requests (POST = AI API, auth, etc.)
  // Let them go straight to the network with zero SW involvement.
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // RULE 2: Never cache Vercel serverless functions
  if (url.pathname.startsWith('/api/')) return;

  // RULE 3: Never cache Firebase / auth endpoints
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('firebase.com')) return;

  // RULE 4: Never cache Mapbox dynamic tiles or events
  if (url.hostname.includes('mapbox.com') &&
      (url.pathname.includes('/tiles/') ||
       url.hostname.includes('events.mapbox'))) return;

  // RULE 5: CDN static assets (fonts, Firebase SDK JS) — cache first
  if (CDN_HOSTS.some(h => url.hostname.includes(h))) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res.ok && res.status < 400) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        });
      })
    );
    return;
  }

  // RULE 6: Own origin GET assets — network first, cache fallback
  // (covers index.html, manifest, icons, firebase-config, Mapbox GL JS CSS)
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // Only cache successful non-API responses
          if (res.ok && res.status < 400 && !url.pathname.startsWith('/api/')) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        })
        .catch(() =>
          // Offline fallback: serve cached version, or the app shell
          caches.match(e.request)
            .then(cached => cached || caches.match('/index.html'))
        )
    );
    return;
  }

  // RULE 7: Everything else (Mapbox GL JS CDN, etc.) — network first, no cache write
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request)
    )
  );
});
