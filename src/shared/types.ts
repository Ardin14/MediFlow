import z from "zod";

// User role enum
export const UserRoleSchema = z.enum(['admin', 'receptionist', 'doctor', 'patient']);
export type UserRole = z.infer<typeof UserRoleSchema>;

// Appointment status enum
export const AppointmentStatusSchema = z.enum(['booked', 'checked_in', 'completed', 'cancelled']);
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

// Payment status enum
export const PaymentStatusSchema = z.enum(['paid', 'pending']);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

// Clinic schema
export const ClinicSchema = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Clinic = z.infer<typeof ClinicSchema>;

// Clinic User schema
export const ClinicUserSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  clinic_id: z.number(),
  role: UserRoleSchema,
  full_name: z.string().nullable(),
  phone: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type ClinicUser = z.infer<typeof ClinicUserSchema>;

// Patient schema
export const PatientSchema = z.object({
  id: z.number(),
  user_id: z.string().nullable(),
  clinic_id: z.number(),
  full_name: z.string(),
  gender: z.string().nullable(),
  date_of_birth: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  medical_history: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Patient = z.infer<typeof PatientSchema>;

// Appointment schema
export const AppointmentSchema = z.object({
  id: z.number(),
  patient_id: z.number(),
  doctor_id: z.string(),
  clinic_id: z.number(),
  appointment_date: z.string(),
  reason: z.string().nullable(),
  status: AppointmentStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
});
export type Appointment = z.infer<typeof AppointmentSchema>;

// Visit schema
export const VisitSchema = z.object({
  id: z.number(),
  appointment_id: z.number(),
  clinic_id: z.number(),
  diagnosis: z.string().nullable(),
  notes: z.string().nullable(),
  follow_up_date: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Visit = z.infer<typeof VisitSchema>;

// Prescription schema
export const PrescriptionSchema = z.object({
  id: z.number(),
  visit_id: z.number(),
  clinic_id: z.number(),
  medicine_name: z.string(),
  dosage: z.string().nullable(),
  duration: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Prescription = z.infer<typeof PrescriptionSchema>;

// Invoice schema
export const InvoiceSchema = z.object({
  id: z.number(),
  patient_id: z.number(),
  clinic_id: z.number(),
  amount: z.number(),
  date: z.string(),
  payment_status: PaymentStatusSchema,
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

// API request/response schemas
export const CreatePatientSchema = z.object({
  full_name: z.string().min(1),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  medical_history: z.string().optional(),
});
export type CreatePatientRequest = z.infer<typeof CreatePatientSchema>;

export const CreateAppointmentSchema = z.object({
  patient_id: z.number(),
  doctor_id: z.string(),
  appointment_date: z.string(),
  reason: z.string().optional(),
});
export type CreateAppointmentRequest = z.infer<typeof CreateAppointmentSchema>;

export const UpdateAppointmentStatusSchema = z.object({
  status: AppointmentStatusSchema,
});
export type UpdateAppointmentStatusRequest = z.infer<typeof UpdateAppointmentStatusSchema>;

export const CreateVisitSchema = z.object({
  appointment_id: z.number(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  follow_up_date: z.string().optional(),
});
export type CreateVisitRequest = z.infer<typeof CreateVisitSchema>;

export const CreatePrescriptionSchema = z.object({
  visit_id: z.number(),
  medicine_name: z.string().min(1),
  dosage: z.string().optional(),
  duration: z.string().optional(),
});
export type CreatePrescriptionRequest = z.infer<typeof CreatePrescriptionSchema>;

export const CreateInvoiceSchema = z.object({
  patient_id: z.number(),
  amount: z.number().positive(),
  description: z.string().optional(),
});
export type CreateInvoiceRequest = z.infer<typeof CreateInvoiceSchema>;

export const UpdateInvoiceStatusSchema = z.object({
  payment_status: PaymentStatusSchema,
});
export type UpdateInvoiceStatusRequest = z.infer<typeof UpdateInvoiceStatusSchema>;

export const CreateClinicUserSchema = z.object({
  role: UserRoleSchema,
  clinic_id: z.number(),
  full_name: z.string().optional(),
  phone: z.string().optional(),
});
export type CreateClinicUserRequest = z.infer<typeof CreateClinicUserSchema>;
