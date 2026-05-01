const CACHE = 'bridge-safi-v5';
const ASSETS = ['/', '/manifest.json', '/logo.jpeg', '/logo_splash.jpeg', '/logo_delivery.jpeg', '/logo_taxi.jpeg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Never intercept API calls or SSE streams
  if (e.request.url.includes('/api/')) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});

self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (_) {}

  const title = data.title || '🛵 Nouvelle commande Bridge !';
  const body  = data.body  || 'Une nouvelle commande vous attend.';
  const orderId = data.data?.orderId;
  const targetUrl = data.data?.url || '/';

  const options = {
    body,
    icon: '/logo_delivery.jpeg',
    badge: '/logo.jpeg',
    tag: `order-${orderId || Date.now()}`,
    renotify: true,
    requireInteraction: true,
    vibrate: [400, 150, 400, 150, 600, 200, 600, 200, 800],
    data: data.data || {},
    actions: [
      { action: 'accept', title: '✅ Accepter' },
      { action: 'view',   title: '👁 Voir' },
    ],
  };

  e.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    }).then(clients => {
      clients.forEach(c => c.postMessage({ type: 'NEW_ORDER_PUSH', data: data.data || {} }));
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const action = e.action;
  const orderData = e.notification.data || {};

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existingClient = clients.find(c => c.focused || c.visibilityState === 'visible');
      if (existingClient) {
        existingClient.postMessage({ type: 'NOTIFICATION_CLICKED', action, data: orderData });
        return existingClient.focus();
      }
      return self.clients.openWindow(orderData.url || '/').then(wc => {
        if (wc) {
          setTimeout(() => wc.postMessage({ type: 'NOTIFICATION_CLICKED', action, data: orderData }), 1500);
        }
      });
    })
  );
});

self.addEventListener('pushsubscriptionchange', e => {
  e.waitUntil(
    self.registration.pushManager.subscribe(e.oldSubscription?.options || { userVisibleOnly: true })
      .then(sub => fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint, keys: { p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')))), auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')))) } }),
      }))
  );
});
