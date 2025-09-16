const CACHE_NAME = 'biology-flashcards-v4'; // Updated version name
const URLS_TO_CACHE = [
    '/TYSC-LGCSE-Biology-Flash-Card-App/',
    '/TYSC-LGCSE-Biology-Flash-Card-App/index.html',
    '/TYSC-LGCSE-Biology-Flash-Card-App/style.css',
    '/TYSC-LGCSE-Biology-Flash-Card-App/app.js',
    '/TYSC-LGCSE-Biology-Flash-Card-App/glossary.js',
    '/TYSC-LGCSE-Biology-Flash-Card-App/icons/icon-192x192.png',
    '/TYSC-LGCSE-Biology-Flash-Card-App/icons/icon-512x512.png',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap'
];

// Install the service worker and cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(URLS_TO_CACHE);
            })
    );
});

// Serve cached assets when offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});

// Update the cache and remove old ones
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
