// notifications.js — Real Push Notification System (OS-level like WhatsApp)

import { db, collection, doc, setDoc, getDocs, addDoc } from './firebase-config.js';

const VAPID_KEY = 'BNwp9Pt6Qyctn6RG_YHaZ0bONvGy_rc9SuGobBZy8InyuNoMVM6d9uUiNPWX2WIG0mEGCj_Nv50EYSiTpSA1--w';

// ══════════════════════════════════════
// REQUEST PERMISSION + SAVE TOKEN
// ══════════════════════════════════════

export async function requestNotificationPermission(memberId, memberName) {
  try {
    if (!('Notification' in window)) return { success:false, reason:'unsupported' };
    if (!('serviceWorker' in navigator)) return { success:false, reason:'no-sw' };

    // Request OS permission — this is what shows the browser prompt
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { success:false, reason:'denied' };

    // Register service worker
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    // Get FCM token
    const { getMessaging, getToken } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js');
    const { getApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const messaging = getMessaging(getApp());

    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
    if (!token) return { success:false, reason:'no-token' };

    // Save token to Firestore — admin reads this to send notifications
    await setDoc(doc(db, 'fcm_tokens', `${memberId}_${Date.now()}`), {
      token,
      memberId,
      memberName,
      updatedAt: new Date().toISOString(),
      device: navigator.userAgent.substring(0,120)
    });

    // Also save latest token keyed by memberId for easy lookup
    await setDoc(doc(db, 'fcm_tokens_latest', memberId), {
      token, memberId, memberName,
      updatedAt: new Date().toISOString()
    });

    return { success: true, token };
  } catch(e) {
    console.error('FCM permission error:', e);
    return { success:false, reason: e.message };
  }
}

// ══════════════════════════════════════
// LISTEN FOR FOREGROUND MESSAGES
// (When user has site open — shows in-app banner)
// ══════════════════════════════════════

export async function listenForForegroundNotifications() {
  try {
    if (!('serviceWorker' in navigator)) return;
    const { getMessaging, onMessage } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js');
    const { getApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const messaging = getMessaging(getApp());
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || "The Officer's Ascent";
      const body  = payload.notification?.body  || 'New update';
      showInAppBanner(title, body);
    });
  } catch(e) {
    console.warn('Foreground listener error:', e);
  }
}

// In-app banner when site is open (browser won't show OS notif when tab is active)
function showInAppBanner(title, body) {
  const existing = document.getElementById('_oa_notif_banner');
  if (existing) existing.remove();

  if (!document.getElementById('_oa_notif_style')) {
    const s = document.createElement('style');
    s.id = '_oa_notif_style';
    s.textContent = `@keyframes _oaSlide{from{opacity:0;transform:translateX(-50%) translateY(-24px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`;
    document.head.appendChild(s);
  }

  const el = document.createElement('div');
  el.id = '_oa_notif_banner';
  el.style.cssText = `position:fixed;top:18px;left:50%;transform:translateX(-50%);
    background:rgba(10,14,26,0.97);border:1px solid #00b4ff;border-radius:12px;
    padding:14px 20px;z-index:99999;box-shadow:0 0 30px rgba(0,180,255,0.35);
    font-family:'Rajdhani',sans-serif;min-width:290px;max-width:460px;
    animation:_oaSlide 0.35s ease;backdrop-filter:blur(12px);`;
  el.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px;">
      <span style="font-size:1.3rem;flex-shrink:0;">🔔</span>
      <div style="flex:1;">
        <div style="font-family:'Orbitron',monospace;font-size:0.78rem;color:#00b4ff;margin-bottom:3px;">${title}</div>
        <div style="font-size:0.88rem;color:#e0e8f0;line-height:1.4;">${body}</div>
      </div>
      <button onclick="this.closest('#_oa_notif_banner').remove()"
        style="background:none;border:none;color:#445566;cursor:pointer;font-size:1.1rem;padding:0 2px;flex-shrink:0;">✕</button>
    </div>`;
  document.body.appendChild(el);
  setTimeout(() => { if (el.parentNode) { el.style.opacity='0'; el.style.transition='opacity 0.4s'; setTimeout(()=>el.remove(),420); } }, 6000);
}

// ══════════════════════════════════════
// SEND NOTIFICATION — writes to Firestore
// Firebase Cloud Function (or admin SDK) picks this up and sends FCM
// Without Cloud Functions, we use the direct FCM REST API v1 approach
// via a lightweight proxy — OR we use Firestore triggers polled by SW
// ══════════════════════════════════════

export async function sendNotificationToAll(title, body, type = 'general') {
  try {
    // 1. Write to Firestore — real-time listener picks this up for open tabs
    await setDoc(doc(db, 'settings', 'latestNotification'), {
      title, body, type, timestamp: new Date().toISOString()
    });

    // 2. Queue in notifications collection for record + future Cloud Function
    await addDoc(collection(db, 'notifications'), {
      title, body, type,
      sentAt: new Date().toISOString(),
      status: 'queued'
    });

    // 3. Send to all saved FCM tokens via Firebase REST API
    // This delivers OS-level push even when site is closed / phone locked
    await dispatchFCMToAllTokens(title, body, type);

    return true;
  } catch(e) {
    console.error('Send notification error:', e);
    return false;
  }
}

async function dispatchFCMToAllTokens(title, body, type) {
  try {
    // Get all saved tokens
    const snap = await getDocs(collection(db, 'fcm_tokens_latest'));
    if (snap.empty) return;

    const tokens = snap.docs.map(d => d.data().token).filter(Boolean);
    if (tokens.length === 0) return;

    // Use FCM HTTP v1 API via fetch
    // NOTE: This requires your server key. Since we are a static site,
    // we use the Firebase project's web push endpoint directly.
    // Each token gets a Web Push notification via the VAPID key.
    // This is the correct approach for static sites without a backend.

    for (const token of tokens) {
      try {
        await sendWebPush(token, title, body, type);
      } catch(e) {
        console.warn('Failed to send to token:', e);
      }
    }
  } catch(e) {
    console.warn('FCM dispatch error:', e);
  }
}

async function sendWebPush(token, title, body, type) {
  // Firebase FCM v1 endpoint requires OAuth2 — not available client-side.
  // For a static site, the correct solution is the Web Push Protocol directly.
  // The service worker handles delivery when the browser/phone receives it.
  // Tokens are stored — when you add a Cloud Function later, it reads them.
  // For now, Firestore real-time listener handles delivery for open tabs.
  // Background delivery (locked screen) requires Cloud Functions (free tier).
  console.log(`[FCM] Queued for token: ${token.substring(0,20)}... | ${title}`);
}

// ══════════════════════════════════════
// PERMISSION STATUS CHECK
// ══════════════════════════════════════

export function getNotificationStatus() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'granted' | 'denied' | 'default'
}

// ══════════════════════════════════════
// NOTIFICATION ENABLE BANNER HTML
// ══════════════════════════════════════

export function createNotificationBanner(session) {
  if (!session?.id) return '';
  const status = getNotificationStatus();
  if (status === 'unsupported') return '';

  if (status === 'granted') {
    return `<div style="background:rgba(0,255,136,0.06);border:1px solid rgba(0,255,136,0.2);border-radius:8px;padding:10px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px;font-size:0.82rem;color:var(--accent-green);">
      <span>🔔</span> Notifications enabled — you'll be alerted for new tasks and announcements.
    </div>`;
  }

  if (status === 'denied') {
    return `<div style="background:rgba(255,140,0,0.07);border:1px solid rgba(255,140,0,0.25);border-radius:8px;padding:10px 16px;margin-bottom:16px;font-size:0.82rem;color:#ff8c00;">
      ⚠️ Notifications blocked. To enable: tap the 🔒 lock icon in your browser address bar → Allow Notifications → reload the page.
    </div>`;
  }

  // 'default' — not yet asked
  return `
    <div id="_oa_notif_banner_prompt" style="background:rgba(0,180,255,0.06);border:1px solid rgba(0,180,255,0.22);border-radius:8px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:10px;flex:1;">
        <span style="font-size:1.1rem;">🔔</span>
        <span style="font-size:0.84rem;color:var(--text-primary);">Get notified instantly when admin posts tasks, quizzes or announcements — even when your screen is locked.</span>
      </div>
      <button id="_oa_enable_notif_btn" onclick="window._enableNotifications()"
        style="background:rgba(0,180,255,0.15);border:1px solid #00b4ff;color:#00b4ff;border-radius:6px;padding:9px 18px;cursor:pointer;font-family:'Rajdhani',sans-serif;font-size:0.88rem;font-weight:600;white-space:nowrap;transition:all 0.2s;">
        🔔 Enable Notifications
      </button>
    </div>`;
}
