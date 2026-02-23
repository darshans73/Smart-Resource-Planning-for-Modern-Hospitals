const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, adminOrReception } = require('../middleware/auth');

// Generate unique patient ID
const generatePatientId = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PAT${year}${month}${rand}`;
};

// GET /api/patients - All authenticated users
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `SELECT p.*, u.name as doctor_name 
                 FROM patients p 
                 LEFT JOIN users u ON p.assigned_doctor = u.id 
                 WHERE 1=1`;
    const params = [];
    if (status) { query += ' AND p.status = ?'; params.push(status); }
    if (search) { query += ' AND (p.name LIKE ? OR p.patient_id LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY p.created_at DESC';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/patients/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, u.name as doctor_name,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', a.id, 'resource_name', r.resource_name, 'type', r.type, 'start_time', a.start_time, 'status', a.status))
         FROM allocations a JOIN resources r ON a.resource_id = r.id WHERE a.patient_id = p.id) as allocations
      FROM patients p LEFT JOIN users u ON p.assigned_doctor = u.id WHERE p.id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Patient not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/patients - Reception + Admin
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, age, gender, phone, address, diagnosis, blood_group, emergency_contact, admission_date, assigned_doctor } = req.body;
    if (!name || !age || !gender || !admission_date)
      return res.status(400).json({ success: false, message: 'Name, age, gender, and admission date are required.' });

    let patientId = generatePatientId();
    // Ensure unique
    let [existing] = await db.query('SELECT id FROM patients WHERE patient_id = ?', [patientId]);
    while (existing.length > 0) {
      patientId = generatePatientId();
      [existing] = await db.query('SELECT id FROM patients WHERE patient_id = ?', [patientId]);
    }

    const [result] = await db.query(
      'INSERT INTO patients (patient_id, name, age, gender, phone, address, diagnosis, blood_group, emergency_contact, admission_date, assigned_doctor, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [patientId, name, age, gender, phone || null, address || null, diagnosis || null, blood_group || null, emergency_contact || null, admission_date, assigned_doctor || null, req.user.id]
    );
    res.status(201).json({ success: true, message: 'Patient registered successfully.', id: result.insertId, patient_id: patientId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/patients/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, age, gender, phone, address, diagnosis, blood_group, emergency_contact, status, discharge_date, assigned_doctor } = req.body;
    await db.query(
      'UPDATE patients SET name=?, age=?, gender=?, phone=?, address=?, diagnosis=?, blood_group=?, emergency_contact=?, status=?, discharge_date=?, assigned_doctor=? WHERE id=?',
      [name, age, gender, phone, address, diagnosis, blood_group, emergency_contact, status, discharge_date || null, assigned_doctor || null, req.params.id]
    );

    // If discharged, release all active allocations
    if (status === 'discharged') {
      const [allocs] = await db.query("SELECT resource_id FROM allocations WHERE patient_id = ? AND status = 'active'", [req.params.id]);
      for (const alloc of allocs) {
        await db.query("UPDATE resources SET status='Available', available_count=available_count+1 WHERE id=?", [alloc.resource_id]);
      }
      await db.query("UPDATE allocations SET status='released', end_time=NOW() WHERE patient_id=? AND status='active'", [req.params.id]);
    }

    res.json({ success: true, message: 'Patient updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
