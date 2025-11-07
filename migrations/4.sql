-- Enable RLS on all tables
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role and clinic_id
CREATE OR REPLACE FUNCTION public.get_current_user_clinic()
RETURNS TABLE (user_role text, clinic_id bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role::text, clinic_id 
  FROM clinic_users 
  WHERE user_id = auth.uid()::text;
$$;

-- Admin policies (full access to their clinic's data)
CREATE POLICY "Admins can read clinic data" ON clinics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clinic_users 
      WHERE user_id = auth.uid()::text 
      AND role = 'admin'
      AND clinic_id = clinics.id
    )
  );

CREATE POLICY "Admins can manage clinic data" ON clinics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clinic_users 
      WHERE user_id = auth.uid()::text 
      AND role = 'admin'
      AND clinic_id = clinics.id
    )
  );

-- Staff can read their clinic's data
CREATE POLICY "Staff can read clinic users" ON clinic_users
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users 
      WHERE user_id = auth.uid()::text
    )
  );

-- Only admins can manage staff
CREATE POLICY "Admins can manage staff" ON clinic_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clinic_users 
      WHERE user_id = auth.uid()::text 
      AND role = 'admin'
      AND clinic_id = clinic_users.clinic_id
    )
  );

-- Patient access policies
CREATE POLICY "Staff can read patients" ON patients
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users 
      WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Admin and receptionists can manage patients" ON patients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clinic_users 
      WHERE user_id = auth.uid()::text 
      AND clinic_id = patients.clinic_id
      AND role IN ('admin', 'receptionist')
    )
  );

-- Appointment policies
CREATE POLICY "Staff can read appointments" ON appointments
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users 
      WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Admin and receptionists can manage appointments" ON appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clinic_users 
      WHERE user_id = auth.uid()::text 
      AND clinic_id = appointments.clinic_id
      AND role IN ('admin', 'receptionist')
    )
  );

-- Visit and consultation policies
CREATE POLICY "Staff can read visits" ON visits
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users 
      WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Doctors can manage visits" ON visits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clinic_users 
      WHERE user_id = auth.uid()::text 
      AND clinic_id = visits.clinic_id
      AND role IN ('admin', 'doctor')
    )
  );

-- Prescription policies
CREATE POLICY "Staff can read prescriptions" ON prescriptions
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users 
      WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Doctors can manage prescriptions" ON prescriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clinic_users 
      WHERE user_id = auth.uid()::text 
      AND clinic_id = prescriptions.clinic_id
      AND role IN ('admin', 'doctor')
    )
  );

-- Invoice and payment policies
CREATE POLICY "Staff can read financial records" ON invoices
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users 
      WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Admin and receptionists can manage financial records" ON invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clinic_users 
      WHERE user_id = auth.uid()::text 
      AND clinic_id = invoices.clinic_id
      AND role IN ('admin', 'receptionist')
    )
  );

-- Audit log policies (read-only, only admins can view)
CREATE POLICY "Only admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clinic_users 
      WHERE user_id = auth.uid()::text 
      AND clinic_id = audit_logs.clinic_id
      AND role = 'admin'
    )
  );