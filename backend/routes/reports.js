const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/reports/dashboard - Main dashboard stats
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const [[{ total_patients }]] = await db.query("SELECT COUNT(*) as total_patients FROM patients WHERE status='admitted'");
    const [[{ total_resources }]] = await db.query("SELECT COUNT(*) as total_resources FROM resources");
    const [[{ available_beds }]] = await db.query("SELECT COUNT(*) as available_beds FROM resources WHERE type IN ('ICU Bed','General Bed') AND status='Available'");
    const [[{ scheduled_surgeries }]] = await db.query("SELECT COUNT(*) as scheduled_surgeries FROM surgeries WHERE status='scheduled' AND surgery_date >= NOW()");
    const [[{ available_ot }]] = await db.query("SELECT COUNT(*) as available_ot FROM resources WHERE type='Operation Theater' AND status='Available'");
    const [[{ active_allocations }]] = await db.query("SELECT COUNT(*) as active_allocations FROM allocations WHERE status='active'");

    const [resource_summary] = await db.query(`
      SELECT type,
        COUNT(*) as total,
        SUM(CASE WHEN status='Available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status='In Use' THEN 1 ELSE 0 END) as in_use,
        SUM(CASE WHEN status='Maintenance' THEN 1 ELSE 0 END) as maintenance
      FROM resources GROUP BY type ORDER BY type
    `);

    const [recent_admissions] = await db.query(`
      SELECT p.patient_id, p.name, p.diagnosis, p.admission_date, p.status, u.name as doctor_name
      FROM patients p LEFT JOIN users u ON p.assigned_doctor = u.id
      ORDER BY p.admission_date DESC LIMIT 5
    `);

    const [upcoming_surgeries] = await db.query(`
      SELECT s.surgery_date, s.ot_room, s.surgery_type, s.status,
             p.name as patient_name, u.name as doctor_name
      FROM surgeries s
      JOIN patients p ON s.patient_id = p.id
      JOIN users u ON s.doctor_id = u.id
      WHERE s.surgery_date >= NOW() AND s.status='scheduled'
      ORDER BY s.surgery_date ASC LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        stats: { total_patients, total_resources, available_beds, scheduled_surgeries, available_ot, active_allocations },
        resource_summary,
        recent_admissions,
        upcoming_surgeries
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/reports/utilization - Resource utilization report
router.get('/utilization', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [utilization] = await db.query(`
      SELECT r.resource_name, r.type, r.status, r.total_count, r.available_count,
        COUNT(a.id) as total_allocations,
        SUM(CASE WHEN a.status='active' THEN 1 ELSE 0 END) as active_allocations,
        ROUND((r.total_count - r.available_count) / r.total_count * 100, 1) as utilization_rate
      FROM resources r
      LEFT JOIN allocations a ON r.id = a.resource_id
      GROUP BY r.id ORDER BY utilization_rate DESC
    `);
    res.json({ success: true, data: utilization });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/reports/bed-occupancy
router.get('/bed-occupancy', authMiddleware, async (req, res) => {
  try {
    const [beds] = await db.query(`
      SELECT r.resource_name, r.type, r.status, r.location,
        p.name as patient_name, p.patient_id as patient_code, p.admission_date, p.diagnosis
      FROM resources r
      LEFT JOIN allocations a ON r.id = a.resource_id AND a.status='active'
      LEFT JOIN patients p ON a.patient_id = p.id
      WHERE r.type IN ('ICU Bed', 'General Bed')
      ORDER BY r.type, r.resource_name
    `);
    res.json({ success: true, data: beds });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
