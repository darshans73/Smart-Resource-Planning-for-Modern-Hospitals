const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// GET /api/allocations
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, p.name as patient_name, p.patient_id as patient_code,
             r.resource_name, r.type as resource_type,
             u.name as allocated_by_name
      FROM allocations a
      JOIN patients p ON a.patient_id = p.id
      JOIN resources r ON a.resource_id = r.id
      LEFT JOIN users u ON a.allocated_by = u.id
      ORDER BY a.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/allocations - Assign resource to patient
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { patient_id, resource_id, start_time, end_time, notes } = req.body;
    if (!patient_id || !resource_id || !start_time)
      return res.status(400).json({ success: false, message: 'Patient, resource, and start time are required.' });

    // Check resource availability
    const [resource] = await db.query('SELECT * FROM resources WHERE id = ?', [resource_id]);
    if (resource.length === 0) return res.status(404).json({ success: false, message: 'Resource not found.' });
    if (resource[0].status !== 'Available')
      return res.status(409).json({ success: false, message: `Resource is currently ${resource[0].status}. Cannot allocate.` });

    // Check patient is admitted
    const [patient] = await db.query("SELECT * FROM patients WHERE id = ? AND status = 'admitted'", [patient_id]);
    if (patient.length === 0) return res.status(404).json({ success: false, message: 'Patient not found or not currently admitted.' });

    // Check for existing active allocation of same resource to same patient
    const [existAlloc] = await db.query(
      "SELECT id FROM allocations WHERE patient_id=? AND resource_id=? AND status='active'",
      [patient_id, resource_id]
    );
    if (existAlloc.length > 0)
      return res.status(409).json({ success: false, message: 'This resource is already allocated to this patient.' });

    // Create allocation
    const [result] = await db.query(
      'INSERT INTO allocations (patient_id, resource_id, allocated_by, start_time, end_time, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [patient_id, resource_id, req.user.id, start_time, end_time || null, notes || null]
    );

    // Update resource status
    await db.query("UPDATE resources SET status='In Use', available_count=GREATEST(available_count-1,0) WHERE id=?", [resource_id]);

    res.status(201).json({ success: true, message: 'Resource allocated successfully.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/allocations/:id/release - Release resource
router.put('/:id/release', authMiddleware, async (req, res) => {
  try {
    const [alloc] = await db.query("SELECT * FROM allocations WHERE id = ? AND status='active'", [req.params.id]);
    if (alloc.length === 0) return res.status(404).json({ success: false, message: 'Active allocation not found.' });

    await db.query("UPDATE allocations SET status='released', end_time=NOW() WHERE id=?", [req.params.id]);
    await db.query("UPDATE resources SET status='Available', available_count=available_count+1 WHERE id=?", [alloc[0].resource_id]);

    res.json({ success: true, message: 'Resource released successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
