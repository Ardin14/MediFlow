CREATE OR REPLACE FUNCTION public.transfer_patients(p_patient_ids bigint[], p_target_clinic_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Update patient records
  UPDATE patients
  SET clinic_id = p_target_clinic_id,
      updated_at = NOW()
  WHERE id = ANY(p_patient_ids);
  
  -- Update appointments to cancelled status
  UPDATE appointments
  SET status = 'cancelled',
      updated_at = NOW(),
      cancellation_reason = 'Patient transferred to another clinic'
  WHERE patient_id = ANY(p_patient_ids)
  AND status IN ('scheduled', 'confirmed')
  AND scheduled_at > NOW();
  
  -- Create transfer history records
  INSERT INTO patient_transfer_history (
    patient_id,
    from_clinic_id,
    to_clinic_id,
    transferred_at,
    transferred_by
  )
  SELECT
    p.id,
    p.clinic_id,
    p_target_clinic_id,
    NOW(),
    auth.uid()
  FROM patients p
  WHERE p.id = ANY(p_patient_ids);
END;
$function$;