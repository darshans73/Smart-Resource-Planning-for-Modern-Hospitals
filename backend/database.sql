-- ============================================================
-- Hospital Resource Planning & Management System
-- Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS hospital_rms;
USE hospital_rms;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'doctor', 'nurse', 'reception') NOT NULL DEFAULT 'reception',
    department VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    diagnosis TEXT,
    blood_group VARCHAR(5),
    emergency_contact VARCHAR(20),
    admission_date DATETIME NOT NULL,
    discharge_date DATETIME,
    status ENUM('admitted', 'discharged', 'critical') DEFAULT 'admitted',
    assigned_doctor INT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_doctor) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Resources Table
CREATE TABLE IF NOT EXISTS resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resource_name VARCHAR(100) NOT NULL,
    type ENUM('ICU Bed', 'General Bed', 'Operation Theater', 'Ventilator', 'MRI Machine', 'CT Scanner', 'Ambulance', 'Equipment') NOT NULL,
    status ENUM('Available', 'In Use', 'Maintenance') DEFAULT 'Available',
    location VARCHAR(100),
    description TEXT,
    total_count INT DEFAULT 1,
    available_count INT DEFAULT 1,
    last_maintained DATETIME,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Allocations Table
CREATE TABLE IF NOT EXISTS allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    resource_id INT NOT NULL,
    allocated_by INT,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    status ENUM('active', 'released', 'cancelled') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (allocated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Surgeries / OT Scheduling Table
CREATE TABLE IF NOT EXISTS surgeries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    ot_room VARCHAR(50) NOT NULL,
    surgery_date DATETIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    surgery_type VARCHAR(100),
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Equipment Bookings Table
CREATE TABLE IF NOT EXISTS equipment_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resource_id INT NOT NULL,
    patient_id INT,
    booked_by INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    purpose TEXT,
    status ENUM('active', 'released', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
    FOREIGN KEY (booked_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default Admin User (password: Admin@123)
INSERT INTO users (name, email, password, role, department, phone) VALUES
('Super Admin', 'admin@hospital.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh9i', 'admin', 'Administration', '9876543210'),
('Dr. Rajesh Kumar', 'doctor@hospital.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh9i', 'doctor', 'Cardiology', '9876543211'),
('Nurse Priya', 'nurse@hospital.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh9i', 'nurse', 'ICU', '9876543212'),
('Reception Staff', 'reception@hospital.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh9i', 'reception', 'Reception', '9876543213');

-- Sample Resources
INSERT INTO resources (resource_name, type, status, location, total_count, available_count, created_by) VALUES
('ICU Bed 101', 'ICU Bed', 'Available', 'ICU Ward - Floor 2', 1, 1, 1),
('ICU Bed 102', 'ICU Bed', 'In Use', 'ICU Ward - Floor 2', 1, 0, 1),
('ICU Bed 103', 'ICU Bed', 'Available', 'ICU Ward - Floor 2', 1, 1, 1),
('General Bed A-01', 'General Bed', 'Available', 'Ward A - Floor 1', 1, 1, 1),
('General Bed A-02', 'General Bed', 'In Use', 'Ward A - Floor 1', 1, 0, 1),
('General Bed A-03', 'General Bed', 'Maintenance', 'Ward A - Floor 1', 1, 0, 1),
('General Bed B-01', 'General Bed', 'Available', 'Ward B - Floor 1', 1, 1, 1),
('Operation Theater 1', 'Operation Theater', 'Available', 'OT Block - Floor 3', 1, 1, 1),
('Operation Theater 2', 'Operation Theater', 'In Use', 'OT Block - Floor 3', 1, 0, 1),
('Ventilator V-01', 'Ventilator', 'Available', 'ICU Ward', 1, 1, 1),
('Ventilator V-02', 'Ventilator', 'In Use', 'ICU Ward', 1, 0, 1),
('MRI Machine', 'MRI Machine', 'Available', 'Radiology - Floor 1', 1, 1, 1),
('CT Scanner', 'CT Scanner', 'Available', 'Radiology - Floor 1', 1, 1, 1),
('Ambulance AMB-01', 'Ambulance', 'Available', 'Garage', 1, 1, 1),
('Ambulance AMB-02', 'Ambulance', 'In Use', 'Garage', 1, 0, 1);
