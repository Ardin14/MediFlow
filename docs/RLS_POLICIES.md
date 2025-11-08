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

---

Clinic Users
```sql
-- READ: any user sees clinic_users in their own clinic
create policy cu_select_same_clinic
on clinic_users for select
using (
  exists (
    select 1 from clinic_users me
    where me.user_id = auth.uid()
      and me.clinic_id = clinic_users.clinic_id
  )
);

-- INSERT: only admins can create users in their clinic
create policy cu_insert_admin
on clinic_users for insert
with check (
  exists (
    select 1 from clinic_users me
    where me.user_id = auth.uid()
      and me.clinic_id = clinic_users.clinic_id
      and me.role = 'admin'
  )
);

-- UPDATE: only admins can update users in their clinic
create policy cu_update_admin
on clinic_users for update
using (
  exists (
    select 1 from clinic_users me
    where me.user_id = auth.uid()
      and me.clinic_id = clinic_users.clinic_id
      and me.role = 'admin'
  )
)
with check (
  exists (
    select 1 from clinic_users me
    where me.user_id = auth.uid()
      and me.clinic_id = clinic_users.clinic_id
      and me.role = 'admin'
  )
);

-- DELETE: only admins in same clinic
create policy cu_delete_admin
on clinic_users for delete
using (
  exists (
    select 1 from clinic_users me
    where me.user_id = auth.uid()
      and me.clinic_id = clinic_users.clinic_id
      and me.role = 'admin'
  )
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
  exists (
    select 1 from clinic_users me
    where me.user_id = auth.uid()
      and me.clinic_id = appointments.clinic_id
      and me.role in ('admin','receptionist')
  )
);

-- Doctor can read only their own appointments
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
  exists (
    select 1 from clinic_users me
    where me.user_id = auth.uid()
      and me.clinic_id = appointments.clinic_id
      and me.role in ('admin','receptionist')
  )
  and exists (
    select 1 from clinic_users doc
    where doc.id = appointments.doctor_id
      and doc.clinic_id = appointments.clinic_id
      and doc.role = 'doctor'
  )
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
  exists (
    select 1 from clinic_users me
    where me.user_id = auth.uid()
      and me.clinic_id = appointments.clinic_id
      and me.role in ('admin','receptionist')
  )
)
with check (
  exists (
    select 1 from clinic_users me
    where me.user_id = auth.uid()
      and me.clinic_id = appointments.clinic_id
      and me.role in ('admin','receptionist')
  )
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
  exists (
    select 1 from clinic_users me
    where me.user_id = auth.uid()
      and me.clinic_id = appointments.clinic_id
      and me.role = 'admin'
  )
);
```

Visits
```sql
-- Staff can read visits where their clinic matches the visit clinician’s clinic
create policy visits_select_staff
on visits for select
using (
  exists (
    select 1
    from clinic_users me
    join clinic_users vcu on vcu.id = visits.clinic_user_id
    where me.user_id = auth.uid()
      and me.clinic_id = vcu.clinic_id
      and me.role in ('admin','receptionist','doctor')
  )
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
  and exists (
    select 1
    from clinic_users vcu, patients p
    where vcu.id = visits.clinic_user_id
      and p.id = visits.patient_id
      and vcu.clinic_id = p.clinic_id
  )
);

-- Update by doctor or admin in same clinic
create policy visits_update_doctor_or_admin
on visits for update
using (
  exists (
    select 1
    from clinic_users me
    join clinic_users vcu on vcu.id = visits.clinic_user_id
    where me.user_id = auth.uid()
      and me.clinic_id = vcu.clinic_id
      and me.role in ('doctor','admin')
  )
)
with check (
  exists (
    select 1
    from clinic_users me
    join clinic_users vcu on vcu.id = visits.clinic_user_id
    where me.user_id = auth.uid()
      and me.clinic_id = vcu.clinic_id
      and me.role in ('doctor','admin')
  )
);
```

Prescriptions
```sql
-- Staff can read prescriptions in their clinic (via prescribed_by -> clinic_users)
create policy rx_select_staff
on prescriptions for select
using (
  exists (
    select 1
    from clinic_users me
    join clinic_users doc on doc.id = prescriptions.prescribed_by
    where me.user_id = auth.uid()
      and me.clinic_id = doc.clinic_id
      and me.role in ('admin','receptionist','doctor')
  )
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
  and exists (
    select 1
    from patients p
    join clinic_users doc on doc.id = prescriptions.prescribed_by
    where p.id = prescriptions.patient_id
      and p.clinic_id = doc.clinic_id
  )
);

-- Update by doctor or admin in same clinic
create policy rx_update_doctor_or_admin
on prescriptions for update
using (
  exists (
    select 1
    from clinic_users me
    join clinic_users doc on doc.id = prescriptions.prescribed_by
    where me.user_id = auth.uid()
      and me.clinic_id = doc.clinic_id
      and me.role in ('doctor','admin')
  )
)
with check (
  exists (
    select 1
    from clinic_users me
    join clinic_users doc on doc.id = prescriptions.prescribed_by
    where me.user_id = auth.uid()
      and me.clinic_id = doc.clinic_id
      and me.role in ('doctor','admin')
  )
);
```

Invoices
```sql
-- Staff in same clinic as the invoice’s patient
create policy inv_select_staff
on invoices for select
using (
  exists (
    select 1
    from clinic_users me
    join patients p on p.id = invoices.patient_id
    where me.user_id = auth.uid()
      and me.clinic_id = p.clinic_id
      and me.role in ('admin','receptionist')
  )
);

-- Patient can see their own invoices
create policy inv_select_patient_self
on invoices for select
using (
  exists (
    select 1 from patients p
    where p.id = invoices.patient_id
      and p.user_id = auth.uid()
  )
);

-- Insert/update by staff in their clinic
create policy inv_insert_staff
on invoices for insert
with check (
  exists (
    select 1
    from clinic_users me
    join patients p on p.id = invoices.patient_id
    where me.user_id = auth.uid()
      and me.clinic_id = p.clinic_id
      and me.role in ('admin','receptionist')
  )
);

create policy inv_update_staff
on invoices for update
using (
  exists (
    select 1
    from clinic_users me
    join patients p on p.id = invoices.patient_id
    where me.user_id = auth.uid()
      and me.clinic_id = p.clinic_id
      and me.role in ('admin','receptionist')
  )
)
with check (
  exists (
    select 1
    from clinic_users me
    join patients p on p.id = invoices.patient_id
    where me.user_id = auth.uid()
      and me.clinic_id = p.clinic_id
      and me.role in ('admin','receptionist')
  )
);

-- Optional delete by admin
create policy inv_delete_admin
on invoices for delete
using (
  exists (
    select 1
    from clinic_users me
    join patients p on p.id = invoices.patient_id
    where me.user_id = auth.uid()
      and me.clinic_id = p.clinic_id
      and me.role = 'admin'
  )
);
```

Invoice Items
```sql
-- Staff in clinic of the invoice’s patient
create policy inv_items_select_staff
on invoice_items for select
using (
  exists (
    select 1
    from invoices i
    join patients p   on p.id = i.patient_id
    join clinic_users me on me.user_id = auth.uid()
    where i.id = invoice_items.invoice_id
      and me.clinic_id = p.clinic_id
      and me.role in ('admin','receptionist')
  )
);

-- Patient can see their own invoice items
create policy inv_items_select_patient_self
on invoice_items for select
using (
  exists (
    select 1
    from invoices i
    join patients p on p.id = i.patient_id
    where i.id = invoice_items.invoice_id
      and p.user_id = auth.uid()
  )
);

-- Insert/update by staff in their clinic
create policy inv_items_insert_staff
on invoice_items for insert
with check (
  exists (
    select 1
    from invoices i
    join patients p   on p.id = i.patient_id
    join clinic_users me on me.user_id = auth.uid()
    where i.id = invoice_items.invoice_id
      and me.clinic_id = p.clinic_id
      and me.role in ('admin','receptionist')
  )
);

create policy inv_items_update_staff
on invoice_items for update
using (
  exists (
    select 1
    from invoices i
    join patients p   on p.id = i.patient_id
    join clinic_users me on me.user_id = auth.uid()
    where i.id = invoice_items.invoice_id
      and me.clinic_id = p.clinic_id
      and me.role in ('admin','receptionist')
  )
)
with check (
  exists (
    select 1
    from invoices i
    join patients p   on p.id = i.patient_id
    join clinic_users me on me.user_id = auth.uid()
    where i.id = invoice_items.invoice_id
      and me.clinic_id = p.clinic_id
      and me.role in ('admin','receptionist')
  )
);

-- Optional delete by admin
create policy inv_items_delete_admin
on invoice_items for delete
using (
  exists (
    select 1
    from invoices i
    join patients p   on p.id = i.patient_id
    join clinic_users me on me.user_id = auth.uid()
    where i.id = invoice_items.invoice_id
      and me.clinic_id = p.clinic_id
      and me.role = 'admin'
  )
);
```

Payments
```sql
-- Staff in same clinic as the invoice’s patient
create policy pay_select_staff
on payments for select
using (
  exists (
    select 1
    from invoices i
    join patients p   on p.id = i.patient_id
    join clinic_users me on me.user_id = auth.uid()
    where i.id = payments.invoice_id
      and me.clinic_id = p.clinic_id
      and me.role in ('admin','receptionist')
  )
);

-- Patient can see their own payments
create policy pay_select_patient_self
on payments for select
using (
  exists (
    select 1
    from invoices i
    join patients p on p.id = i.patient_id
    where i.id = payments.invoice_id
      and p.user_id = auth.uid()
  )
);

-- Insert/update by staff in their clinic
create policy pay_insert_staff
on payments for insert
with check (
  exists (
    select 1
    from invoices i
    join patients p   on p.id = i.patient_id
    join clinic_users me on me.user_id = auth.uid()
    where i.id = payments.invoice_id
      and me.clinic_id = p.clinic_id
      and me.role in ('admin','receptionist')
  )
);

create policy pay_update_staff
on payments for update
using (
  exists (
    select 1
    from invoices i
    join patients p   on p.id = i.patient_id
    join clinic_users me on me.user_id = auth.uid()
    where i.id = payments.invoice_id
      and me.clinic_id = p.clinic_id
      and me.role in ('admin','receptionist')
  )
)
with check (
  exists (
    select 1
    from invoices i
    join patients p   on p.id = i.patient_id
    join clinic_users me on me.user_id = auth.uid()
    where i.id = payments.invoice_id
      and me.clinic_id = p.clinic_id
      and me.role in ('admin','receptionist')
  )
);

-- Optional delete by admin in clinic
create policy pay_delete_admin
on payments for delete
using (
  exists (
    select 1
    from invoices i
    join patients p   on p.id = i.patient_id
    join clinic_users me on me.user_id = auth.uid()
    where i.id = payments.invoice_id
      and me.clinic_id = p.clinic_id
      and me.role = 'admin'
  )
);
```

Implementation tips
- Apply policies after schema is in place and data is consistent.
- Ensure inserts from the app always set the correct clinic_id/user relationships.
- Prefer using Postgres functions for multi-step business logic if needed.
- Test with multiple roles to validate denials and permissions.
