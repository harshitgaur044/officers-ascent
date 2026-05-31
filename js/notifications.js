// notifications.js — Push Notification System
// Handles: requesting permission, saving tokens, sending notifications

import { db, collection, doc, setDoc, getDoc, getDocs, addDoc } from './firebase-config.js';

const VAPID_KEY = 'BNwp9Pt6Qyctn6RG_YHaZ0bONvGy_rc9SuGobBZy8InyuNoMVM6d9uUiNPWX2WIG0mEGCj_Nv50EYSiTpSA1--w';

let messaging = null;

// Initialize Firebase Messaging
async function getMessaging() {
  if (messaging) return messaging;
  const { getMessaging: getFCM } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js');
  const { getApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
  messaging = getFCM(getApp());
  return messaging;
}

// ══════════════════════════════════════
// REQUEST PERMISSION & SAVE TOKEN
// ══════════════════════════════════════

export async function requestNotificationPermission(memberId, memberName) {
  try {
    // Check browser support
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return false;
    }

    if (!('serviceWorker' in navigator)) {
      console.log('Service workers not supported');
      return false;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    // Get FCM token
    const { getToken } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js');
    const msg = await getMessaging();
    const token = await getToken(msg, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (!token) {
      console.log('No token received');
      return false;
    }

    // Save token to Firestore
    await setDoc(doc(db, 'fcm_tokens', memberId), {
      token,
      memberId,
      memberName,
      updatedAt: new Date().toISOString(),
      platform: navigator.platform,
      userAgent: navigator.userAgent.substring(0, 100)
    });

    console.log('FCM token saved for', memberName);
    return true;

  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

// ══════════════════════════════════════
// CHECK CURRENT PERMISSION STATUS
// ══════════════════════════════════════

export function getNotificationStatus() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'granted', 'denied', 'default'
}

// ══════════════════════════════════════
// LISTEN FOR FOREGROUND NOTIFICATIONS
// ══════════════════════════════════════

export async function listenForForegroundNotifications(onMessage) {
  try {
    const { onMessage: fcmOnMessage } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js');
    const msg = await getMessaging();
    fcmOnMessage(msg, (payload) => {
      console.log('Foreground notification:', payload);
      if (onMessage) onMessage(payload);

      // Show in-app toast since browser won't show notification when tab is open
      const title = payload.notification?.title || "The Officer's Ascent";
      const body = payload.notification?.body || 'New update';
      showInAppNotification(title, body);
    });
  } catch(e) {
    console.warn('Could not listen for foreground notifications:', e);
  }
}

// ══════════════════════════════════════
// IN-APP NOTIFICATION (when site is open)
// ══════════════════════════════════════

function showInAppNotification(title, body) {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position:fixed; top:20px; left:50%; transform:translateX(-50%);
    background:rgba(13,18,37,0.97); border:1px solid #00b4ff;
    border-radius:12px; padding:16px 24px; z-index:99999;
    box-shadow:0 0 30px rgba(0,180,255,0.3);
    font-family:'Rajdhani',sans-serif; min-width:300px; max-width:480px;
    animation:slideDown 0.4s ease; backdrop-filter:blur(10px);
  `;
  notif.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px;">
      <span style="font-size:1.4rem;">🔔</span>
      <div>
        <div style="font-family:'Orbitron',monospace;font-size:0.8rem;color:#00b4ff;margin-bottom:4px;">${title}</div>
        <div style="font-size:0.9rem;color:#e0e8f0;">${body}</div>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:#445566;cursor:pointer;font-size:1.2rem;margin-left:auto;padding:0 4px;">✕</button>
    </div>
  `;

  // Add animation style if not already present
  if (!document.getElementById('notif-style')) {
    const style = document.createElement('style');
    style.id = 'notif-style';
    style.textContent = `@keyframes slideDown { from { opacity:0; transform:translateX(-50%) translateY(-20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`;
    document.head.appendChild(style);
  }

  document.body.appendChild(notif);
  setTimeout(() => { notif.style.opacity='0'; notif.style.transition='opacity 0.4s'; setTimeout(()=>notif.remove(), 400); }, 5000);
}

// ══════════════════════════════════════
// SEND NOTIFICATION VIA FIRESTORE TRIGGER
// (Admin calls this — stores in Firestore, Cloud Function sends FCM)
// ══════════════════════════════════════

export async function sendNotificationToAll(title, body, type = 'announcement') {
  try {
    // Save to notifications collection — this triggers the send
    await addDoc(collection(db, 'notifications'), {
      title,
      body,
      type, // 'announcement', 'task', 'quiz', 'material'
      sentAt: new Date().toISOString(),
      sentBy: 'admin',
      status: 'pending'
    });

    // Also directly notify via Firestore real-time (fallback for when site is open)
    await setDoc(doc(db, 'settings', 'latestNotification'), {
      title, body, type,
      timestamp: new Date().toISOString()
    });

    console.log('Notification queued:', title);
    return true;
  } catch(e) {
    console.error('Error sending notification:', e);
    return false;
  }
}

// ══════════════════════════════════════
// NOTIFICATION PERMISSION BUTTON UI
// ══════════════════════════════════════

export function createNotificationBanner(session) {
  const status = getNotificationStatus();
  if (status === 'granted' || status === 'unsupported' || !session?.id) return '';

  if (status === 'denied') {
    return `
      <div style="background:rgba(255,140,0,0.08);border:1px solid rgba(255,140,0,0.3);border-radius:8px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px;">
        <span>⚠️</span>
        <span style="font-size:0.85rem;color:#ff8c00;">Notifications are blocked. To enable: click the 🔒 lock icon in your browser address bar → Allow notifications.</span>
      </div>`;
  }

  return `
    <div id="notifBanner" style="background:rgba(0,180,255,0.06);border:1px solid rgba(0,180,255,0.25);border-radius:8px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:1.2rem;">🔔</span>
        <span style="font-size:0.85rem;color:#e0e8f0;">Enable notifications to get instant alerts when admin posts tasks or announcements.</span>
      </div>
      <button onclick="window.enableNotifications()" style="background:rgba(0,180,255,0.15);border:1px solid #00b4ff;color:#00b4ff;border-radius:6px;padding:8px 16px;cursor:pointer;font-family:'Rajdhani',sans-serif;font-size:0.85rem;font-weight:600;white-space:nowrap;">🔔 Enable Notifications</button>
    </div>`;
}
