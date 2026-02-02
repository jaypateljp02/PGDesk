// Minimal Service Worker for PWA installability
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
});

self.addEventListener('fetch', (event) => {
    // We can add caching logic here later if offline support is needed
    // For now, we just fetch from network to ensure the "Install" prompt appears
    event.respondWith(fetch(event.request));
});
