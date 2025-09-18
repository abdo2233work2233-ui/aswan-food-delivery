// Service Worker for Aswan Food Delivery - Performance Optimized
const CACHE_NAME = 'aswan-food-v2';
const STATIC_CACHE_URLS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
  static: 'cache-first',
  api: 'network-first',
  images: 'cache-first',
  fonts: 'cache-first'
};

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event with optimized caching strategies
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);
  const pathname = url.pathname;

  // Determine cache strategy based on resource type
  let strategy = 'network-first';
  
  if (pathname.includes('/static/') || pathname.includes('.css') || pathname.includes('.js')) {
    strategy = 'cache-first';
  } else if (pathname.includes('/api/')) {
    strategy = 'network-first';
  } else if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    strategy = 'cache-first';
  }

  event.respondWith(handleRequest(event.request, strategy));
});

// Optimized request handling
async function handleRequest(request, strategy) {
  const cache = await caches.open(CACHE_NAME);
  
  if (strategy === 'cache-first') {
    // Try cache first, fallback to network
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      return new Response('Offline', { status: 503 });
    }
  } else {
    // Network first, fallback to cache
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      return new Response('Offline', { status: 503 });
    }
  }
}

// Background sync for offline orders
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle offline orders when connection is restored
      handleOfflineOrders()
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'View Order',
          icon: '/logo192.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/logo192.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/orders')
    );
  }
});

// Helper function for offline orders
async function handleOfflineOrders() {
  try {
    // Get offline orders from IndexedDB
    const offlineOrders = await getOfflineOrders();
    
    for (const order of offlineOrders) {
      try {
        // Send order to server
        await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(order)
        });
        
        // Remove from offline storage
        await removeOfflineOrder(order.id);
      } catch (error) {
        console.error('Failed to sync order:', error);
      }
    }
  } catch (error) {
    console.error('Failed to handle offline orders:', error);
  }
}

// IndexedDB helpers (simplified)
async function getOfflineOrders() {
  // Implementation would depend on your IndexedDB setup
  return [];
}

async function removeOfflineOrder(orderId) {
  // Implementation would depend on your IndexedDB setup
  return Promise.resolve();
}
