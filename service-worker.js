// service-worker.js - VERSIUNE CORECTATĂ pentru GitHub Pages

const CACHE_VERSION = 'v1.3'; // Mărește versiunea
const CACHE_NAME = 'depozit-etichete-' + CACHE_VERSION;

// URL-uri RELATIVE pentru GitHub Pages (cu ./ în loc de /)
const urlsToCache = [
  './',                    
  './index.html',          
  './print-labels.html',
  './scan-labels.html',
  './styles.css',
  './js/form-utils.js',
  './js/camera-scanner.js',
  './js/qr-processor.js',
  './js/gryphon-scanner.js',
  './js/keyboard-shortcuts-simple.js',
  './js/main.js',
  './ergio.png',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js'
];

// Instalarea Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalare versiunea:', CACHE_VERSION);
  
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cache deschis:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[Service Worker] Eroare la cache.addAll:', error);
      })
  );
});

// Activarea Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activare versiunea:', CACHE_VERSION);
  
  self.clients.claim();
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Ștergere cache vechi:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptarea request-urilor
self.addEventListener('fetch', event => {
  // Ignoră request-urile non-GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignoră request-urile către alte domenii (API-uri externe)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Dacă avem în cache, returnează
        if (response) {
          console.log('[Service Worker] Servit din cache:', event.request.url);
          return response;
        }
        
        // Altfel, fetch de la network
        return fetch(event.request)
          .then(networkResponse => {
            // Verifică dacă răspunsul e valid
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clonează și stochează în cache
            const responseToCache = networkResponse.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                console.log('[Service Worker] Adăugat în cache:', event.request.url);
                cache.put(event.request, responseToCache);
              });
              
            return networkResponse;
          })
          .catch(error => {
            console.error('[Service Worker] Fetch error pentru:', event.request.url, error);
            // Returnează o pagină de fallback dacă e disponibilă
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Mesaje de la pagină
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data.action === 'checkForUpdates') {
    console.log('[Service Worker] Verificare actualizări...');
    // Poți adăuga logică pentru verificarea actualizărilor
  }
});