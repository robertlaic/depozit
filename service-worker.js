// Schimbă această versiune ori de câte ori faci modificări importante
const CACHE_VERSION = 'v1.0';
const CACHE_NAME = 'depozit-etichete-' + CACHE_VERSION;

// Lista tuturor fișierelor care trebuie să fie în cache
const urlsToCache = [
  '/',
  '/index.html',
  '/print-labels.html',
  '/scan-labels.html',
  '/styles.css',
  '/js/form-utils.js',
  '/js/camera-scanner.js',
  '/js/qr-processor.js',
  '/js/gryphon-scanner.js',
  '/js/keyboard-shortcuts-simple.js',
  '/js/main.js',
  '/ergio.png',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js'
];

// Instalarea Service Worker și cache-ul fișierelor inițiale
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalare...');
  
  // Forțează noul service worker să devină activ imediat
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cache deschis');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activarea Service Worker și ștergerea cache-urilor vechi
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activare...');
  
  // Preia controlul imediat al paginilor
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

// Interceptarea request-urilor pentru a servi din cache sau fetch network
self.addEventListener('fetch', event => {
  event.respondWith(
    // Verificăm dacă request-ul este în cache
    caches.match(event.request)
      .then(response => {
        // Cache hit - returnăm răspunsul din cache
        if (response) {
          return response;
        }
        
        // Nu e în cache, facem fetch de la network
        return fetch(event.request)
          .then(networkResponse => {
            // Verificăm dacă avem un răspuns valid
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clonăm răspunsul pentru a-l stoca în cache
            // (pentru că răspunsul poate fi folosit doar o dată)
            var responseToCache = networkResponse.clone();
            
            // Adăugăm răspunsul în cache pentru viitoare accesări
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return networkResponse;
          });
      })
  );
});

// Adăugăm un event listener pentru mesaje de la pagină
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data.action === 'checkForUpdates') {
    console.log('[Service Worker] Verificare actualizări...');
    // Forțează reîncărcarea cache-ului
    caches.delete(CACHE_NAME).then(() => {
      caches.open(CACHE_NAME).then(cache => {
        cache.addAll(urlsToCache);
      });
    });
  }
});