-- Down migration for 3: drop newly added tables and remove clinic_id constraints

ALTER TABLE IF EXISTS appointments DROP CONSTRAINT IF EXISTS appointments_clinic_fkey;
ALTER TABLE IF EXISTS patients DROP CONSTRAINT IF EXISTS patients_clinic_fkey;
ALTER TABLE IF EXISTS clinic_users DROP CONSTRAINT IF EXISTS clinic_users_clinic_fkey;

ALTER TABLE IF EXISTS clinic_users DROP COLUMN IF EXISTS clinic_id;
ALTER TABLE IF EXISTS patients DROP COLUMN IF EXISTS clinic_id;
ALTER TABLE IF EXISTS appointments DROP COLUMN IF EXISTS clinic_id;

DROP INDEX IF EXISTS idx_clinic_users_clinic_id;
DROP INDEX IF EXISTS idx_patients_clinic_id;
DROP INDEX IF EXISTS idx_appointments_clinic_id;
DROP INDEX IF EXISTS idx_appointments_date;
DROP INDEX IF EXISTS idx_patients_userid;
DROP INDEX IF EXISTS idx_visits_visit_date;
DROP INDEX IF EXISTS idx_invoices_status_created;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS lab_results;
DROP TABLE IF EXISTS medications;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS prescription_items;
DROP TABLE IF EXISTS prescriptions;
DROP TABLE IF EXISTS visits;
DROP TABLE IF EXISTS clinics;
