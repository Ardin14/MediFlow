# MediFlow API Documentation

This document describes all API endpoints available in the MediFlow clinical management system.

---

## Base URL

All API endpoints are relative to the application root:
```
https://zwmj2s4bh5w5c.mocha.app/api
```

---

## Authentication

### Overview
MediFlow uses Google OAuth 2.0 for authentication via the Mocha Users Service. Session tokens are stored in HTTP-only cookies.

### Authentication Flow

#### 1. Get OAuth Redirect URL
```http
GET /api/oauth/google/redirect_url
```

**Response:**
```json
{
  "redirectUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**Usage:**
- Client redirects user to the `redirectUrl`
- User signs in with Google
- Google redirects back with authorization code

---

#### 2. Exchange Code for Session Token
```http
POST /api/sessions
Content-Type: application/json

{
  "code": "authorization_code_from_google"
}
```

**Response:**
```json
{
  "success": true
}
```

**Side Effect:**
- Sets HTTP-only cookie with session token
- Cookie name: `mocha_session_token`
- Cookie attributes: `httpOnly=true`, `secure=true`, `sameSite=none`

---

#### 3. Get Current User
```http
GET /api/users/me
```

**Authentication:** Required (session cookie)

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "google_user_data": {
      "email": "doctor@example.com",
      "name": "Dr. John Smith",
      "picture": "https://..."
    }
  },
  "clinicUser": {
    "id": 1,
    "user_id": "user_123",
    "role": "doctor",
    "full_name": "Dr. John Smith",
    "phone": "+1234567890",
    "created_at": "2025-10-29T10:00:00Z",
    "updated_at": "2025-10-29T10:00:00Z"
  }
}
```

**Notes:**
- `clinicUser` will be `null` if user hasn't registered in the clinic system yet
- `user` contains Mocha authentication data
- `clinicUser` contains clinic-specific role and profile data

---

#### 4. Logout
```http
GET /api/logout
```

**Response:**
```json
{
  "success": true
}
```

**Side Effect:**
- Invalidates session on server
- Clears session cookie

---

## Clinic User Management

### Register in Clinic System
```http
POST /api/clinic-users
Content-Type: application/json

{
  "role": "doctor",
  "full_name": "Dr. John Smith",
  "phone": "+1234567890",
  "clinic_id": 1
}
```

**Authentication:** Required

**Parameters:**
- `role` (optional) - One of: `'admin'`, `'receptionist'`, `'doctor'`, `'nurse'`, `'patient'`. Defaults to `'patient'`
- `full_name` (optional) - User's full name. Defaults to name from Google profile
- `phone` (optional) - Contact phone number
- `clinic_id` (required) - ID of the clinic to register with

**Response:**
```json
{
  "success": true
}
```

**Error Responses:**
```json
{
  "error": "User already registered"
}
```

---

## Patient Management

### List All Patients
```http
GET /api/patients
```

**Authentication:** Required  
**Permissions:** `admin`, `receptionist`, `doctor`, `nurse`

**Response:**
```json
[
  {
    "id": 1,
    "user_id": "user_456",
    "full_name": "Jane Doe",
    "gender": "Female",
    "date_of_birth": "1990-05-15",
    "phone": "+1234567890",
    "email": "jane@example.com",
    "address": "123 Main St, City, State 12345",
    "medical_history": "No known allergies. Previous surgery in 2020.",
    "created_at": "2025-10-29T10:00:00Z",
    "updated_at": "2025-10-29T10:00:00Z"
  }
]
```

**Notes:**
- Returns patients ordered by `created_at` descending (newest first)
- `user_id` may be null if patient hasn't created a system account
- **Clinic Isolation**: Only returns patients from the user's clinic

---

### Create Patient
```http
POST /api/patients
Content-Type: application/json

{
  "full_name": "Jane Doe",
  "gender": "Female",
  "date_of_birth": "1990-05-15",
  "phone": "+1234567890",
  "email": "jane@example.com",
  "address": "123 Main St, City, State 12345",
  "medical_history": "No known allergies"
}
```

**Authentication:** Required  
**Permissions:** `admin`, `receptionist`, `nurse`

**Parameters:**
- `full_name` (required) - Patient's full name
- `gender` (optional) - Patient's gender
- `date_of_birth` (optional) - Format: `YYYY-MM-DD`
- `phone` (optional) - Contact phone number
- `email` (optional) - Email address
- `address` (optional) - Physical address
- `medical_history` (optional) - Medical history notes

**Response:**
```json
{
  "success": true
}
```

---

## Appointment Management

### List Appointments
```http
GET /api/appointments
```

**Authentication:** Required  
**Permissions:** All roles

**Response:**
```json
[
  {
    "id": 1,
    "patient_id": 1,
    "doctor_id": "user_123",
    "appointment_date": "2025-10-30T14:00:00Z",
    "reason": "Annual checkup",
    "status": "booked",
    "patient_name": "Jane Doe",
    "doctor_name": "Dr. John Smith",
    "created_at": "2025-10-29T10:00:00Z",
    "updated_at": "2025-10-29T10:00:00Z"
  }
]
```

**Notes:**
- Returns appointments ordered by `appointment_date` descending
- Doctors only see their own appointments (`doctor_id` filtered)
- Admin, receptionist see all appointments within their clinic
- **Clinic Isolation**: Only returns appointments from the user's clinic
- Includes patient and doctor names via JOIN queries

**Status Values:**
- `booked` - Initial state when scheduled
- `checked_in` - Patient has arrived
- `completed` - Visit completed with notes
- `cancelled` - Appointment cancelled

---

### Create Appointment
```http
POST /api/appointments
Content-Type: application/json

{
  "patient_id": 1,
  "doctor_id": "user_123",
  "appointment_date": "2025-10-30T14:00:00Z",
  "reason": "Annual checkup"
}
```

**Authentication:** Required  
**Permissions:** `admin`, `receptionist`, `nurse`

**Parameters:**
- `patient_id` (required) - ID from patients table
- `doctor_id` (required) - User ID of doctor (from clinic_users)
- `appointment_date` (required) - Format: `YYYY-MM-DD HH:MM:SS`
- `reason` (optional) - Reason for appointment

**Response:**
```json
{
  "success": true
}
```

**Notes:**
- New appointments default to `status='booked'`

---

### Update Appointment Status
```http
PUT /api/appointments/:id/status
Content-Type: application/json

{
  "status": "checked_in"
}
```

**Authentication:** Required  
**Permissions:** `admin`, `receptionist`, `doctor`, `nurse`

**URL Parameters:**
- `:id` - Appointment ID

**Body Parameters:**
- `status` (required) - One of: `'booked'`, `'checked_in'`, `'completed'`, `'cancelled'`

**Response:**
```json
{
  "success": true
}
```

**Notes:**
- Updates `updated_at` timestamp automatically
- Status is validated against allowed values

---

## Visit & Consultation Management

### Create Visit Record
```http
POST /api/visits
Content-Type: application/json

{
  "appointment_id": 1,
  "diagnosis": "Common cold",
  "notes": "Patient presents with runny nose and mild fever. Recommended rest and fluids.",
  "follow_up_date": "2025-11-15"
}
```

**Authentication:** Required  
**Permissions:** `doctor`

**Parameters:**
- `appointment_id` (required) - ID of the appointment
- `diagnosis` (optional) - Medical diagnosis
- `notes` (optional) - Clinical notes from visit
- `follow_up_date` (optional) - Date for follow-up. Format: `YYYY-MM-DD`

**Response:**
```json
{
  "success": true
}
```

**Side Effects:**
- Automatically marks the appointment as `status='completed'`
- Updates appointment's `updated_at` timestamp

**Notes:**
- Only doctors can create visit records
- One visit per appointment

---

## Prescription Management

### Create Prescription
```http
POST /api/prescriptions
Content-Type: application/json

{
  "visit_id": 1,
  "medicine_name": "Amoxicillin",
  "dosage": "500mg twice daily",
  "duration": "7 days"
}
```

**Authentication:** Required  
**Permissions:** `doctor`

**Parameters:**
- `visit_id` (required) - ID of the visit
- `medicine_name` (required) - Name of medication
- `dosage` (optional) - Dosage instructions
- `duration` (optional) - Treatment duration

**Response:**
```json
{
  "success": true
}
```

**Notes:**
- Multiple prescriptions can be created for a single visit
- Only doctors can create prescriptions

---

## Billing & Invoice Management

### List Invoices
```http
GET /api/invoices
```

**Authentication:** Required  
**Permissions:** `admin`, `receptionist`

**Response:**
```json
[
  {
    "id": 1,
    "patient_id": 1,
    "amount": 150.00,
    "date": "2025-10-29T10:00:00Z",
    "payment_status": "pending",
    "description": "Annual checkup and consultation",
    "patient_name": "Jane Doe",
    "created_at": "2025-10-29T10:00:00Z",
    "updated_at": "2025-10-29T10:00:00Z"
  }
]
```

**Notes:**
- Returns invoices ordered by `created_at` descending
- **Clinic Isolation**: Only returns invoices from the user's clinic
- Includes patient name via JOIN query

---

### Create Invoice
```http
POST /api/invoices
Content-Type: application/json

{
  "patient_id": 1,
  "amount": 150.00,
  "description": "Annual checkup and consultation"
}
```

**Authentication:** Required  
**Permissions:** `admin`, `receptionist`

**Parameters:**
- `patient_id` (required) - ID from patients table
- `amount` (required) - Invoice amount (decimal)
- `description` (optional) - Description of services

**Response:**
```json
{
  "success": true
}
```

**Notes:**
- New invoices default to `payment_status='pending'`
- Date is set to current timestamp automatically

---

### Update Invoice Payment Status
```http
PUT /api/invoices/:id/status
Content-Type: application/json

{
  "payment_status": "paid"
}
```

**Authentication:** Required  
**Permissions:** `admin`, `receptionist`

**URL Parameters:**
- `:id` - Invoice ID

**Body Parameters:**
- `payment_status` (required) - One of: `'paid'`, `'pending'`

**Response:**
```json
{
  "success": true
}
```

---

## Dashboard & Analytics

### Get Dashboard Statistics
```http
GET /api/dashboard/stats
```

**Authentication:** Required  
**Permissions:** All roles

**Response:**
```json
{
  "totalPatients": 45,
  "todayAppointments": 8,
  "pendingInvoices": 12
}
```

**Notes:**
- `totalPatients` - Total count of patients in the user's clinic only
- `todayAppointments` - Count of appointments scheduled for today in the user's clinic
  - Doctors only see their own appointments within their clinic
  - Admin/receptionist see all appointments within their clinic
- `pendingInvoices` - Count of invoices with `payment_status='pending'` in the user's clinic
  - Only returned for admin/receptionist roles
  - Returns 0 for doctor/patient roles
- **Clinic Isolation**: All statistics are filtered by the user's clinic

---

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
**Cause:** No valid session token provided

---

### 403 Forbidden
```json
{
  "error": "Awaiting clinic admin approval",
  "status": "pending"
}
```
Possible causes:
- Clinic registration required
- Account pending approval by clinic admin
```json
{
  "error": "Insufficient permissions"
}
```
**Cause:** User's role doesn't have permission for this endpoint

```json
{
  "error": "User not registered in clinic system"
}
```
**Cause:** User is authenticated but hasn't registered in the clinic system

---

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```
**Cause:** Request body failed Zod schema validation

---

### 500 Internal Server Error
```json
{
  "error": "Failed to create/update resource"
}
```
**Cause:** Database operation failed

---

## CORS Configuration

All endpoints support CORS with the following configuration:
- **Origin:** `*` (all origins allowed)
- **Methods:** `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- **Headers:** `Content-Type`, `Authorization`
- **Credentials:** `true` (cookies allowed)

---

## Rate Limiting

Currently no rate limiting is implemented. Future versions may include:
- Per-user rate limits
- Per-IP rate limits
- Endpoint-specific limits

---

## Versioning

Current API version: `v1` (implicit)

Future versions will be explicitly versioned:
```
/api/v2/patients
```

---

## Best Practices

### Making API Calls

**Always include credentials:**
```javascript
fetch('/api/patients', {
  credentials: 'include'  // Important for cookie authentication
})
```

**Handle errors gracefully:**
```javascript
const response = await fetch('/api/patients');
if (!response.ok) {
  const error = await response.json();
  console.error(error.error);
  // Show user-friendly error message
}
```

**Validate data before sending:**
```javascript
import { CreatePatientSchema } from '@/shared/types';

try {
  const validatedData = CreatePatientSchema.parse(formData);
  await fetch('/api/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validatedData),
    credentials: 'include'
  });
} catch (error) {
  // Handle validation errors
}
```

---

## Security Considerations

1. **Authentication Required:** All protected endpoints require valid session token
2. **Role-Based Access:** Endpoints enforce role-based permissions within each clinic
3. **Multi-Tenant Isolation:** All data queries filtered by clinic_id to prevent cross-clinic access
4. **HIPAA-Style Privacy:** Complete data separation between different healthcare facilities
5. **Input Validation:** All inputs validated with Zod schemas
6. **SQL Injection Prevention:** Parameterized queries used throughout
7. **XSS Prevention:** HTTP-only cookies prevent JavaScript access to tokens
8. **HTTPS Only:** Session cookies have `secure=true` flag

### Clinic Data Isolation

All data access is automatically filtered by the user's clinic:
- Receptionists from Clinic A cannot see patients from Clinic B
- Doctors from Clinic A cannot see appointments from Clinic B  
- Billing data is completely separated between clinics
- No possibility of accidental cross-clinic data access

---

## Support

For additional API support or questions:
- Review the database schema in `docs/DATABASE_SCHEMA.md`
- Check the general documentation in `docs/README.md`
- Examine the source code in `src/worker/index.ts`
