// PGDesk Service Worker v2.0
const CACHE_NAME = 'pgdesk-cache-v2';

// Static assets to cache
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker v2.0...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - Network first, cache fallback
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip API calls - always go to network
    if (request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        fetch(request)
            .then(response => {
                // Clone response to cache
                const responseClone = response.clone();

                // Cache successful responses
                if (response.status === 200) {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseClone);
                    });
                }

                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(request).then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // Return offline page for navigation requests
                    if (request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }

                    return new Response('Offline', { status: 503 });
                });
            })
    );
});

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        self.registration.showNotification(data.title || 'PGDesk', {
            body: data.body || 'You have a new notification',
            icon: '/icon-192.png',
            badge: '/icon-192.png'
        });
    }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});
