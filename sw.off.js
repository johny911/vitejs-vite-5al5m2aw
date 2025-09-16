const STATIC_CACHE_NAME = 'constructflow-static-v4';
const DATA_CACHE_NAME = 'constructflow-data-v4';

// App shell
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
];

// Key API GET endpoints to be cached
const API_ENDPOINTS = [
  '/rest/v1/projects',
  '/rest/v1/tasks',
  '/rest/v1/materials',
  '/rest/v1/material_transactions',
  '/rest/v1/labour_teams',
  '/rest/v1/labour_types',
  '/rest/v1/attendance_records',
  '/rest/v1/work_reports',
];

// --- Install ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(APP_SHELL_FILES);
    })
  );
  self.skipWaiting();
});

// --- Activate ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim();

  // Notify clients about the new version
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) =>
      client.postMessage({ type: 'NEW_VERSION' })
    );
  });
});

// --- Background Sync Queue ---
const queue = [];
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle Supabase GET requests with Network First
  if (
    url.hostname.includes('supabase.co') &&
    API_ENDPOINTS.some((path) => url.pathname.startsWith(path)) &&
    event.request.method === 'GET'
  ) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(async (cache) => {
        try {
          const networkResponse = await fetch(event.request);
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        } catch (error) {
          console.log('[SW] Network fetch failed, serving cached:', url.pathname);
          const cachedResponse = await cache.match(event.request);
          return (
            cachedResponse ||
            new Response(JSON.stringify({ error: 'Offline and no cached data' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            })
          );
        }
      })
    );
    return;
  }

  // Queue POST/PUT/DELETE if offline
  if (
    url.hostname.includes('supabase.co') &&
    ['POST', 'PUT', 'DELETE'].includes(event.request.method)
  ) {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.log('[SW] Queuing offline mutation:', event.request.url);
        queue.push(event.request.clone());
        return new Response(
          JSON.stringify({ queued: true, message: 'Saved offline, will sync later' }),
          { status: 202, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Static assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            caches.open(STATIC_CACHE_NAME).then((cache) =>
              cache.put(event.request, res.clone())
            );
          }
          return res;
        })
        .catch(() => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      return cached || networkFetch;
    })
  );
});

// --- Replay queued requests when online ---
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(
      Promise.all(
        queue.map(async (req) => {
          try {
            await fetch(req);
          } catch (e) {
            console.error('[SW] Failed to replay queued request:', e);
          }
        })
      ).then(() => {
        console.log('[SW] Replay complete, clearing queue');
        queue.length = 0;
      })
    );
  }
});