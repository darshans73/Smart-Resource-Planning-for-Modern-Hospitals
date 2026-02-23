const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/resources - All authenticated users
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { type, status } = req.query;
    let query = 'SELECT r.*, u.name as created_by_name FROM resources r LEFT JOIN users u ON r.created_by = u.id WHERE 1=1';
    const params = [];
    if (type) { query += ' AND r.type = ?'; params.push(type); }
    if (status) { query += ' AND r.status = ?'; params.push(status); }
    query += ' ORDER BY r.type, r.resource_name';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/resources/summary - Dashboard summary
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const [summary] = await db.query(`
      SELECT 
        type,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'In Use' THEN 1 ELSE 0 END) as in_use,
        SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) as maintenance
      FROM resources 
      GROUP BY type
    `);
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/resources - Admin only
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { resource_name, type, status, location, description, total_count } = req.body;
    if (!resource_name || !type)
      return res.status(400).json({ success: false, message: 'Resource name and type are required.' });

    const count = total_count || 1;
    const avail = status === 'Available' ? count : 0;
    const [result] = await db.query(
      'INSERT INTO resources (resource_name, type, status, location, description, total_count, available_count, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [resource_name, type, status || 'Available', location || null, description || null, count, avail, req.user.id]
    );
    res.status(201).json({ success: true, message: 'Resource added successfully.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/resources/:id - Admin only
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { resource_name, type, status, location, description, total_count, available_count } = req.body;
    await db.query(
      'UPDATE resources SET resource_name=?, type=?, status=?, location=?, description=?, total_count=?, available_count=? WHERE id=?',
      [resource_name, type, status, location, description, total_count, available_count, req.params.id]
    );
    res.json({ success: true, message: 'Resource updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/resources/:id - Admin only
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    // Check if resource has active allocations
    const [active] = await db.query(
      "SELECT id FROM allocations WHERE resource_id = ? AND status = 'active'",
      [req.params.id]
    );
    if (active.length > 0)
      return res.status(400).json({ success: false, message: 'Cannot delete resource with active allocations.' });

    await db.query('DELETE FROM resources WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Resource deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
