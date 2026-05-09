// DOMINION Service Worker
// Cache-first for static assets, network-only for AI API calls

const CACHE = 'dominion-v1';

const PRECACHE = [
  '/',
  '/index.html',
  '/firebase-config.js',
  '/manifest.json',
  '/icon.svg',
];

const CDN_HOSTS = [
  'api.mapbox.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'www.gstatic.com',
  'events.mapbox.com',
];

// ── INSTALL: pre-cache the app shell ──────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ── ACTIVATE: clear old caches ────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH: routing strategy ───────────────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // 1. AI API — always network only (never cache LLM responses)
  if (url.pathname.startsWith('/api/')) {
    return; // fall through to browser default (network)
  }

  // 2. Firebase API calls — network only
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('identitytoolkit.googleapis.com') ||
      url.hostname.includes('securetoken.googleapis.com') ||
      url.hostname.includes('firebase')) {
    return;
  }

  // 3. Mapbox tile/style requests — network only (dynamic map data)
  if (url.hostname.includes('mapbox.com') && url.pathname.includes('/tiles/')) {
    return;
  }

  // 4. CDN static assets (Mapbox GL JS, Firebase SDK, fonts) — cache first
  if (CDN_HOSTS.some(h => url.hostname.includes(h))) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // 5. App shell + own assets — network first, cache fallback
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request).then(cached => cached || caches.match('/index.html')))
    );
  }
});
