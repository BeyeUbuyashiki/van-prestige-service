const router = require('express').Router();
const { db, genRef } = require('../db');

// POST /api/reservations — créer une réservation
router.post('/', (req, res) => {
  const {
    service_type, pickup_date, pickup_time,
    pickup_addr, dropoff_addr, passengers,
    client_name, client_email, client_phone, notes
  } = req.body;

  if (!service_type || !pickup_date || !pickup_time || !pickup_addr || !dropoff_addr
      || !client_name || !client_email || !client_phone) {
    return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis.' });
  }

  const bookingDate = new Date(`${pickup_date}T${pickup_time}`);
  if (bookingDate < new Date()) {
    return res.status(400).json({ error: 'La date de réservation doit être dans le futur.' });
  }

  const booking_ref = genRef();

  try {
    const stmt = db.prepare(`
      INSERT INTO reservations
        (booking_ref, service_type, pickup_date, pickup_time, pickup_addr, dropoff_addr,
         passengers, client_name, client_email, client_phone, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      booking_ref, service_type, pickup_date, pickup_time,
      pickup_addr, dropoff_addr, parseInt(passengers) || 1,
      client_name.trim(), client_email.trim().toLowerCase(),
      client_phone.trim(), notes || ''
    );

    res.status(201).json({
      success: true,
      message: 'Réservation confirmée avec succès !',
      booking_ref
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la réservation.' });
  }
});

// GET /api/reservations/check/:ref
router.get('/check/:ref', (req, res) => {
  const r = db.prepare('SELECT booking_ref, service_type, pickup_date, pickup_time, pickup_addr, dropoff_addr, passengers, client_name, status, created_at FROM reservations WHERE booking_ref = ?').get(req.params.ref);
  if (!r) return res.status(404).json({ error: 'Réservation introuvable.' });
  res.json(r);
});

module.exports = router;
