const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// GET /api/surgeries
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, p.name as patient_name, p.patient_id as patient_code,
             u.name as doctor_name, cb.name as created_by_name
      FROM surgeries s
      JOIN patients p ON s.patient_id = p.id
      JOIN users u ON s.doctor_id = u.id
      LEFT JOIN users cb ON s.created_by = cb.id
      ORDER BY s.surgery_date DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/surgeries - Schedule OT
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { patient_id, doctor_id, ot_room, surgery_date, duration_minutes, surgery_type, notes } = req.body;
    if (!patient_id || !doctor_id || !ot_room || !surgery_date)
      return res.status(400).json({ success: false, message: 'Patient, doctor, OT room, and surgery date are required.' });

    const surgeryStart = new Date(surgery_date);
    const duration = duration_minutes || 60;
    const surgeryEnd = new Date(surgeryStart.getTime() + duration * 60000);

    // Check OT room conflict
    const [conflicts] = await db.query(`
      SELECT id FROM surgeries 
      WHERE ot_room = ? 
        AND status NOT IN ('completed', 'cancelled')
        AND (
          (surgery_date <= ? AND DATE_ADD(surgery_date, INTERVAL duration_minutes MINUTE) > ?) OR
          (surgery_date < ? AND DATE_ADD(surgery_date, INTERVAL duration_minutes MINUTE) >= ?)
        )
    `, [ot_room, surgeryEnd, surgeryStart, surgeryEnd, surgeryStart]);

    if (conflicts.length > 0)
      return res.status(409).json({ success: false, message: 'OT room is already scheduled during this time. Please choose another time or OT room.' });

    // Check doctor availability
    const [doctorConflicts] = await db.query(`
      SELECT id FROM surgeries 
      WHERE doctor_id = ? 
        AND status NOT IN ('completed', 'cancelled')
        AND (
          (surgery_date <= ? AND DATE_ADD(surgery_date, INTERVAL duration_minutes MINUTE) > ?) OR
          (surgery_date < ? AND DATE_ADD(surgery_date, INTERVAL duration_minutes MINUTE) >= ?)
        )
    `, [doctor_id, surgeryEnd, surgeryStart, surgeryEnd, surgeryStart]);

    if (doctorConflicts.length > 0)
      return res.status(409).json({ success: false, message: 'Doctor is already scheduled for another surgery during this time.' });

    const [result] = await db.query(
      'INSERT INTO surgeries (patient_id, doctor_id, ot_room, surgery_date, duration_minutes, surgery_type, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [patient_id, doctor_id, ot_room, surgery_date, duration, surgery_type || null, notes || null, req.user.id]
    );

    res.status(201).json({ success: true, message: 'Surgery scheduled successfully.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/surgeries/:id - Update surgery status
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { status, notes } = req.body;
    await db.query('UPDATE surgeries SET status=?, notes=? WHERE id=?', [status, notes, req.params.id]);
    res.json({ success: true, message: 'Surgery updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/surgeries/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.query("UPDATE surgeries SET status='cancelled' WHERE id=?", [req.params.id]);
    res.json({ success: true, message: 'Surgery cancelled.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
