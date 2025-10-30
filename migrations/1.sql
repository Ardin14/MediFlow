
-- Users table for storing clinic staff and patient role information
CREATE TABLE clinic_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE, -- References MochaUser.id
  role TEXT NOT NULL, -- 'admin', 'receptionist', 'doctor', 'patient'
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients table for storing patient information
CREATE TABLE patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT UNIQUE, -- References MochaUser.id for patients who sign up
  full_name TEXT NOT NULL,
  gender TEXT,
  date_of_birth DATE,
  phone TEXT,
  email TEXT,
  address TEXT,
  medical_history TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  doctor_id TEXT NOT NULL, -- References MochaUser.id
  appointment_date DATETIME NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'booked', -- 'booked', 'checked_in', 'completed', 'cancelled'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visits (consultation records) table
CREATE TABLE visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  appointment_id INTEGER NOT NULL,
  diagnosis TEXT,
  notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions table
CREATE TABLE prescriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_id INTEGER NOT NULL,
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  duration TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  date DATETIME NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'paid', 'pending'
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_clinic_users_user_id ON clinic_users(user_id);
CREATE INDEX idx_clinic_users_role ON clinic_users(role);
CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_visits_appointment_id ON visits(appointment_id);
CREATE INDEX idx_prescriptions_visit_id ON prescriptions(visit_id);
CREATE INDEX idx_invoices_patient_id ON invoices(patient_id);
