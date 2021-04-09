const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/favicon.ico",
  "/manifest.webmanifest",
  "/assets/css/style.css",
  "/assets/js/loadImages.js",
  "/assets/images/icon-192x192.png",
  "/assets/images/icon-512x512.png",
];

// Install service worker
self.addEventListener("install", function(event) {
    // Pre-cache image data
    event.waitUnit(
        caches.open(DATA_CACHE_NAME).then((cache) => cache.add("/api/transaction"))
    );

    // Pre-cache all static assets
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
    );

    // Tell browser to activate once install is finished
    self.skipWaiting();
});

// Activate service worker and remove old data from cache
self.addEventListener("activate", function(event) {
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("Removing old cache data", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
})

// Enable service worker to intercept network requests
self.addEventListener('fetch', function(event) {
    if (event.request.url.includes('/api/')) {
        console.log('[Service Worker] Fetch (data)', event.request.url);
        
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(event.request)
                .then(response => {
                    if (response.status === 200) {
                        cache.put(event.request.url, response.clone());
                    }

                    return response;
                })
                .catch(err => {
                    return cache.match(event.request);
                });
            })
        );

        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(response => {
                return response || fetch(event.request);
            });
        })
    );
});
