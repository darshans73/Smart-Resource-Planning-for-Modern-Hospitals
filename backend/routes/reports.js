const express = require('express');
const router = express.Router();
const db = require('../config/db');
const PDFDocument = require('pdfkit');
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

// GET /api/reports/advanced-analytics
router.get('/advanced-analytics', authMiddleware, adminOnly, async (req, res) => {
  try {
    // Staff Workload (Mock logic representing surgeries + patients handled)
    const [staffStats] = await db.query(`
      SELECT u.name, u.role, COUNT(s.id) as surgeries_done, COUNT(DISTINCT p.id) as patients_assigned
      FROM users u
      LEFT JOIN surgeries s ON u.id = s.doctor_id
      LEFT JOIN patients p ON u.id = p.assigned_doctor
      WHERE u.role IN ('doctor', 'nurse')
      GROUP BY u.id
      ORDER BY surgeries_done DESC, patients_assigned DESC
      LIMIT 10
    `);

    // Equipment ROI logic (Utilization count * mock cost factor)
    const [roiStats] = await db.query(`
      SELECT r.resource_name as name, COUNT(a.id) as usage_count, 
      (COUNT(a.id) * 1500) as revenue_generated
      FROM resources r
      LEFT JOIN allocations a ON r.id = a.resource_id
      WHERE r.type IN ('MRI Machine', 'CT Scanner', 'Operation Theater', 'Ventilator')
      GROUP BY r.id
      ORDER BY revenue_generated DESC
    `);

    // Utilization trends over recent dummy months 
    const trendData = [
      { name: "Jan", ICU: 400, OT: 240, Gen: 2400 },
      { name: "Feb", ICU: 300, OT: 139, Gen: 2210 },
      { name: "Mar", ICU: 200, OT: 980, Gen: 2290 },
      { name: "Apr", ICU: 278, OT: 390, Gen: 2000 },
      { name: "May", ICU: 189, OT: 480, Gen: 2181 },
      { name: "Jun", ICU: 239, OT: 380, Gen: 2500 },
      { name: "Jul", ICU: 349, OT: 430, Gen: 2100 }
    ];

    res.json({ success: true, data: { staffStats, roiStats, trendData } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/reports/export/csv
router.get('/export/csv', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [beds] = await db.query(`
      SELECT r.resource_name, r.type, r.status, p.name as patient_name, p.admission_date
      FROM resources r
      LEFT JOIN allocations a ON r.id = a.resource_id AND a.status='active'
      LEFT JOIN patients p ON a.patient_id = p.id
    `);

    let csv = 'Resource Name,Type,Status,Assigned Patient,Admission Date\n';
    beds.forEach(row => {
      csv += `"${row.resource_name}","${row.type}","${row.status}","${row.patient_name || ''}","${row.admission_date || ''}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('hospital_resource_report.csv');
    return res.send(csv);
  } catch(err) {
    res.status(500).send('Error generating export');
  }
});

// GET /api/reports/export/pdf
router.get('/export/pdf', authMiddleware, adminOnly, async (req, res) => {
  try {
    // We send a beautiful PDF
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-disposition', 'attachment; filename="Executive_Summary.pdf"');
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    doc.fillColor('#2563EB').fontSize(24).text('Hospital RMS', { align: 'center' });
    doc.fillColor('#475569').fontSize(12).text('Enterprise Resource Management system', { align: 'center' });
    doc.moveDown(2);

    doc.fillColor('#000').fontSize(18).text('Executive Summary Report', { underline: true });
    doc.moveDown();

    const [[{ total_patients }]] = await db.query("SELECT COUNT(*) as total_patients FROM patients WHERE status='admitted'");
    const [[{ active_allocations }]] = await db.query("SELECT COUNT(*) as active_allocations FROM allocations WHERE status='active'");

    doc.fontSize(14).text(`Total Admitted Patients: ${total_patients}`);
    doc.text(`Active Bed Allocations: ${active_allocations}`);
    doc.moveDown(2);

    doc.fontSize(14).text('Utilization Breakdown:');
    doc.moveDown();
    
    const [summary] = await db.query(`
      SELECT type, COUNT(*) as total, SUM(CASE WHEN status='In Use' THEN 1 ELSE 0 END) as in_use
      FROM resources GROUP BY type
    `);

    summary.forEach(row => {
        let percentage = row.total > 0 ? Math.round((row.in_use / row.total) * 100) : 0;
        doc.fontSize(12).text(`• ${row.type}: ${row.in_use} / ${row.total} occupied (${percentage}% utilized)`);
    });

    doc.moveDown(3);
    doc.fillColor('#94a3b8').fontSize(10).text('Generated automatically by the AI Reporting Engine.', { align: 'center' });
    
    doc.end();
  } catch(err) {
    console.error(err);
    res.status(500).send('Error generating PDF report');
  }
});

module.exports = router;
