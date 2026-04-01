const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('[LOGIN] Attempt - email:', email, '| password length:', password?.length);

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    console.log('[LOGIN] Users found with email (ignoring is_active):', rows.length);

    if (rows.length === 0) {
      console.log('[LOGIN] FAIL - No user found with email:', email);
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];
    console.log('[LOGIN] User found - id:', user.id, '| is_active:', user.is_active, '| hash starts with:', user.password?.substring(0, 10));

    if (!user.is_active) {
      console.log('[LOGIN] FAIL - User is_active is falsy:', user.is_active);
      return res.status(401).json({ success: false, message: 'Account is disabled.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('[LOGIN] bcrypt.compare result:', isMatch);

    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department }
    });
  } catch (err) {
    console.error('[LOGIN] Server error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/auth/me
const { authMiddleware } = require('../middleware/auth');
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, role, department, phone FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
