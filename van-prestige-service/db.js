const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'vanprestige.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Tables ──────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    role        TEXT    NOT NULL DEFAULT 'admin',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    is_active   INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_ref   TEXT    NOT NULL UNIQUE,
    service_type  TEXT    NOT NULL,
    pickup_date   TEXT    NOT NULL,
    pickup_time   TEXT    NOT NULL,
    pickup_addr   TEXT    NOT NULL,
    dropoff_addr  TEXT    NOT NULL,
    passengers    INTEGER NOT NULL DEFAULT 1,
    client_name   TEXT    NOT NULL,
    client_email  TEXT    NOT NULL,
    client_phone  TEXT    NOT NULL,
    notes         TEXT,
    status        TEXT    NOT NULL DEFAULT 'pending',
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// ── Seed super-admin ─────────────────────────────────────────────────────────
const seedAdmin = db.prepare('SELECT id FROM admins WHERE email = ?').get('admin@vanprestige.com');
if (!seedAdmin) {
  const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@2024!', 12);
  db.prepare(`
    INSERT INTO admins (name, email, password, role)
    VALUES (?, ?, ?, 'superadmin')
  `).run('Super Admin', 'admin@vanprestige.com', hash);
  console.log('[DB] Super-admin créé : admin@vanprestige.com / Admin@2024!');
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const genRef = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `VPS-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${Math.random().toString(36).substring(2,7).toUpperCase()}`;
};

module.exports = { db, genRef };
