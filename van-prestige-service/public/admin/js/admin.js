// ── AUTH HELPERS ──
function getToken() { return localStorage.getItem('vps_token'); }
function getAdmin() {
  try { return JSON.parse(localStorage.getItem('vps_admin') || 'null'); } catch { return null; }
}
function logout() {
  localStorage.removeItem('vps_token');
  localStorage.removeItem('vps_admin');
  window.location.href = '/admin/login.html';
}
function requireAuth() {
  if (!getToken()) { window.location.href = '/admin/login.html'; return false; }
  return true;
}
function requireSuperAdmin() {
  const admin = getAdmin();
  if (!admin || admin.role !== 'superadmin') return false;
  return true;
}

// ── API WRAPPER ──
async function api(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(path, { ...options, headers });
  if (res.status === 401) { logout(); return; }
  return res;
}

// ── UI HELPERS ──
function showToast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

function statusBadge(status) {
  const map = {
    pending: ['badge-pending', '⏳ En attente'],
    confirmed: ['badge-confirmed', '✅ Confirmée'],
    cancelled: ['badge-cancelled', '❌ Annulée'],
    completed: ['badge-completed', '🏁 Terminée'],
  };
  const [cls, label] = map[status] || ['badge-ghost', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function roleBadge(role) {
  return role === 'superadmin'
    ? `<span class="badge badge-superadmin">⭐ Superadmin</span>`
    : `<span class="badge badge-admin">👤 Admin</span>`;
}

function activeBadge(is_active) {
  return is_active
    ? `<span class="badge badge-active">● Actif</span>`
    : `<span class="badge badge-inactive">● Inactif</span>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── POPULATE USER INFO IN SIDEBAR ──
function populateSidebarUser() {
  const admin = getAdmin();
  if (!admin) return;
  const nameEl = document.getElementById('sidebarUserName');
  const roleEl = document.getElementById('sidebarUserRole');
  const avatarEl = document.getElementById('sidebarAvatar');
  if (nameEl) nameEl.textContent = admin.name || admin.email;
  if (roleEl) roleEl.textContent = admin.role === 'superadmin' ? 'Super Admin' : 'Administrateur';
  if (avatarEl) avatarEl.textContent = (admin.name || admin.email || 'A')[0].toUpperCase();
  // Hide user management link if not superadmin
  const usersLink = document.getElementById('usersNavLink');
  if (usersLink && admin.role !== 'superadmin') usersLink.style.display = 'none';
}

// ── MOBILE SIDEBAR TOGGLE ──
function initSidebar() {
  const toggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('show');
    });
    if (overlay) overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  }
}

// ── MODAL HELPERS ──
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
function closeOnOutsideClick(id) {
  document.getElementById(id)?.addEventListener('click', function(e) {
    if (e.target === this) closeModal(id);
  });
}
