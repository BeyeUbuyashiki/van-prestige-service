require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/admin',        require('./routes/admin'));

// SPA fallback for admin
app.get('/admin*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚐 Van Prestige Service — Serveur démarré sur http://localhost:${PORT}`);
  console.log(`   Admin Panel : http://localhost:${PORT}/admin/login.html`);
  console.log(`   Environnement : ${process.env.NODE_ENV || 'development'}\n`);
});
