const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/users/doctors - All authenticated users (needed for scheduling forms)
router.get('/doctors', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, department FROM users WHERE role = 'doctor' AND is_active = 1 ORDER BY name ASC"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/users - Admin only
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, role, department, phone, is_active, created_at FROM users ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/users - Admin creates user
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role, department, phone } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0)
      return res.status(409).json({ success: false, message: 'Email already exists.' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, department, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashed, role, department || null, phone || null]
    );

    res.status(201).json({ success: true, message: 'User created successfully.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/users/:id - Admin updates user
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, role, department, phone, is_active } = req.body;
    await db.query(
      'UPDATE users SET name=?, role=?, department=?, phone=?, is_active=? WHERE id=?',
      [name, role, department, phone, is_active, req.params.id]
    );
    res.json({ success: true, message: 'User updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/users/:id - Admin deletes user
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id)
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
