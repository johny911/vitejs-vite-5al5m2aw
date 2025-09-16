
const STATIC_CACHE_NAME = 'constructflow-static-v3';
const DATA_CACHE_NAME = 'constructflow-data-v3';

const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/index.tsx',
];

// Key API GET endpoints to be cached for offline access
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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(APP_SHELL_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategy 1: Network First, then Cache (for our API)
  if (url.hostname.includes('supabase.co') && API_ENDPOINTS.some(path => url.pathname.startsWith(path)) && event.request.method === 'GET') {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(async (cache) => {
        try {
          const networkResponse = await fetch(event.request);
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        } catch (error) {
          console.log('[ServiceWorker] Network fetch failed, trying cache for:', event.request.url);
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response(JSON.stringify({ error: 'This data is not available offline.' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })
    );
    return;
  }
  
  // Ignore non-GET requests for Supabase (like POST, PUT, DELETE)
  if (url.hostname.includes('supabase.co') && event.request.method !== 'GET') {
      return;
  }

  // Strategy 2: Cache First, then Network (for App Shell and static assets)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
          });
          return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          console.log('[ServiceWorker] Fetch failed for navigation; returning offline page.');
          return caches.match('/offline.html');
        }
      });
    })
  );
});
