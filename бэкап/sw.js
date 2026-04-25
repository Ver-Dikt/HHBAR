const STATIC_CACHE = 'static-v3';
const DYNAMIC_CACHE = 'dynamic-v3';
const OFFLINE_PAGE = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/img/hhbar-logo.png',
  '/img/logo-main.png',
  '/img/hhbar-hero-bg.jpg',
  '/manifest.json'
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // HTML pages — network first, fallback to cache
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request).then(resp => {
        const copy = resp.clone();
        caches.open(STATIC_CACHE).then(cache => cache.put(request, copy));
        return resp;
      }).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return caches.match(OFFLINE_PAGE);
      })
    );
    return;
  }
  
  // Статика — cache first
  if (STATIC_ASSETS.some(path => url.pathname === path || url.pathname.endsWith(path))) {
    event.respondWith(
      caches.match(request).then(cached => 
        cached || fetch(request).then(resp => {
          const copy = resp.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(request, copy));
          return resp;
        }).catch(() => caches.match('/index.html'))
      )
    );
    return;
  }
  
  // Аудиофайлы — network first with fallback
  if (url.pathname.includes('.mp3')) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request);
      })
    );
    return;
  }
  
  // Изображения — stale while revalidate
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache => 
        cache.match(request).then(cached => {
          const network = fetch(request).then(resp => {
            if (resp.status === 200) {
              cache.put(request, resp.clone());
            }
            return resp;
          }).catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }
  
  // Всё остальное — network first
  event.respondWith(
    fetch(request).then(resp => {
      if (request.method === 'GET' && resp.status === 200) {
        caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, resp.clone()));
      }
      return resp;
    }).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      
      if (request.mode === 'navigate') {
        return caches.match(OFFLINE_PAGE);
      }
      
      return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
    })
  );
});