# MediFlow Database Schema

This document describes all database tables used in the MediFlow clinical management system.

## Overview

MediFlow uses a SQLite-based database (Cloudflare D1) with multi-tenant architecture for clinic isolation:
- `clinics` - Clinic information and settings
- `clinic_users` - System users with role-based access per clinic
- `patients` - Patient records isolated by clinic
- `appointments` - Appointment scheduling per clinic
- `visits` - Clinical visit records per clinic
- `prescriptions` - Medication prescriptions per clinic
- `invoices` - Billing and payments per clinic

## Multi-Tenant Architecture

All data tables (except `clinics`) include a `clinic_id` field that ensures complete data isolation between different healthcare facilities. This prevents cross-clinic data access and maintains HIPAA-style privacy standards.

---

## Tables

### clinics

Stores information about healthcare facilities using the system.

```sql
CREATE TABLE clinics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` - Auto-incrementing primary key
- `name` - Clinic name (required)
- `address` - Physical address of the clinic
- `phone` - Contact phone number
- `email` - Contact email address
- `created_at` - Timestamp when the record was created
- `updated_at` - Timestamp when the record was last updated

**Relationships:**
- Referenced by all other tables via `clinic_id`
- Provides multi-tenant data isolation

---

### clinic_users

Stores all users who have access to the clinic management system, including their roles and basic information.

```sql
CREATE TABLE clinic_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  clinic_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` - Auto-incrementing primary key
- `user_id` - References MochaUser.id from the authentication system (unique)
- `role` - User's role in the system. Valid values: `'admin'`, `'receptionist'`, `'doctor'`, `'patient'`
- `full_name` - User's full name
- `phone` - Contact phone number
- `clinic_id` - References `clinics.id` (provides clinic isolation)
- `created_at` - Timestamp when the record was created
- `updated_at` - Timestamp when the record was last updated

**Relationships:**
- Links to the external Mocha authentication system via `user_id`
- Links to `clinics` table via `clinic_id` for data isolation

---

### patients

Stores patient information including demographics and medical history.

```sql
CREATE TABLE patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  gender TEXT,
  date_of_birth DATE,
  phone TEXT,
  email TEXT,
  address TEXT,
  medical_history TEXT,
  clinic_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` - Auto-incrementing primary key
- `user_id` - Optional reference to MochaUser.id if patient has a system account
- `full_name` - Patient's full name (required)
- `gender` - Patient's gender
- `date_of_birth` - Patient's date of birth (DATE format)
- `phone` - Contact phone number
- `email` - Email address
- `address` - Physical address
- `medical_history` - Text field for medical history notes
- `clinic_id` - References `clinics.id` (provides clinic isolation)
- `created_at` - Timestamp when the record was created
- `updated_at` - Timestamp when the record was last updated

**Relationships:**
- Optionally links to `clinic_users` via `user_id`
- Links to `clinics` table via `clinic_id` for data isolation
- Referenced by `appointments` and `invoices` tables

---

### appointments

Stores appointment scheduling information between patients and doctors.

```sql
CREATE TABLE appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  doctor_id TEXT NOT NULL,
  appointment_date DATETIME NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'booked',
  clinic_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` - Auto-incrementing primary key
- `patient_id` - References `patients.id`
- `doctor_id` - References `clinic_users.user_id` (must be a user with role='doctor')
- `appointment_date` - Date and time of the appointment (DATETIME format)
- `reason` - Reason for the appointment/visit
- `status` - Appointment status. Valid values: `'booked'`, `'checked_in'`, `'completed'`, `'cancelled'`
- `clinic_id` - References `clinics.id` (provides clinic isolation)
- `created_at` - Timestamp when the record was created
- `updated_at` - Timestamp when the record was last updated

**Relationships:**
- Links to `patients` table via `patient_id`
- Links to `clinic_users` table via `doctor_id`
- Links to `clinics` table via `clinic_id` for data isolation
- Referenced by `visits` table

**Status Flow:**
1. `booked` - Initial state when appointment is scheduled
2. `checked_in` - Patient has arrived and checked in
3. `completed` - Visit is completed with notes recorded
4. `cancelled` - Appointment was cancelled

---

### visits

Stores clinical visit records including diagnosis and notes from completed appointments.

```sql
CREATE TABLE visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  appointment_id INTEGER NOT NULL,
  diagnosis TEXT,
  notes TEXT,
  follow_up_date DATE,
  clinic_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` - Auto-incrementing primary key
- `appointment_id` - References `appointments.id`
- `diagnosis` - Doctor's diagnosis
- `notes` - Clinical notes from the visit
- `follow_up_date` - Date for follow-up appointment if needed (DATE format)
- `clinic_id` - References `clinics.id` (provides clinic isolation)
- `created_at` - Timestamp when the record was created
- `updated_at` - Timestamp when the record was last updated

**Relationships:**
- Links to `appointments` table via `appointment_id`
- Links to `clinics` table via `clinic_id` for data isolation
- Referenced by `prescriptions` table

**Notes:**
- Created by doctors after completing an appointment
- Creating a visit automatically marks the appointment as 'completed'

---

### prescriptions

Stores medication prescriptions issued during visits.

```sql
CREATE TABLE prescriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_id INTEGER NOT NULL,
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  duration TEXT,
  clinic_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` - Auto-incrementing primary key
- `visit_id` - References `visits.id`
- `medicine_name` - Name of the prescribed medication (required)
- `dosage` - Dosage instructions (e.g., "500mg twice daily")
- `duration` - Duration of treatment (e.g., "7 days", "2 weeks")
- `clinic_id` - References `clinics.id` (provides clinic isolation)
- `created_at` - Timestamp when the record was created
- `updated_at` - Timestamp when the record was last updated

**Relationships:**
- Links to `visits` table via `visit_id`
- Links to `clinics` table via `clinic_id` for data isolation

**Notes:**
- Multiple prescriptions can be created for a single visit
- Only doctors can create prescriptions

---

### invoices

Stores billing information and payment tracking for patients.

```sql
CREATE TABLE invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  date DATETIME NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  description TEXT,
  clinic_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` - Auto-incrementing primary key
- `patient_id` - References `patients.id`
- `amount` - Invoice amount (REAL/decimal format)
- `date` - Date of the invoice (DATETIME format)
- `payment_status` - Payment status. Valid values: `'paid'`, `'pending'`
- `description` - Description of services/charges
- `clinic_id` - References `clinics.id` (provides clinic isolation)
- `created_at` - Timestamp when the record was created
- `updated_at` - Timestamp when the record was last updated

**Relationships:**
- Links to `patients` table via `patient_id`
- Links to `clinics` table via `clinic_id` for data isolation

**Notes:**
- Created by admin or receptionist users
- Payment status can be updated to track collections

---

## Entity Relationships

```
                     Mocha Authentication System
                              |
                              | (user_id)
                              |
clinics --- clinic_id ---> clinic_users
   |                          |
   |                          | (doctor_id)
   |                          |
   |--- clinic_id ---> appointments --- patient_id ---> patients
   |                          |
   |                          | (appointment_id)
   |                          |
   |--- clinic_id -----> visits
   |                          |
   |                          | (visit_id)
   |                          |
   |--- clinic_id --> prescriptions
   |
   |--- clinic_id -----> invoices <--- patient_id --- patients
```

**Key Relationships:**
- All data tables are linked to `clinics` via `clinic_id` for complete isolation
- Users belong to specific clinics and can only access that clinic's data
- Patients, appointments, visits, prescriptions, and invoices are all clinic-specific

---

## Data Type Conventions

- **INTEGER** - Whole numbers, used for IDs and counts
- **TEXT** - String data, variable length
- **REAL** - Floating point numbers, used for monetary amounts
- **DATE** - Date only (format: YYYY-MM-DD)
- **DATETIME** - Date with time (format: YYYY-MM-DD HH:MM:SS)
- **TIMESTAMP** - Same as DATETIME, typically with DEFAULT CURRENT_TIMESTAMP
- **BOOLEAN** - Stored as INTEGER (0 or 1), used with columns prefixed with `is_` or `has_`

---

## Column Naming Conventions

- **Primary Keys**: `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- **Timestamps**: `created_at`, `updated_at`
- **Boolean flags**: Prefix with `is_` or `has_` (e.g., `is_active`, `has_insurance`)
- **Dates with time**: Suffix with `_at` (e.g., `appointment_at`, `completed_at`)
- **Dates without time**: Suffix with `_date` (e.g., `birth_date`, `follow_up_date`)
- **Foreign keys**: Use singular table name + `_id` (e.g., `patient_id`, `doctor_id`)

---

## Database Constraints

The MediFlow database follows a simple constraint strategy:

- **No Foreign Key Constraints**: Foreign key relationships are enforced at the application level
- **No Check Constraints**: Value validation happens in application code
- **No Triggers**: Business logic is in the API layer
- **No Default Values** (except timestamps): Application provides all values

This approach ensures:
- Clearer error messages for users
- Easier debugging and modification
- More flexible schema evolution
- Better control over data validation

---

## Security Notes

- User authentication is handled by the external Mocha Users Service
- The `clinic_users.user_id` field links to authenticated users
- **Multi-tenant isolation**: All queries filter by `clinic_id` to prevent cross-clinic data access
- **Role-based access control** is enforced at the API level within each clinic
- **Complete data separation**: Users can only access data from their assigned clinic
- **HIPAA-style privacy**: No possibility of accidentally accessing other clinics' patient data
- Sensitive patient data should be encrypted at rest (handled by Cloudflare D1)
