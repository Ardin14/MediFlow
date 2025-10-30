
-- Create clinics table
CREATE TABLE clinics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add clinic_id to existing tables
ALTER TABLE clinic_users ADD COLUMN clinic_id INTEGER;
ALTER TABLE patients ADD COLUMN clinic_id INTEGER;
ALTER TABLE appointments ADD COLUMN clinic_id INTEGER;
ALTER TABLE visits ADD COLUMN clinic_id INTEGER;
ALTER TABLE prescriptions ADD COLUMN clinic_id INTEGER;
ALTER TABLE invoices ADD COLUMN clinic_id INTEGER;

-- Insert a default clinic for existing data
INSERT INTO clinics (name, address, phone, email) 
VALUES ('Default Clinic', '123 Main St', '+1-555-0123', 'info@defaultclinic.com');

-- Update existing records to use the default clinic
UPDATE clinic_users SET clinic_id = 1;
UPDATE patients SET clinic_id = 1;
UPDATE appointments SET clinic_id = 1;
UPDATE visits SET clinic_id = 1;
UPDATE prescriptions SET clinic_id = 1;
UPDATE invoices SET clinic_id = 1;

-- Create indexes for better performance
CREATE INDEX idx_clinic_users_clinic_id ON clinic_users(clinic_id);
CREATE INDEX idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX idx_visits_clinic_id ON visits(clinic_id);
CREATE INDEX idx_prescriptions_clinic_id ON prescriptions(clinic_id);
CREATE INDEX idx_invoices_clinic_id ON invoices(clinic_id);
