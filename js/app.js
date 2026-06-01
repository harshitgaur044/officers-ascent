// app.js - Shared utilities used across all pages
import { db, collection, doc, getDoc, getDocs, query, where, orderBy, setDoc } from './firebase-config.js';

// ══════════════════════════════════════
// SESSION MANAGEMENT
// ══════════════════════════════════════

export function getSession() {
  return JSON.parse(sessionStorage.getItem('oa_session') || 'null');
}

export function requireAuth(role = null) {
  const session = getSession();
  if (!session) {
    window.location.href = getLoginPath();
    return null;
  }
  if (role && session.role !== role) {
    window.location.href = getLoginPath();
    return null;
  }
  return session;
}

export function logout() {
  sessionStorage.removeItem('oa_session');
  window.location.href = getLoginPath();
}

function getLoginPath() {
  const path = window.location.pathname;
  if (path.includes('/admin/')) return '../../pages/login.html';
  if (path.includes('/pages/')) return '../pages/login.html';
  return 'pages/login.html';
}

// ══════════════════════════════════════
// TOAST NOTIFICATIONS
// ══════════════════════════════════════

export function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 3800);
}

// ══════════════════════════════════════
// SIDEBAR BUILDER
// ══════════════════════════════════════

export function buildSidebar(session, activePage) {
  const isAdmin = session.role === 'admin';
  const path = window.location.pathname;
  let prefix = '';
  if (path.includes('/admin/')) prefix = '../../';
  else if (path.includes('/pages/')) prefix = '../';

  const memberLinks = [
    { icon: '🏠', label: 'Dashboard', href: `${prefix}pages/dashboard.html`, key: 'dashboard' },
    { icon: '👥', label: 'Members', href: `${prefix}pages/members.html`, key: 'members' },
    { icon: '📋', label: 'Attendance', href: `${prefix}pages/attendance.html`, key: 'attendance' },
    { icon: '⚔️', label: 'Evaluations', href: `${prefix}pages/evaluations.html`, key: 'evaluations' },
    { icon: '🧠', label: 'Quiz Center', href: `${prefix}pages/quiz.html`, key: 'quiz' },
    { icon: '🏆', label: 'Leaderboard', href: `${prefix}pages/leaderboard.html`, key: 'leaderboard' },
    { icon: '📚', label: 'Study Materials', href: `${prefix}pages/study.html`, key: 'study' },
    { icon: '📅', label: 'Weekly Schedule', href: `${prefix}pages/schedule.html`, key: 'schedule' },
    { icon: '👤', label: 'My Profile', href: `${prefix}pages/profile.html`, key: 'profile' },
  ];

  const adminLinks = [
    { icon: '⚡', label: 'Admin Dashboard', href: `${prefix}pages/admin/admin-dashboard.html`, key: 'admin-dashboard' },
    { icon: '👥', label: 'Manage Members', href: `${prefix}pages/admin/manage-members.html`, key: 'manage-members' },
    { icon: '📌', label: 'Manage Tasks', href: `${prefix}pages/admin/manage-tasks.html`, key: 'manage-tasks' },
    { icon: '📅', label: 'Manage Schedule', href: `${prefix}pages/admin/manage-schedule.html`, key: 'manage-schedule' },
    { icon: '🧠', label: 'Manage Quizzes', href: `${prefix}pages/admin/manage-quizzes.html`, key: 'manage-quizzes' },
    { icon: '📚', label: 'Study Materials', href: `${prefix}pages/admin/manage-study.html`, key: 'manage-study' },
    { icon: '📊', label: 'Analytics', href: `${prefix}pages/admin/analytics.html`, key: 'analytics' },
    { icon: '⚙️', label: 'Settings', href: `${prefix}pages/admin/settings.html`, key: 'settings' },
    { icon: '📅', label: 'View Schedule', href: `${prefix}pages/schedule.html`, key: 'schedule' },
    { icon: '🏠', label: 'View Site', href: `${prefix}pages/dashboard.html`, key: 'view-site' },
  ];

  const links = isAdmin ? adminLinks : memberLinks;
  const avatar = session.profilePic ? `<img src="${session.profilePic}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>` : '🪖';
  const roleLabel = isAdmin ? 'ADMIN ACCESS' : 'CANDIDATE';

  const navItems = links.map(l => `
    <a class="nav-item ${activePage === l.key ? 'active' : ''}" href="${l.href}">
      <span class="nav-icon">${l.icon}</span>
      <span>${l.label}</span>
    </a>
  `).join('');

  return `
    <div class="sidebar-logo">
      <span class="logo-icon">⚔️</span>
      <h2>THE OFFICER'S<br>ASCENT</h2>
      <p>Turning Potential Into Leadership</p>
    </div>
    <div class="sidebar-user">
      <div class="sidebar-user-avatar">${avatar}</div>
      <div class="sidebar-user-info">
        <h4>${session.name || 'User'}</h4>
        <span>${roleLabel}</span>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-label">Navigation</div>
      ${navItems}
    </nav>
    <div class="sidebar-footer">
      <button class="btn-logout" onclick="window._logout()">🚪 LOGOUT</button>
    </div>
  `;
}

export function buildMobileTopbar(title) {
  return `
    <div class="mobile-topbar" style="display:flex;">
      <button class="hamburger" onclick="window.toggleSidebar()">☰</button>
      <span style="font-family:'Orbitron',monospace;font-size:0.75rem;color:var(--accent-cyan);letter-spacing:2px;">${title}</span>
      <span style="font-size:0.75rem;color:var(--text-muted)" id="mobileTime"></span>
    </div>
  `;
}

export function buildBottomNav(activePage, isAdmin) {
  if (isAdmin) return '';
  const items = [
    { icon: '🏠', label: 'Home', href: 'dashboard.html', key: 'dashboard' },
    { icon: '👥', label: 'Members', href: 'members.html', key: 'members' },
    { icon: '⚔️', label: 'Eval', href: 'evaluations.html', key: 'evaluations' },
    { icon: '🏆', label: 'Ranks', href: 'leaderboard.html', key: 'leaderboard' },
    { icon: '👤', label: 'Profile', href: 'profile.html', key: 'profile' },
  ];

  // Fix hrefs for admin subpages
  const path = window.location.pathname;
  const pfx = path.includes('/admin/') ? '../../pages/' : '';

  return `
    <nav class="bottom-nav">
      <div class="bottom-nav-items">
        ${items.map(i => `
          <a class="bottom-nav-item ${activePage === i.key ? 'active' : ''}" href="${pfx}${i.href}">
            <span class="nav-icon">${i.icon}</span>
            <span>${i.label}</span>
          </a>
        `).join('')}
      </div>
    </nav>
  `;
}

export function initLayout(session, activePage, pageTitle) {
  const sidebar = document.getElementById('sidebar');
  const mobileTopbarEl = document.getElementById('mobileTopbar');
  const bottomNavEl = document.getElementById('bottomNav');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  if (sidebar) sidebar.innerHTML = buildSidebar(session, activePage);
  if (mobileTopbarEl) mobileTopbarEl.innerHTML = buildMobileTopbar(pageTitle);
  if (bottomNavEl) bottomNavEl.innerHTML = buildBottomNav(activePage, session.role === 'admin');

  window._logout = logout;
  window.toggleSidebar = () => {
    sidebar?.classList.toggle('open');
    sidebarOverlay?.classList.toggle('active');
  };

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      sidebar?.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    });
  }

  function updateClock() {
    const now = new Date();
    const t = now.toLocaleTimeString('en-IN', { hour12: false });
    const el = document.getElementById('topbarTime');
    const mel = document.getElementById('mobileTime');
    if (el) el.textContent = t;
    if (mel) mel.textContent = t;
  }
  updateClock();
  setInterval(updateClock, 1000);
}

// ══════════════════════════════════════
// HELPERS
// ══════════════════════════════════════

export function animateCounter(el, target, duration = 1500) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { start = target; clearInterval(timer); }
    el.textContent = Math.floor(start);
  }, 16);
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
}

export function scoreToColor(score) {
  if (score >= 8) return 'var(--accent-green)';
  if (score >= 6) return 'var(--accent-cyan)';
  if (score >= 4) return 'var(--accent-gold)';
  return 'var(--accent-red)';
}

export async function getActiveMembers() {
  const snap = await getDocs(collection(db, 'members'));
  return snap.docs
    .filter(d => d.data().active && d.data().name)
    .map(d => ({ id: d.id, ...d.data() }));
}

export async function getMemberById(id) {
  const snap = await getDoc(doc(db, 'members', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getEvalTraits() {
  const snap = await getDoc(doc(db, 'settings', 'evalTraits'));
  return snap.exists() ? snap.data().traits : ['Communication', 'Leadership', 'Confidence', 'Knowledge', 'Cooperation', 'Initiative'];
}

export async function getMemberEvalAvg(memberId) {
  const q = query(collection(db, 'evaluations'), where('evaluatedId', '==', memberId));
  const snap = await getDocs(q);
  if (snap.empty) return { total: 0, traits: {}, count: 0 };
  const traits = await getEvalTraits();
  const sums = {};
  traits.forEach(t => sums[t] = 0);
  snap.forEach(d => {
    const data = d.data();
    traits.forEach(t => { sums[t] += (data.scores?.[t] || 0); });
  });
  const count = snap.size;
  const avg = {};
  let total = 0;
  traits.forEach(t => { avg[t] = +(sums[t] / count).toFixed(2); total += avg[t]; });
  return { total: +(total / traits.length).toFixed(2), traits: avg, count };
}

export async function getAttendancePercent(memberId) {
  const allSnap = await getDocs(collection(db, 'attendance'));
  const totalDates = [...new Set(allSnap.docs.map(d => d.data().date))].length;
  const mine = allSnap.docs.filter(d => d.data().memberId === memberId).length;
  if (totalDates === 0) return 0;
  return Math.round((mine / totalDates) * 100);
}

// ══════════════════════════════════════
// BADGE AUTO-AWARD SYSTEM
// ══════════════════════════════════════

export async function recalculateBadges() {
  try {
    const members = await getActiveMembers();
    const traits = await getEvalTraits();
    const allEvals = await getDocs(collection(db, 'evaluations'));
    const allAtt = await getDocs(collection(db, 'attendance'));
    const allQuiz = await getDocs(collection(db, 'quiz_results'));
    const allDates = [...new Set(allAtt.docs.map(d => d.data().date))].length;

    // Build per-member data
    const memberData = {};
    for (const m of members) {
      const mEvals = allEvals.docs.filter(d => d.data().evaluatedId === m.id);
      const traitAvgs = {};
      traits.forEach(t => traitAvgs[t] = 0);
      if (mEvals.length > 0) {
        const sums = {};
        traits.forEach(t => sums[t] = 0);
        mEvals.forEach(d => traits.forEach(t => sums[t] += (d.data().scores?.[t] || 0)));
        traits.forEach(t => traitAvgs[t] = sums[t] / mEvals.length);
      }
      const total = traits.length > 0 ? traits.reduce((s,t) => s + traitAvgs[t], 0) / traits.length : 0;
      const mAtt = allAtt.docs.filter(d => d.data().memberId === m.id).length;
      const attPct = allDates > 0 ? (mAtt / allDates) * 100 : 0;
      const mQuiz = allQuiz.docs.filter(d => d.data().memberId === m.id);
      const quizAvg = mQuiz.length > 0 ? mQuiz.reduce((s,d) => s+d.data().score, 0)/mQuiz.length : 0;

      memberData[m.id] = { member: m, total, traitAvgs, attPct, quizAvg, evalCount: mEvals.length };
    }

    // Group avg per trait
    const groupTraitAvg = {};
    traits.forEach(t => {
      const vals = members.map(m => memberData[m.id].traitAvgs[t]).filter(v => v > 0);
      groupTraitAvg[t] = vals.length > 0 ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
    });

    // Award badges
    const badgeDefs = [
      { key: 'top_performer', icon: '🏆', name: 'Top Performer', check: (id, data) => {
        const max = Math.max(...Object.values(data).map(d => d.total));
        return data[id].total > 0 && data[id].total === max;
      }},
      ...traits.map(t => ({
        key: `best_${t.toLowerCase()}`, icon: getTraitIcon(t), name: `Best ${t}`,
        check: (id, data) => {
          const max = Math.max(...Object.values(data).map(d => d.traitAvgs[t]));
          return data[id].traitAvgs[t] > 0 && data[id].traitAvgs[t] === max;
        }
      })),
      { key: 'quiz_champion', icon: '📚', name: 'Quiz Champion', check: (id, data) => {
        const max = Math.max(...Object.values(data).map(d => d.quizAvg));
        return data[id].quizAvg > 0 && data[id].quizAvg === max;
      }},
      { key: 'attendance_warrior', icon: '🫡', name: 'Attendance Warrior', check: (id, data) => data[id].attPct >= 90 },
      { key: 'all_rounder', icon: '🌟', name: 'All Rounder', check: (id, data) => {
        return traits.every(t => data[id].traitAvgs[t] >= groupTraitAvg[t] && data[id].traitAvgs[t] > 0);
      }},
    ];

    // Clear old badges and re-award
    const oldBadges = await getDocs(collection(db, 'badges'));
    for (const b of oldBadges.docs) {
      await import('./firebase-config.js').then(({ deleteDoc, doc: firestoreDoc }) =>
        deleteDoc(firestoreDoc(db, 'badges', b.id))
      );
    }

    for (const m of members) {
      for (const badge of badgeDefs) {
        if (badge.check(m.id, memberData)) {
          const { addDoc } = await import('./firebase-config.js');
          await addDoc(collection(db, 'badges'), {
            memberId: m.id, memberName: m.name,
            badge_name: badge.name, icon: badge.icon,
            awarded_at: new Date().toISOString()
          });
        }
      }
    }
  } catch(e) {
    console.warn('Badge recalculation error:', e);
  }
}

function getTraitIcon(trait) {
  const icons = { Communication: '🗣️', Leadership: '🦅', Confidence: '💪', Knowledge: '📖', Cooperation: '🤝', Initiative: '⚡' };
  return icons[trait] || '🎯';
}
