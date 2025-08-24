// Service Worker for automatic updates
const CACHE_NAME = 'rascal-ai-v5'; // Päivitetty versio
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.png',
  '/hero.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker asennetaan...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Älä cachea JavaScript/CSS tiedostoja - TÄMÄ KORJAA MIME TYPE ONGELMAN
  if (event.request.url.includes('/assets/') || 
      event.request.url.includes('.js') || 
      event.request.url.includes('.css') ||
      event.request.url.includes('__vite') ||
      event.request.url.includes('localhost') ||
      event.request.url.includes('127.0.0.1') ||
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      // Tuotannossa: älä cacheaa JavaScript/CSS tiedostoja
      event.request.url.includes('rascal-ai') ||
      event.request.url.includes('index-') ||
      event.request.url.includes('main-') ||
      event.request.url.includes('vendor-') ||
      // Lisää tarkistukset JavaScript/CSS tiedostoille
      event.request.url.endsWith('.js') ||
      event.request.url.endsWith('.css') ||
      event.request.url.endsWith('.mjs') ||
      event.request.url.includes('chunk') ||
      event.request.url.includes('module')) {
    
    console.log('JavaScript/CSS tiedosto, ei cacheata:', event.request.url);
    // Aina hae uusin versio JavaScript/CSS tiedostoille
    event.respondWith(fetch(event.request));
    return;
  }

  // Tuotannossa käytä cache-strategiaa vain staattisille tiedostoille
  console.log('Cacheataan staattinen tiedosto:', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker aktivoitu, poistetaan vanhat cachet...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Poistetaan vanha cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Listen for messages from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker päivittyy...');
    self.skipWaiting();
  }
});
