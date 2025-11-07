# MediFlow Technical Documentation

## API Documentation

### Authentication Endpoints

#### 1. Clinic Registration
```http
POST /api/clinics/register
```

**Request Body:**
```typescript
interface ClinicRegistrationRequest {
  clinicName: string;
  address: string;
  phone: string;
  email: string;
  adminFullName: string;
  adminEmail: string;
  adminPhone: string;
  licenseNumber?: string;
  taxId?: string;
}
```

**Response:**
```typescript
interface ClinicRegistrationResponse {
  clinic: {
    id: number;
    name: string;
    status: 'pending_verification' | 'active' | 'suspended';
  };
  admin: {
    id: string;
    email: string;
  };
}
```

#### 2. Staff Invitation
```http
POST /api/staff/invite
```

**Request Body:**
```typescript
interface StaffInviteRequest {
  fullName: string;
  email: string;
  phone: string;
  role: 'doctor' | 'nurse' | 'receptionist' | 'admin';
  specialization?: string;
  licenseNumber?: string;
}
```

### Patient Management Endpoints

#### 1. Create Patient
```http
POST /api/patients
```

**Request Body:**
```typescript
interface CreatePatientRequest {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: {
    allergies: string[];
    conditions: string[];
    medications: string[];
  };
}
```

#### 2. Update Patient
```http
PUT /api/patients/:id
```

#### 3. Bulk Transfer Patients
```http
POST /api/patients/transfer
```

**Request Body:**
```typescript
interface BulkTransferRequest {
  patientIds: number[];
  targetClinicId: number;
  reason?: string;
}
```

### Appointment Management

#### 1. Schedule Appointment
```http
POST /api/appointments
```

**Request Body:**
```typescript
interface ScheduleAppointmentRequest {
  patientId: number;
  doctorId: string;
  dateTime: string;
  duration: number;
  type: string;
  notes?: string;
}
```

#### 2. Update Appointment Status
```http
PUT /api/appointments/:id/status
```

**Request Body:**
```typescript
interface UpdateAppointmentStatusRequest {
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}
```

### Medical Records

#### 1. Add Medical Record
```http
POST /api/patients/:id/medical-records
```

**Request Body:**
```typescript
interface AddMedicalRecordRequest {
  type: 'consultation' | 'procedure' | 'test_result' | 'prescription';
  details: {
    diagnosis?: string;
    symptoms?: string[];
    notes?: string;
    prescriptions?: {
      medication: string;
      dosage: string;
      frequency: string;
      duration: string;
    }[];
  };
}
```

## Webhook Events

The system emits the following webhook events that you can subscribe to:

1. `clinic.created`
2. `patient.registered`
3. `appointment.scheduled`
4. `medical_record.created`
5. `prescription.created`

## Real-time Subscriptions

Subscribe to real-time updates using Supabase's real-time features:

```typescript
const appointmentsSubscription = supabase
  .from('appointments')
  .on('INSERT', (payload) => {
    // Handle new appointment
  })
  .on('UPDATE', (payload) => {
    // Handle appointment update
  })
  .subscribe();
```

## Error Handling

All API endpoints return standard error responses:

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

Common error codes:
- `AUTH001`: Authentication failed
- `AUTH002`: Invalid credentials
- `AUTH003`: Insufficient permissions
- `VAL001`: Validation error
- `DB001`: Database error
- `API001`: General API error

## Rate Limiting

- Standard rate limit: 100 requests per minute per IP
- Bulk operations: 10 requests per minute
- Authentication attempts: 5 per minute per IP

## Security Measures

### 1. Authentication
- JWT-based authentication
- Token expiration: 1 hour
- Refresh token expiration: 14 days
- Password requirements:
  - Minimum 12 characters
  - Must include uppercase, lowercase, number, special character

### 2. Data Access
All data access is controlled through Row Level Security policies:

```sql
-- Example: Doctors can only view their assigned patients
CREATE POLICY "doctors_view_assigned_patients" ON "public"."patients"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.patient_id = patients.id
    AND a.doctor_id = auth.uid()
  )
);
```

### 3. Audit Logging
All sensitive operations are logged:

```sql
CREATE TABLE audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  changes jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);
```

## Development Guidelines

### 1. Type Safety
Use TypeScript for all new code:

```typescript
interface Patient {
  id: number;
  fullName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  // ... other fields
}
```

### 2. Component Structure
Follow this structure for React components:

```typescript
interface Props {
  // Props interface
}

const Component: React.FC<Props> = ({ prop1, prop2 }) => {
  // Component logic
  return (
    // JSX
  );
};
```

### 3. Database Interactions
Use prepared statements and parameterized queries:

```typescript
const getPatientRecords = async (patientId: number) => {
  const { data, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
```

### 4. Error Boundaries
Implement error boundaries for all major features:

```typescript
class FeatureErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    logError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

## Monitoring & Analytics

The system collects the following metrics:

1. **Performance Metrics**
   - API response times
   - Database query performance
   - Page load times
   - Error rates

2. **Business Metrics**
   - Active users per clinic
   - Appointment completion rates
   - Patient registration trends
   - Staff activity levels

3. **System Health**
   - Database connection pool status
   - Cache hit rates
   - Storage usage
   - API endpoint usage

## Deployment

The application uses a continuous deployment pipeline:

1. **Development**
   - Local development
   - Feature branches
   - Unit tests

2. **Staging**
   - Integration testing
   - Performance testing
   - Security scanning

3. **Production**
   - Blue-green deployment
   - Automated rollback
   - Health monitoring