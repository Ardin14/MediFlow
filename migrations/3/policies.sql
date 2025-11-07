-- Add RLS policy for transfer_patients function
CREATE POLICY clinic_staff_transfer_patients ON patients
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clinic_users cu
    WHERE cu.user_id = auth.uid()
    AND cu.clinic_id = clinic_id
    AND cu.role IN ('admin', 'receptionist')
  )
);