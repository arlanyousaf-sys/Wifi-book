// ===== WiFi Record Book — Service Worker =====
const CACHE_NAME = 'wifi-book-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// ===== INSTALL (Assets pre-cache krna) =====
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn('[SW] Skip caching asset:', url, err.message))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ===== ACTIVATE (Purana cache delete krna) =====
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ===== FETCH (Offline support aur Cache-First strategy) =====
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (!req.url.startsWith('http')) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }
        
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          try { cache.put(req, clone); } catch (e) { console.error('[SW] Cache put failed:', e); }
        });
        return response;
      }).catch(() => {
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// ===== MESSAGE (Forced updates k liye) =====
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});