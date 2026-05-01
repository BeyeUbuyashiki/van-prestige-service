const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => { navbar.classList.toggle('scrolled', window.scrollY > 60); });
function openMenu()  { document.getElementById('navMobile').classList.add('open'); document.body.style.overflow='hidden'; }
function closeMenu() { document.getElementById('navMobile').classList.remove('open'); document.body.style.overflow=''; }
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = parseInt(el.dataset.target);
    let current = 0;
    const step = Math.ceil(target / 60);
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current + (target === 24 ? 'h' : target === 7 ? 'j' : '+');
      if (current >= target) clearInterval(interval);
    }, 30);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.animation = 'slideOut 0.3s ease forwards'; setTimeout(() => toast.remove(), 300); }, 4500);
}
function openCheckModal()  { document.getElementById('checkModal').classList.add('open'); }
function closeCheckModal() {
  document.getElementById('checkModal').classList.remove('open');
  document.getElementById('checkResult').style.display = 'none';
  document.getElementById('checkRef').value = '';
}
document.getElementById('checkModal')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('checkModal')) closeCheckModal();
});
async function checkReservation() {
  const ref = document.getElementById('checkRef').value.trim();
  if (!ref) { showToast('Veuillez entrer votre référence.', 'warning'); return; }
  const result = document.getElementById('checkResult');
  result.innerHTML = '<p style="color:var(--gray);text-align:center">Recherche en cours...</p>';
  result.style.display = 'block';
  try {
    const res = await fetch(`/api/reservations/check/${encodeURIComponent(ref)}`);
    const data = await res.json();
    if (!res.ok) { result.innerHTML = `<div style="background:rgba(229,62,62,0.1);border:1px solid rgba(229,62,62,0.3);border-radius:10px;padding:1rem;color:#FC8181;text-align:center">❌ ${data.error}</div>`; return; }
    const statusColors = { pending: '#ECC94B', confirmed: '#68D391', cancelled: '#FC8181', completed: '#76E4F7' };
    const statusLabels = { pending: '⏳ En attente', confirmed: '✅ Confirmée', cancelled: '❌ Annulée', completed: '🏁 Terminée' };
    const color = statusColors[data.status] || '#9CA3AF';
    result.innerHTML = `<div style="background:rgba(201,168,76,0.05);border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:1.5rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <strong style="color:var(--gold);font-size:0.9rem">${data.booking_ref}</strong>
        <span style="background:rgba(0,0,0,0.3);color:${color};padding:0.3rem 0.75rem;border-radius:20px;font-size:0.8rem;border:1px solid ${color}">${statusLabels[data.status]||data.status}</span>
      </div>
      <div style="display:grid;gap:0.6rem;font-size:0.85rem">
        <div style="display:flex;justify-content:space-between"><span style="color:var(--gray)">Service :</span><span>${data.service_type}</span></div>
        <div style="display:flex;justify-content:space-between"><span style="color:var(--gray)">Date :</span><span>${data.pickup_date} à ${data.pickup_time}</span></div>
        <div style="display:flex;justify-content:space-between"><span style="color:var(--gray)">Départ :</span><span>${data.pickup_addr}</span></div>
        <div style="display:flex;justify-content:space-between"><span style="color:var(--gray)">Arrivée :</span><span>${data.dropoff_addr}</span></div>
        <div style="display:flex;justify-content:space-between"><span style="color:var(--gray)">Client :</span><span>${data.client_name}</span></div>
      </div></div>`;
  } catch { result.innerHTML = `<div style="color:var(--red);text-align:center">Une erreur est survenue.</div>`; }
}
document.getElementById('contactForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  showToast('Message envoyé ! Nous vous répondrons rapidement.', 'success');
  e.target.reset();
});
