const STATIC_CACHE = 'static-v16';
const DYNAMIC_CACHE = 'dynamic-v16';
const OFFLINE_PAGE = new URL('offline.html', self.registration.scope).href;

const STATIC_ASSETS = [
  './',
  'index.html',
  'src/styles/index.css',
  'src/styles/refresh.css',
  'src/scripts/safe-data.js',
  'src/data/events-data.js',
  'src/scripts/music-data.js',
  'src/scripts/site.js',
  'src/scripts/index.js',
  'src/scripts/analytics.js',
  'src/data/events.json',
  'booking.html',
  'menu.html',
  'rent.html',
  'cookies.html',
  'offline.html',
  'favicon.ico',
  'favicon.svg',
  'img/logo-main.png',
  'img/icons/icon-192.png',
  'img/icons/icon-512.png',
  'img/hhbar-hero-bg.jpg',
  'manifest.json'
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
  // Third-party widgets and embeds own their caching and must not fill our cache.
  if (url.origin !== self.location.origin) return;

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

  // Versioned application assets — network first, cache fallback.
  if (STATIC_ASSETS.some(path => path !== './' && url.pathname.endsWith('/' + path))) {
    event.respondWith(
      fetch(request).then(resp => {
          const copy = resp.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(request, copy));
          return resp;
        }).catch(() => caches.match(request).then(cached => cached || caches.match(OFFLINE_PAGE)))
    );
    return;
  }

  // Audio files — network first with fallback
  if (url.pathname.includes('.mp3')) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request);
      })
    );
    return;
  }

  // Images — network first, so updated posters/photos appear immediately.
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache => 
        fetch(request).then(resp => {
          if (resp.status === 200) {
            cache.put(request, resp.clone());
          }
          return resp;
        }).catch(() => cache.match(request))
      )
    );
    return;
  }

  // Everything else — network first.
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
