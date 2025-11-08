# Row Level Security (RLS) Policies

This document contains production-ready Supabase Row Level Security (RLS) policies for MediFlow’s multi-tenant clinic model.

Principles
- Default deny: RLS enabled on every table; only explicit policies grant access.
- Tenant isolation by clinic: Access is scoped to the user’s clinic via joins.
- Avoid int=uuid mismatches: Map auth.uid() (uuid) to clinic_users.id (integer) via joins.
- Least privilege: Patients can only read their own records; staff roles are restricted to their clinic.

Prerequisites
```sql
-- Enable (and optionally force) RLS on all relevant tables
alter table clinic_users    enable row level security;
alter table patients        enable row level security;
alter table appointments    enable row level security;
alter table visits          enable row level security;
alter table prescriptions   enable row level security;
alter table invoices        enable row level security;
alter table invoice_items   enable row level security;
alter table payments        enable row level security;

-- Optional but recommended to prevent owner bypass
-- alter table clinic_users    force row level security;
-- alter table patients        force row level security;
-- alter table appointments    force row level security;
-- alter table visits          force row level security;
-- alter table prescriptions   force row level security;
-- alter table invoices        force row level security;
-- alter table invoice_items   force row level security;
-- alter table payments        force row level security;
```

Recommended indexes (for policy join performance)
```sql
create index if not exists idx_cu_user_id       on clinic_users(user_id);
create index if not exists idx_cu_clinic_role   on clinic_users(clinic_id, role);
create index if not exists idx_patients_clinic  on patients(clinic_id);
create index if not exists idx_appts_doctor     on appointments(doctor_id);
create index if not exists idx_appts_clinic     on appointments(clinic_id);
create index if not exists idx_invoices_patient on invoices(patient_id);
create index if not exists idx_items_invoice    on invoice_items(invoice_id);
create index if not exists idx_pay_invoice      on payments(invoice_id);
create index if not exists idx_visits_cu        on visits(clinic_user_id);
create index if not exists idx_rx_prescribed_by on prescriptions(prescribed_by);
create index if not exists idx_rx_patient       on prescriptions(patient_id);
```

Note on role mapping
- auth.uid() is the signed-in user’s UUID.
- clinic_users.id is an integer and clinic_users.user_id is a UUID.
- When checking doctor ownership or clinic scope, join clinic_users using user_id = auth.uid() and compare integer ids where needed.

Helper functions (SECURITY DEFINER)
To avoid RLS recursion and safely check roles/clinic membership across tables, create these helper functions:
```sql
-- Check if current user has one of the roles in a given clinic
create or replace function has_role_in_clinic(target_clinic_id bigint, roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from clinic_users
    where user_id = auth.uid()
      and clinic_id = target_clinic_id
      and role = any(roles)
  );
$$;

grant execute on function has_role_in_clinic(bigint, text[]) to authenticated;

-- Check if a given clinic_users.id is a doctor in a given clinic
create or replace function is_doctor_in_clinic(doctor_row_id int, target_clinic_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from clinic_users
    where id = doctor_row_id
      and clinic_id = target_clinic_id
      and role = 'doctor'
  );
$$;

grant execute on function is_doctor_in_clinic(int, bigint) to authenticated;

-- Fetch clinic_id for a clinic_users row id
create or replace function clinic_user_clinic_id(cu_id int)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select clinic_id from clinic_users where id = cu_id
$$;

grant execute on function clinic_user_clinic_id(int) to authenticated;

-- Fetch clinic_id for a patient id
create or replace function patient_clinic_id(p_id int)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select clinic_id from patients where id = p_id
$$;

grant execute on function patient_clinic_id(int) to authenticated;

-- Fetch user_id (uuid) for a patient id
create or replace function patient_user_id(p_id int)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select user_id from patients where id = p_id
$$;

grant execute on function patient_user_id(int) to authenticated;
```

---

Clinic Users
```sql
-- READ: allow users to read their own row only (prevents recursion)
create policy cu_select_self
on clinic_users for select
using (clinic_users.user_id = auth.uid());

-- Optional: allow staff to read all clinic users in their clinic using helper function
create policy cu_select_staff_same_clinic
on clinic_users for select
using (has_role_in_clinic(clinic_users.clinic_id, array['admin','receptionist','doctor']));

-- INSERT: only admins can create users in their clinic
create policy cu_insert_admin
on clinic_users for insert
with check (
  has_role_in_clinic(clinic_users.clinic_id, array['admin'])
);

-- UPDATE: only admins can update users in their clinic
create policy cu_update_admin
on clinic_users for update
using (
  has_role_in_clinic(clinic_users.clinic_id, array['admin'])
)
with check (
  has_role_in_clinic(clinic_users.clinic_id, array['admin'])
);

-- DELETE: only admins in same clinic
create policy cu_delete_admin
on clinic_users for delete
using (
  has_role_in_clinic(clinic_users.clinic_id, array['admin'])
);
```

Patients
```sql
-- READ: staff in clinic OR the patient themselves
create policy patients_select
on patients for select
using (
  exists (
    select 1 from clinic_users me
    where me.user_id = auth.uid()
      and me.clinic_id = patients.clinic_id
      and me.role in ('admin','receptionist','doctor')
  )
  or patients.user_id = auth.uid()
);

-- INSERT: admin/receptionist in same clinic
create policy patients_insert_staff
on patients for insert
with check (
  exists (
    select 1 from clinic_users me
    where me.user_id = auth.uid()
      and me.clinic_id = patients.clinic_id
      and me.role in ('admin','receptionist')
  )
);

-- UPDATE: admin/receptionist in same clinic
create policy patients_update_staff
on patients for update
using (
  exists (
    select 1 from clinic_users me
    where me.user_id = auth.uid()
      and me.clinic_id = patients.clinic_id
      and me.role in ('admin','receptionist')
  )
)
with check (
  exists (
    select 1 from clinic_users me
    where me.user_id = auth.uid()
      and me.clinic_id = patients.clinic_id
      and me.role in ('admin','receptionist')
  )
);

-- DELETE: admin only (optional)
create policy patients_delete_admin
on patients for delete
using (
  exists (
    select 1 from clinic_users me
    where me.user_id = auth.uid()
      and me.clinic_id = patients.clinic_id
      and me.role = 'admin'
  )
);
```

Appointments
```sql
-- Staff (admin/receptionist) can read all appointments in their clinic
create policy appts_select_staff
on appointments for select
using (
  has_role_in_clinic(appointments.clinic_id, array['admin','receptionist'])
);

-- Doctor can read only their own appointments (map auth.uid() -> clinic_users.id)
create policy appts_select_doctor_self
on appointments for select
using (
  exists (
    select 1 from clinic_users me
    where me.user_id = auth.uid()
      and me.id = appointments.doctor_id
      and me.clinic_id = appointments.clinic_id
      and me.role = 'doctor'
  )
);

-- Create appointment by admin/receptionist in clinic, with valid doctor and patient in same clinic
create policy appts_insert_staff
on appointments for insert
with check (
  has_role_in_clinic(appointments.clinic_id, array['admin','receptionist'])
  and is_doctor_in_clinic(appointments.doctor_id, appointments.clinic_id)
  and exists (
    select 1 from patients p
    where p.id = appointments.patient_id
      and p.clinic_id = appointments.clinic_id
  )
);

-- Update by staff in same clinic
create policy appts_update_staff
on appointments for update
using (
  has_role_in_clinic(appointments.clinic_id, array['admin','receptionist'])
)
with check (
  has_role_in_clinic(appointments.clinic_id, array['admin','receptionist'])
);

-- Update by doctor only for their own appointments
create policy appts_update_doctor_self
on appointments for update
using (
  exists (
    select 1 from clinic_users me
    where me.user_id = auth.uid()
      and me.id = appointments.doctor_id
      and me.clinic_id = appointments.clinic_id
      and me.role = 'doctor'
  )
)
with check (
  exists (
    select 1 from clinic_users me
    where me.user_id = auth.uid()
      and me.id = appointments.doctor_id
      and me.clinic_id = appointments.clinic_id
      and me.role = 'doctor'
  )
);

-- Delete by admin (optional)
create policy appts_delete_admin
on appointments for delete
using (
  has_role_in_clinic(appointments.clinic_id, array['admin'])
);
```

Visits
```sql
-- Staff can read visits where their clinic matches the visit clinician’s clinic
create policy visits_select_staff
on visits for select
using (
  has_role_in_clinic(clinic_user_clinic_id(visits.clinic_user_id), array['admin','receptionist','doctor'])
);

-- Insert by doctor who is the clinician; patient must be in same clinic
create policy visits_insert_doctor
on visits for insert
with check (
  exists (
    select 1 from clinic_users me
    where me.user_id = auth.uid()
      and me.id = visits.clinic_user_id
      and me.role = 'doctor'
  )
  and patient_clinic_id(visits.patient_id) = clinic_user_clinic_id(visits.clinic_user_id)
);

-- Update by doctor or admin in same clinic
create policy visits_update_doctor_or_admin
on visits for update
using (
  has_role_in_clinic(clinic_user_clinic_id(visits.clinic_user_id), array['doctor','admin'])
)
with check (
  has_role_in_clinic(clinic_user_clinic_id(visits.clinic_user_id), array['doctor','admin'])
);
```

Prescriptions
```sql
-- Staff can read prescriptions in their clinic (via prescribed_by -> clinic_users)
create policy rx_select_staff
on prescriptions for select
using (
  has_role_in_clinic(clinic_user_clinic_id(prescriptions.prescribed_by), array['admin','receptionist','doctor'])
);

-- Insert by doctor; patient must be in same clinic
create policy rx_insert_doctor
on prescriptions for insert
with check (
  exists (
    select 1 from clinic_users me
    where me.user_id = auth.uid()
      and me.id = prescriptions.prescribed_by
      and me.role = 'doctor'
  )
  and patient_clinic_id(prescriptions.patient_id) = clinic_user_clinic_id(prescriptions.prescribed_by)
);

-- Update by doctor or admin in same clinic
create policy rx_update_doctor_or_admin
on prescriptions for update
using (
  has_role_in_clinic(clinic_user_clinic_id(prescriptions.prescribed_by), array['doctor','admin'])
)
with check (
  has_role_in_clinic(clinic_user_clinic_id(prescriptions.prescribed_by), array['doctor','admin'])
);
```

Invoices
```sql
-- Staff in same clinic as the invoice’s patient
create policy inv_select_staff
on invoices for select
using (
  has_role_in_clinic(patient_clinic_id(invoices.patient_id), array['admin','receptionist'])
);

-- Patient can see their own invoices
create policy inv_select_patient_self
on invoices for select
using (
  patient_user_id(invoices.patient_id) = auth.uid()
);

-- Insert/update by staff in their clinic
create policy inv_insert_staff
on invoices for insert
with check (
  has_role_in_clinic(patient_clinic_id(invoices.patient_id), array['admin','receptionist'])
);

create policy inv_update_staff
on invoices for update
using (
  has_role_in_clinic(patient_clinic_id(invoices.patient_id), array['admin','receptionist'])
)
with check (
  has_role_in_clinic(patient_clinic_id(invoices.patient_id), array['admin','receptionist'])
);

-- Optional delete by admin
create policy inv_delete_admin
on invoices for delete
using (
  has_role_in_clinic(patient_clinic_id(invoices.patient_id), array['admin'])
);
```

Invoice Items
```sql
-- Staff in clinic of the invoice’s patient
create policy inv_items_select_staff
on invoice_items for select
using (
  has_role_in_clinic(
    patient_clinic_id((select patient_id from invoices where id = invoice_items.invoice_id)),
    array['admin','receptionist']
  )
);

-- Patient can see their own invoice items
create policy inv_items_select_patient_self
on invoice_items for select
using (
  patient_user_id((select patient_id from invoices where id = invoice_items.invoice_id)) = auth.uid()
);

-- Insert/update by staff in their clinic
create policy inv_items_insert_staff
on invoice_items for insert
with check (
  has_role_in_clinic(
    patient_clinic_id((select patient_id from invoices where id = invoice_items.invoice_id)),
    array['admin','receptionist']
  )
);

create policy inv_items_update_staff
on invoice_items for update
using (
  has_role_in_clinic(
    patient_clinic_id((select patient_id from invoices where id = invoice_items.invoice_id)),
    array['admin','receptionist']
  )
)
with check (
  has_role_in_clinic(
    patient_clinic_id((select patient_id from invoices where id = invoice_items.invoice_id)),
    array['admin','receptionist']
  )
);

-- Optional delete by admin
create policy inv_items_delete_admin
on invoice_items for delete
using (
  has_role_in_clinic(
    patient_clinic_id((select patient_id from invoices where id = invoice_items.invoice_id)),
    array['admin']
  )
);
```

Payments
```sql
-- Staff in same clinic as the invoice’s patient
create policy pay_select_staff
on payments for select
using (
  has_role_in_clinic(
    patient_clinic_id((select patient_id from invoices where id = payments.invoice_id)),
    array['admin','receptionist']
  )
);

-- Patient can see their own payments
create policy pay_select_patient_self
on payments for select
using (
  patient_user_id((select patient_id from invoices where id = payments.invoice_id)) = auth.uid()
);

-- Insert/update by staff in their clinic
create policy pay_insert_staff
on payments for insert
with check (
  has_role_in_clinic(
    patient_clinic_id((select patient_id from invoices where id = payments.invoice_id)),
    array['admin','receptionist']
  )
);

create policy pay_update_staff
on payments for update
using (
  has_role_in_clinic(
    patient_clinic_id((select patient_id from invoices where id = payments.invoice_id)),
    array['admin','receptionist']
  )
)
with check (
  has_role_in_clinic(
    patient_clinic_id((select patient_id from invoices where id = payments.invoice_id)),
    array['admin','receptionist']
  )
);

-- Optional delete by admin in clinic
create policy pay_delete_admin
on payments for delete
using (
  has_role_in_clinic(
    patient_clinic_id((select patient_id from invoices where id = payments.invoice_id)),
    array['admin']
  )
);
```

Implementation tips
- Apply policies after schema is in place and data is consistent.
- Ensure inserts from the app always set the correct clinic_id/user relationships.
- Prefer using Postgres functions for multi-step business logic if needed.
- Test with multiple roles to validate denials and permissions.

---

Additional Tables

Audit Logs
```sql
alter table audit_logs enable row level security;

-- Users can read only their own audit entries
create policy audit_select_self
on audit_logs for select
using (audit_logs.actor_user_id = auth.uid());

-- No insert/update/delete from clients (server-only)
```

Clinics
```sql
alter table clinics enable row level security;

-- Allow listing clinics to all authenticated users (for registration UI)
create policy clinics_select_auth
on clinics for select
using (true);

-- No client-side insert/update/delete; manage via server or privileged function
```

Files
```sql
alter table files enable row level security;

-- Read if owner, patient self, or staff in patient clinic
create policy files_select
on files for select
using (
  files.owner_user_id = auth.uid()
  or (files.patient_id is not null and patient_user_id(files.patient_id) = auth.uid())
  or (files.patient_id is not null and has_role_in_clinic(patient_clinic_id(files.patient_id), array['admin','receptionist','doctor']))
);

-- Insert by owner or staff in patient clinic
create policy files_insert
on files for insert
with check (
  files.owner_user_id = auth.uid()
  or (files.patient_id is not null and has_role_in_clinic(patient_clinic_id(files.patient_id), array['admin','receptionist','doctor']))
);

-- Update by owner or staff in patient clinic
create policy files_update
on files for update
using (
  files.owner_user_id = auth.uid()
  or (files.patient_id is not null and has_role_in_clinic(patient_clinic_id(files.patient_id), array['admin','receptionist','doctor']))
)
with check (
  files.owner_user_id = auth.uid()
  or (files.patient_id is not null and has_role_in_clinic(patient_clinic_id(files.patient_id), array['admin','receptionist','doctor']))
);

-- Delete by admin in clinic (or owner if unlinked)
create policy files_delete
on files for delete
using (
  (files.patient_id is not null and has_role_in_clinic(patient_clinic_id(files.patient_id), array['admin']))
  or (files.patient_id is null and files.owner_user_id = auth.uid())
);
```

Lab Results
```sql
alter table lab_results enable row level security;

-- Read by staff in uploader's clinic, or patient self
create policy lab_select
on lab_results for select
using (
  has_role_in_clinic(clinic_user_clinic_id(lab_results.uploaded_by), array['admin','receptionist','doctor'])
  or patient_user_id(lab_results.patient_id) = auth.uid()
);

-- Insert by doctor; patient must be in same clinic
create policy lab_insert_doctor
on lab_results for insert
with check (
  has_role_in_clinic(clinic_user_clinic_id(lab_results.uploaded_by), array['doctor'])
  and patient_clinic_id(lab_results.patient_id) = clinic_user_clinic_id(lab_results.uploaded_by)
);

-- Update by doctor/admin in clinic
create policy lab_update
on lab_results for update
using (
  has_role_in_clinic(clinic_user_clinic_id(lab_results.uploaded_by), array['doctor','admin'])
)
with check (
  has_role_in_clinic(clinic_user_clinic_id(lab_results.uploaded_by), array['doctor','admin'])
);

-- Delete by admin in clinic
create policy lab_delete
on lab_results for delete
using (
  has_role_in_clinic(clinic_user_clinic_id(lab_results.uploaded_by), array['admin'])
);
```

Medications
```sql
alter table medications enable row level security;

-- Global read-only catalog for authenticated users
create policy meds_select_auth
on medications for select
using (true);

-- No client-side insert/update/delete (manage via admin functions)
```

Notifications
```sql
alter table notifications enable row level security;

-- Users read their own notifications, or those tied to their patient record
create policy notif_select_self
on notifications for select
using (
  notifications.user_id = auth.uid()
  or (notifications.patient_id is not null and patient_user_id(notifications.patient_id) = auth.uid())
);

-- Recipient can mark as read
create policy notif_update_self
on notifications for update
using (notifications.user_id = auth.uid())
with check (notifications.user_id = auth.uid());

-- Optional: staff may create notifications for a patient in their clinic
create policy notif_insert_staff
on notifications for insert
with check (
  notifications.patient_id is not null
  and has_role_in_clinic(patient_clinic_id(notifications.patient_id), array['admin','receptionist','doctor'])
);

-- Optional: delete by admin in clinic or by recipient
create policy notif_delete
on notifications for delete
using (
  notifications.user_id = auth.uid()
  or (notifications.patient_id is not null and has_role_in_clinic(patient_clinic_id(notifications.patient_id), array['admin']))
);
```

Patient Transfer History
```sql
alter table patient_transfer_history enable row level security;

-- Readable by patient self or staff from either clinic
create policy ptx_select
on patient_transfer_history for select
using (
  patient_user_id(patient_transfer_history.patient_id) = auth.uid()
  or has_role_in_clinic(patient_transfer_history.from_clinic_id, array['admin','receptionist'])
  or has_role_in_clinic(patient_transfer_history.to_clinic_id, array['admin','receptionist'])
);

-- Insert by staff initiating transfer from current clinic
create policy ptx_insert_staff
on patient_transfer_history for insert
with check (
  has_role_in_clinic(patient_transfer_history.from_clinic_id, array['admin','receptionist'])
  and patient_clinic_id(patient_transfer_history.patient_id) = patient_transfer_history.from_clinic_id
);

-- No updates; optional delete by admin
create policy ptx_delete_admin
on patient_transfer_history for delete
using (has_role_in_clinic(patient_transfer_history.from_clinic_id, array['admin']));
```

Prescription Items
```sql
alter table prescription_items enable row level security;

-- Staff in the prescription patient’s clinic or the patient themselves
create policy rx_items_select
on prescription_items for select
using (
  has_role_in_clinic(
    patient_clinic_id((select patient_id from prescriptions where id = prescription_items.prescription_id)),
    array['admin','receptionist','doctor']
  )
  or patient_user_id((select patient_id from prescriptions where id = prescription_items.prescription_id)) = auth.uid()
);

-- Insert/update by doctors/admin in that clinic
create policy rx_items_insert
on prescription_items for insert
with check (
  has_role_in_clinic(
    patient_clinic_id((select patient_id from prescriptions where id = prescription_items.prescription_id)),
    array['doctor','admin']
  )
);

create policy rx_items_update
on prescription_items for update
using (
  has_role_in_clinic(
    patient_clinic_id((select patient_id from prescriptions where id = prescription_items.prescription_id)),
    array['doctor','admin']
  )
)
with check (
  has_role_in_clinic(
    patient_clinic_id((select patient_id from prescriptions where id = prescription_items.prescription_id)),
    array['doctor','admin']
  )
);

-- Delete by admin only
create policy rx_items_delete_admin
on prescription_items for delete
using (
  has_role_in_clinic(
    patient_clinic_id((select patient_id from prescriptions where id = prescription_items.prescription_id)),
    array['admin']
  )
);
```
