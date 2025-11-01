const CACHE_NAME = 'khidmaty-app-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_URL]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // App shell-style offline fallback for navigations
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(OFFLINE_URL);
        return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
      })
    );
    return;
  }

  // For other requests, try network first, then cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Handle Web Push (e.g., FCM) messages
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }

  const hasContent = data && (data.title || data.body);
  if (!hasContent) {
    // Notification payload likely provided by FCM webpush; let the browser show it.
    return;
  }

  const title = data.title || 'Khidmaty';
  const actions = [{ action: 'open', title: 'View request' }];
  if (data?.whatsapp) actions.push({ action: 'whatsapp', title: 'WhatsApp' });
  if (data?.phone) actions.push({ action: 'call', title: 'Call' });
  const options = {
    body: data.body || '',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    requireInteraction: true,
    tag: data.serviceId ? `request-${data.serviceId}` : 'khidmaty-push',
    renotify: true,
    actions,
    data: { url: data.url || '/', ts: Date.now(), ...data },
    vibrate: [100, 50, 100],
    timestamp: Date.now(),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = (event.notification && event.notification.data) || {};
  const action = event.action || 'open';
  const go = (url) => self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
    for (const client of clientsArr) {
      try {
        const href = client.url || '';
        if (href.includes(url)) {
          client.focus();
          return;
        }
      } catch {}
    }
    return self.clients.openWindow(url);
  });

  event.waitUntil((async () => {
    try {
      if (action === 'whatsapp' && data.whatsapp) {
        const num = String(data.whatsapp).replace(/\+/g, '');
        const url = `https://wa.me/${num}`;
        return await go(url);
      }
      if (action === 'call' && data.phone) {
        const tel = `tel:${String(data.phone).replace(/\s+/g, '')}`;
        return await go(tel);
      }
      const url = data.url || '/';
      return await go(url);
    } catch {}
  })());
});
