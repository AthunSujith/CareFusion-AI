// Simple service worker for PWA installation
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installed');
});

self.addEventListener('fetch', (event) => {
    // Respond with original request
    event.respondWith(fetch(event.request));
});
