// Run this script to set up the database and create fresh user accounts
// Usage: node setup.js
// Run from: backend/ directory

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function setup() {
  console.log('🔧 Hospital RMS Setup Script');
  console.log('============================\n');

  let connection;
  try {
    // Step 1: Connect WITHOUT selecting a DB first
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '9443',
      multipleStatements: true,
      ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
    });
    console.log('✅ Connected to MySQL\n');

    // Step 2: Create DB if local, or just USE it if on Railway
    const dbName = process.env.DB_NAME || 'hospital_rms';
    if (!process.env.DB_NAME || process.env.DB_NAME === 'hospital_rms') {
      await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    }
    await connection.query(`USE ${dbName}`);
    console.log(`✅ Database "${dbName}" ready\n`);

    // Step 3: Create all tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin','doctor','nurse','reception') NOT NULL DEFAULT 'reception',
        department VARCHAR(100),
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        age INT NOT NULL,
        gender ENUM('Male','Female','Other') NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        diagnosis TEXT,
        blood_group VARCHAR(5),
        emergency_contact VARCHAR(20),
        admission_date DATETIME NOT NULL,
        discharge_date DATETIME,
        status ENUM('admitted','discharged','critical') DEFAULT 'admitted',
        assigned_doctor INT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_doctor) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        resource_name VARCHAR(100) NOT NULL,
        type ENUM('ICU Bed','General Bed','Operation Theater','Ventilator','MRI Machine','CT Scanner','Ambulance','Equipment') NOT NULL,
        status ENUM('Available','In Use','Maintenance') DEFAULT 'Available',
        location VARCHAR(100),
        description TEXT,
        total_count INT DEFAULT 1,
        available_count INT DEFAULT 1,
        last_maintained DATETIME,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS allocations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        resource_id INT NOT NULL,
        allocated_by INT,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        status ENUM('active','released','cancelled') DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
        FOREIGN KEY (allocated_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS surgeries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        doctor_id INT NOT NULL,
        ot_room VARCHAR(50) NOT NULL,
        surgery_date DATETIME NOT NULL,
        duration_minutes INT DEFAULT 60,
        surgery_type VARCHAR(100),
        status ENUM('scheduled','in_progress','completed','cancelled') DEFAULT 'scheduled',
        notes TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS equipment_bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        resource_id INT NOT NULL,
        patient_id INT,
        booked_by INT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        purpose TEXT,
        status ENUM('active','released','cancelled') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
        FOREIGN KEY (booked_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('info','warning','error','success') DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ All 7 tables created\n');

    // Step 4: Generate fresh bcrypt hash for "Admin@123"
    const hash = await bcrypt.hash('Admin@123', 10);
    console.log('✅ Password hash generated\n');

    // Step 5: Remove existing seed users and re-insert with fresh hash
    await connection.query(
      "DELETE FROM users WHERE email IN ('admin@hospital.com','doctor@hospital.com','nurse@hospital.com','reception@hospital.com')"
    );

    await connection.query(
      `INSERT INTO users (name, email, password, role, department, phone) VALUES
        ('Super Admin', 'admin@hospital.com', ?, 'admin', 'Administration', '9876543210'),
        ('Dr. Rajesh Kumar', 'doctor@hospital.com', ?, 'doctor', 'Cardiology', '9876543211'),
        ('Nurse Priya', 'nurse@hospital.com', ?, 'nurse', 'ICU', '9876543212'),
        ('Reception Staff', 'reception@hospital.com', ?, 'reception', 'Reception', '9876543213')`,
      [hash, hash, hash, hash]
    );

    console.log('✅ Users seeded\n');
    console.log('👤 Login credentials:');
    console.log('   Admin     → admin@hospital.com       / Admin@123');
    console.log('   Doctor    → doctor@hospital.com      / Admin@123');
    console.log('   Nurse     → nurse@hospital.com       / Admin@123');
    console.log('   Reception → reception@hospital.com   / Admin@123\n');

    // Step 6: Seed resources only if empty
    const [[{ cnt }]] = await connection.query('SELECT COUNT(*) as cnt FROM resources');
    if (cnt === 0) {
      await connection.query(`
        INSERT INTO resources (resource_name, type, status, location, total_count, available_count, created_by) VALUES
        ('ICU Bed 101',       'ICU Bed',           'Available',   'ICU Ward - Floor 2',      1, 1, 1),
        ('ICU Bed 102',       'ICU Bed',           'In Use',      'ICU Ward - Floor 2',      1, 0, 1),
        ('ICU Bed 103',       'ICU Bed',           'Available',   'ICU Ward - Floor 2',      1, 1, 1),
        ('General Bed A-01',  'General Bed',        'Available',   'Ward A - Floor 1',        1, 1, 1),
        ('General Bed A-02',  'General Bed',        'In Use',      'Ward A - Floor 1',        1, 0, 1),
        ('General Bed A-03',  'General Bed',        'Maintenance', 'Ward A - Floor 1',        1, 0, 1),
        ('General Bed B-01',  'General Bed',        'Available',   'Ward B - Floor 1',        1, 1, 1),
        ('Operation Theater 1','Operation Theater', 'Available',   'OT Block - Floor 3',      1, 1, 1),
        ('Operation Theater 2','Operation Theater', 'In Use',      'OT Block - Floor 3',      1, 0, 1),
        ('Ventilator V-01',   'Ventilator',         'Available',   'ICU Ward',                1, 1, 1),
        ('Ventilator V-02',   'Ventilator',         'In Use',      'ICU Ward',                1, 0, 1),
        ('MRI Machine',       'MRI Machine',        'Available',   'Radiology - Floor 1',     1, 1, 1),
        ('CT Scanner',        'CT Scanner',         'Available',   'Radiology - Floor 1',     1, 1, 1),
        ('Ambulance AMB-01',  'Ambulance',          'Available',   'Garage',                  1, 1, 1),
        ('Ambulance AMB-02',  'Ambulance',          'In Use',      'Garage',                  1, 0, 1)
      `);
      console.log('✅ 15 sample resources seeded\n');
    } else {
      console.log(`ℹ️  Resources already exist (${cnt} found), skipping\n`);
    }

    console.log('🎉 Setup complete!');
    console.log('   Now run: npm run dev');
    console.log('   Then open: http://localhost:3000\n');

  } catch (err) {
    console.error('\n❌ Setup failed:', err.message);
    console.error('\nCheck your .env file:');
    console.error('  DB_HOST =', process.env.DB_HOST);
    console.error('  DB_USER =', process.env.DB_USER);
    console.error('  DB_PASSWORD = [hidden]');
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

setup();
