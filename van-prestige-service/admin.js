const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { authenticate, requireSuperAdmin, signToken } = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis.' });
  const admin = db.prepare('SELECT * FROM admins WHERE email = ? AND is_active = 1').get(email.trim().toLowerCase());
  if (!admin) return res.status(401).json({ error: 'Identifiants incorrects.' });
  if (!bcrypt.compareSync(password, admin.password)) return res.status(401).json({ error: 'Identifiants incorrects.' });
  const token = signToken(admin);
  res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
});

router.get('/me', authenticate, (req, res) => res.json(req.admin));

router.get('/stats', authenticate, (req, res) => {
  const total     = db.prepare('SELECT COUNT(*) AS c FROM reservations').get().c;
  const pending   = db.prepare("SELECT COUNT(*) AS c FROM reservations WHERE status='pending'").get().c;
  const confirmed = db.prepare("SELECT COUNT(*) AS c FROM reservations WHERE status='confirmed'").get().c;
  const cancelled = db.prepare("SELECT COUNT(*) AS c FROM reservations WHERE status='cancelled'").get().c;
  const today     = db.prepare("SELECT COUNT(*) AS c FROM reservations WHERE date(created_at)=date('now')").get().c;
  const thisWeek  = db.prepare("SELECT COUNT(*) AS c FROM reservations WHERE created_at >= datetime('now','-7 days')").get().c;
  res.json({ total, pending, confirmed, cancelled, today, thisWeek });
});

router.get('/reservations', authenticate, (req, res) => {
  const { status, page = 1, limit = 20, search } = req.query;
  let query = 'SELECT * FROM reservations WHERE 1=1';
  const params = [];
  if (status && status !== 'all') { query += ' AND status = ?'; params.push(status); }
  if (search) {
    query += ' AND (client_name LIKE ? OR client_email LIKE ? OR booking_ref LIKE ? OR client_phone LIKE ?)';
    const s = `%${search}%`; params.push(s, s, s, s);
  }
  const total = db.prepare(`SELECT COUNT(*) AS c FROM (${query})`).get(...params).c;
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  const reservations = db.prepare(query).all(...params);
  res.json({ reservations, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

router.get('/reservations/:id', authenticate, (req, res) => {
  const r = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Introuvable.' });
  res.json(r);
});

router.patch('/reservations/:id/status', authenticate, (req, res) => {
  const { status } = req.body;
  if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status))
    return res.status(400).json({ error: 'Statut invalide.' });
  const info = db.prepare("UPDATE reservations SET status=?, updated_at=datetime('now') WHERE id=?").run(status, req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Introuvable.' });
  res.json({ success: true, status });
});

router.delete('/reservations/:id', authenticate, requireSuperAdmin, (req, res) => {
  const info = db.prepare('DELETE FROM reservations WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Introuvable.' });
  res.json({ success: true });
});

router.get('/users', authenticate, requireSuperAdmin, (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, is_active, created_at FROM admins ORDER BY created_at DESC').all();
  res.json({ users });
});

router.post('/users', authenticate, requireSuperAdmin, (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Nom, email et mot de passe requis.' });
  if (password.length < 8) return res.status(400).json({ error: 'Mot de passe trop court (min 8 caractères).' });
  const existing = db.prepare('SELECT id FROM admins WHERE email = ?').get(email.trim().toLowerCase());
  if (existing) return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
  const hash = bcrypt.hashSync(password, 12);
  const info = db.prepare('INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    name.trim(), email.trim().toLowerCase(), hash, role === 'superadmin' ? 'superadmin' : 'admin'
  );
  res.status(201).json({ success: true, id: info.lastInsertRowid });
});

router.patch('/users/:id', authenticate, (req, res) => {
  const { password, is_active } = req.body;
  const id = parseInt(req.params.id);
  const user = db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Introuvable.' });

  // Changer le mot de passe
  if (password !== undefined) {
    if (req.admin.id !== id && req.admin.role !== 'superadmin')
      return res.status(403).json({ error: 'Accès refusé.' });
    if (password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (min 6 caractères).' });
    const hash = bcrypt.hashSync(password, 12);
    db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hash, id);
  }

  // Activer / désactiver
  if (is_active !== undefined) {
    if (req.admin.role !== 'superadmin') return res.status(403).json({ error: 'Accès refusé.' });
    if (id === req.admin.id) return res.status(400).json({ error: 'Vous ne pouvez pas modifier votre propre statut.' });
    db.prepare('UPDATE admins SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, id);
  }

  res.json({ success: true });
});

router.delete('/users/:id', authenticate, requireSuperAdmin, (req, res) => {
  if (parseInt(req.params.id) === req.admin.id)
    return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' });
  const info = db.prepare('DELETE FROM admins WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Introuvable.' });
  res.json({ success: true });
});

module.exports = router;
