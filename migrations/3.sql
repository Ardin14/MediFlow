-- Migration 3: add clinics table, clinic_id to existing tables, and additional domain tables

-- Add clinics table
CREATE TABLE IF NOT EXISTS clinics (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add clinic_id columns to existing tables (nullable initially)
ALTER TABLE IF EXISTS clinic_users ADD COLUMN IF NOT EXISTS clinic_id BIGINT;
ALTER TABLE IF EXISTS patients ADD COLUMN IF NOT EXISTS clinic_id BIGINT;
ALTER TABLE IF EXISTS appointments ADD COLUMN IF NOT EXISTS clinic_id BIGINT;

-- Add foreign key constraints (set null on clinic deletion)
ALTER TABLE clinic_users
  ADD CONSTRAINT IF NOT EXISTS clinic_users_clinic_fkey
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL;

ALTER TABLE patients
  ADD CONSTRAINT IF NOT EXISTS patients_clinic_fkey
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL;

ALTER TABLE appointments
  ADD CONSTRAINT IF NOT EXISTS appointments_clinic_fkey
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clinic_users_clinic_id ON clinic_users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id     ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_patients_userid    ON patients(user_id);

-- Visits table
CREATE TABLE IF NOT EXISTS visits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  appointment_id BIGINT REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
  clinic_user_id BIGINT REFERENCES clinic_users(id) ON DELETE SET NULL,
  visit_date TIMESTAMPTZ DEFAULT now(),
  chief_complaint TEXT,
  diagnosis TEXT,
  vitals JSONB,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_visits_visit_date ON visits(visit_date);

-- Prescriptions and prescription items
CREATE TABLE IF NOT EXISTS prescriptions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  visit_id BIGINT REFERENCES visits(id) ON DELETE CASCADE,
  patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
  prescribed_by BIGINT REFERENCES clinic_users(id) ON DELETE SET NULL,
  issued_at TIMESTAMPTZ DEFAULT now(),
  instructions TEXT,
  status TEXT DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prescription_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  prescription_id BIGINT REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication TEXT NOT NULL,
  dose TEXT,
  frequency TEXT,
  duration TEXT,
  quantity INTEGER,
  notes TEXT
);

-- Invoices, invoice items, payments
CREATE TABLE IF NOT EXISTS invoices (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
  clinic_user_id BIGINT REFERENCES clinic_users(id) ON DELETE SET NULL,
  clinic_id BIGINT REFERENCES clinics(id) ON DELETE SET NULL,
  total NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'open',
  due_date DATE,
  currency TEXT DEFAULT 'USD',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invoices_status_created ON invoices(status, created_at);

CREATE TABLE IF NOT EXISTS invoice_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_id BIGINT REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_amount NUMERIC(12,2) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_id BIGINT REFERENCES invoices(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  method TEXT,
  transaction_id TEXT,
  status TEXT DEFAULT 'completed',
  paid_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB
);

-- Medications catalog
CREATE TABLE IF NOT EXISTS medications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  strength TEXT,
  unit TEXT,
  ndc_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lab results
CREATE TABLE IF NOT EXISTS lab_results (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
  visit_id BIGINT REFERENCES visits(id) ON DELETE SET NULL,
  test_name TEXT NOT NULL,
  result JSONB,
  units TEXT,
  normal_range TEXT,
  collected_at TIMESTAMPTZ,
  uploaded_by BIGINT REFERENCES clinic_users(id) ON DELETE SET NULL,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Files/uploads
CREATE TABLE IF NOT EXISTS files (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_user_id TEXT,
  patient_id BIGINT REFERENCES patients(id) ON DELETE SET NULL,
  visit_id BIGINT REFERENCES visits(id) ON DELETE SET NULL,
  file_name TEXT,
  content_type TEXT,
  url TEXT NOT NULL,
  size BIGINT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT,
  patient_id BIGINT REFERENCES patients(id) ON DELETE SET NULL,
  type TEXT,
  payload JSONB,
  read BOOLEAN DEFAULT FALSE,
  send_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
