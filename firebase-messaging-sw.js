// firebase-messaging-sw.js
// MUST be at the ROOT of the project (same level as index.html)
// This handles background push notifications — when site is closed or phone locked

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA2Z_m1Te4haUugGqhn-EKdLh27Fg2_dYM",
  authDomain: "the-officers-ascent.firebaseapp.com",
  projectId: "the-officers-ascent",
  storageBucket: "the-officers-ascent.firebasestorage.app",
  messagingSenderId: "394780789406",
  appId: "1:394780789406:web:ae7cc63dd57fe8cad9c98f"
});

const messaging = firebase.messaging();

// ── BACKGROUND NOTIFICATIONS ──
// Fires when site is closed, minimised, or phone screen is locked
messaging.onBackgroundMessage(function(payload) {
  console.log('[SW] Background message received:', payload);

  const title = payload.notification?.title || "The Officer's Ascent";
  const body  = payload.notification?.body  || 'New update from admin';
  const icon  = payload.notification?.icon  || '/icon-192.png';

  self.registration.showNotification(title, {
    body,
    icon,
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: false,
    data: { url: payload.data?.url || '/pages/dashboard.html', type: payload.data?.type || 'general' },
    actions: [
      { action: 'open',    title: '📱 Open App'  },
      { action: 'dismiss', title: 'Dismiss'       }
    ]
  });
});

// ── NOTIFICATION CLICK ──
// Opens the app when user taps the notification
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/pages/dashboard.html';
  const origin = self.location.origin;
  const fullUrl = origin + targetUrl;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // If app is already open, focus it
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      // Otherwise open a new window
      if (clients.openWindow) return clients.openWindow(fullUrl);
    })
  );
});

// ── PUSH EVENT (fallback) ──
self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.notification?.title || data.title || "The Officer's Ascent";
      const body  = data.notification?.body  || data.body  || 'New update';
      event.waitUntil(
        self.registration.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          vibrate: [200, 100, 200],
          data: { url: '/pages/dashboard.html' }
        })
      );
    } catch(e) {
      console.warn('[SW] Push parse error:', e);
    }
  }
});
