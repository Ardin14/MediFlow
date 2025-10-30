
-- Drop indexes
DROP INDEX idx_invoices_clinic_id;
DROP INDEX idx_prescriptions_clinic_id;
DROP INDEX idx_visits_clinic_id;
DROP INDEX idx_appointments_clinic_id;
DROP INDEX idx_patients_clinic_id;
DROP INDEX idx_clinic_users_clinic_id;

-- Remove clinic_id columns
ALTER TABLE invoices DROP COLUMN clinic_id;
ALTER TABLE prescriptions DROP COLUMN clinic_id;
ALTER TABLE visits DROP COLUMN clinic_id;
ALTER TABLE appointments DROP COLUMN clinic_id;
ALTER TABLE patients DROP COLUMN clinic_id;
ALTER TABLE clinic_users DROP COLUMN clinic_id;

-- Drop clinics table
DROP TABLE clinics;
