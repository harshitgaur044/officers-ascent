// Firebase Messaging Service Worker
// This file MUST stay at the root of the project (same level as index.html)

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

// Handle background notifications (when site is closed/minimised)
messaging.onBackgroundMessage(function(payload) {
  console.log('Background notification received:', payload);

  const { title, body, icon } = payload.notification || {};

  self.registration.showNotification(title || "The Officer's Ascent", {
    body: body || 'New update from admin',
    icon: icon || '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200],
    data: payload.data || {},
    actions: [
      { action: 'open', title: '🔗 Open Site' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  });
});

// Handle notification click — opens the site
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/pages/dashboard.html');
      }
    })
  );
});
