import { z } from "zod";
import { PatientSchema } from "./types";

// Blood type enum
export const BloodTypeSchema = z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
export type BloodType = z.infer<typeof BloodTypeSchema>;

// Gender enum
export const GenderSchema = z.enum(['male', 'female', 'other']);
export type Gender = z.infer<typeof GenderSchema>;

// Enhanced patient schema with additional medical fields
export const EnhancedPatientSchema = PatientSchema.extend({
  blood_type: BloodTypeSchema.nullable(),
  allergies: z.string().nullable(),
  emergency_contact: z.string().nullable(),
  emergency_phone: z.string().nullable(),
  insurance_provider: z.string().nullable(),
  insurance_number: z.string().nullable(),
  preferred_language: z.string().nullable(),
  height: z.number().nullable(), // in cm
  weight: z.number().nullable(), // in kg
  medications: z.string().nullable(), // Current medications
  chronic_conditions: z.string().nullable(),
  last_visit_date: z.string().nullable(),
});

export type EnhancedPatient = z.infer<typeof EnhancedPatientSchema>;

// Patient search/filter parameters
export const PatientSearchParamsSchema = z.object({
  search: z.string().optional(), // Search in name, email, phone
  gender: GenderSchema.optional(),
  ageRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  bloodType: BloodTypeSchema.optional(),
  hasInsurance: z.boolean().optional(),
  lastVisitRange: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }).optional(),
  sortBy: z.enum(['name', 'created_at', 'last_visit_date', 'age']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});

export type PatientSearchParams = z.infer<typeof PatientSearchParamsSchema>;

// Patient list response
export const PatientListResponseSchema = z.object({
  data: z.array(EnhancedPatientSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  hasMore: z.boolean(),
});

export type PatientListResponse = z.infer<typeof PatientListResponseSchema>;

// Bulk operations
export const BulkPatientOperationSchema = z.object({
  patientIds: z.array(z.number()),
  operation: z.enum(['delete', 'export', 'archive', 'transfer']),
  // Additional parameters for specific operations
  transferToClinicId: z.number().optional(), // For transfer operation
});

export type BulkPatientOperation = z.infer<typeof BulkPatientOperationSchema>;

// Patient profile update
export const UpdatePatientProfileSchema = EnhancedPatientSchema.partial().omit({
  id: true,
  clinic_id: true,
  created_at: true,
  updated_at: true,
});

export type UpdatePatientProfile = z.infer<typeof UpdatePatientProfileSchema>;

// Patient medical history entry
export const MedicalHistoryEntrySchema = z.object({
  id: z.number(),
  patient_id: z.number(),
  date: z.string(),
  entry_type: z.enum(['visit', 'prescription', 'lab_result', 'vaccination', 'note']),
  description: z.string(),
  recorded_by: z.string(), // user_id of the staff member
  attachments: z.array(z.string()).optional(), // Array of file URLs
  created_at: z.string(),
});

export type MedicalHistoryEntry = z.infer<typeof MedicalHistoryEntrySchema>;