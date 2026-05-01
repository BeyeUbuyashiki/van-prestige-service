const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'vps_jwt_secret_change_in_production_2024';

const authenticate = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const admin = db.prepare('SELECT id, name, email, role FROM admins WHERE id = ? AND is_active = 1').get(payload.id);
    if (!admin) return res.status(401).json({ error: 'Compte désactivé' });
    req.admin = admin;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};

const requireSuperAdmin = (req, res, next) => {
  if (req.admin.role !== 'superadmin') {
    return res.status(403).json({ error: 'Accès réservé au super-administrateur' });
  }
  next();
};

const signToken = (admin) => jwt.sign(
  { id: admin.id, email: admin.email, role: admin.role },
  JWT_SECRET,
  { expiresIn: '12h' }
);

module.exports = { authenticate, requireSuperAdmin, signToken };
