export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clinic_users: {
        Row: {
          id: number
          user_id: string
          role: string
          clinic_id: number | null
          full_name: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          role: string
          clinic_id?: number | null
          full_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          role?: string
          clinic_id?: number | null
          full_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      patients: {
        Row: {
          id: number
          user_id: string | null
          clinic_id: number | null
          full_name: string
          gender: string | null
          date_of_birth: string | null
          phone: string | null
          email: string | null
          address: string | null
          medical_history: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          clinic_id?: number | null
          full_name: string
          gender?: string | null
          date_of_birth?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          medical_history?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          clinic_id?: number | null
          full_name?: string
          gender?: string | null
          date_of_birth?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          medical_history?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: number
          patient_id: number
          clinic_id: number | null
          doctor_id: number
          appointment_date: string
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          patient_id: number
          clinic_id?: number | null
          doctor_id: number
          appointment_date: string
          status: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          patient_id?: number
          clinic_id?: number | null
          doctor_id?: number
          appointment_date?: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clinics: {
        Row: {
          id: number
          name: string
          address: string | null
          phone: string | null
          settings: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          address?: string | null
          phone?: string | null
          settings?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          address?: string | null
          phone?: string | null
          settings?: Json | null
          created_at?: string
        }
      }
      visits: {
        Row: {
          id: number
          appointment_id: number | null
          patient_id: number
          clinic_user_id: number
          visit_date: string
          chief_complaint: string | null
          diagnosis: string | null
          vitals: Json | null
          notes: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          appointment_id?: number | null
          patient_id: number
          clinic_user_id: number
          visit_date?: string
          chief_complaint?: string | null
          diagnosis?: string | null
          vitals?: Json | null
          notes?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          appointment_id?: number | null
          patient_id?: number
          clinic_user_id?: number
          visit_date?: string
          chief_complaint?: string | null
          diagnosis?: string | null
          vitals?: Json | null
          notes?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      prescriptions: {
        Row: {
          id: number
          visit_id: number
          patient_id: number
          prescribed_by: number
          issued_at: string
          instructions: string | null
          status: string
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          visit_id: number
          patient_id: number
          prescribed_by: number
          issued_at?: string
          instructions?: string | null
          status?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          visit_id?: number
          patient_id?: number
          prescribed_by?: number
          issued_at?: string
          instructions?: string | null
          status?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      prescription_items: {
        Row: {
          id: number
          prescription_id: number
          medication: string
          dose: string | null
          frequency: string | null
          duration: string | null
          quantity: number | null
          notes: string | null
        }
        Insert: {
          id?: number
          prescription_id: number
          medication: string
          dose?: string | null
          frequency?: string | null
          duration?: string | null
          quantity?: number | null
          notes?: string | null
        }
        Update: {
          id?: number
          prescription_id?: number
          medication?: string
          dose?: string | null
          frequency?: string | null
          duration?: string | null
          quantity?: number | null
          notes?: string | null
        }
      }
      invoices: {
        Row: {
          id: number
          patient_id: number
          clinic_user_id: number | null
          clinic_id: number | null
          total: string
          status: string
          due_date: string | null
          currency: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          patient_id: number
          clinic_user_id?: number | null
          clinic_id?: number | null
          total?: string
          status?: string
          due_date?: string | null
          currency?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          patient_id?: number
          clinic_user_id?: number | null
          clinic_id?: number | null
          total?: string
          status?: string
          due_date?: string | null
          currency?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      invoice_items: {
        Row: {
          id: number
          invoice_id: number
          description: string
          quantity: number
          unit_amount: string
          amount: string
          created_at: string
        }
        Insert: {
          id?: number
          invoice_id: number
          description: string
          quantity?: number
          unit_amount: string
          amount?: string
          created_at?: string
        }
        Update: {
          id?: number
          invoice_id?: number
          description?: string
          quantity?: number
          unit_amount?: string
          amount?: string
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: number
          invoice_id: number | null
          amount: string
          method: string | null
          transaction_id: string | null
          status: string
          paid_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: number
          invoice_id?: number | null
          amount: string
          method?: string | null
          transaction_id?: string | null
          status?: string
          paid_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: number
          invoice_id?: number | null
          amount?: string
          method?: string | null
          transaction_id?: string | null
          status?: string
          paid_at?: string | null
          metadata?: Json | null
        }
      }
      medications: {
        Row: {
          id: number
          name: string
          brand: string | null
          strength: string | null
          unit: string | null
          ndc_code: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          brand?: string | null
          strength?: string | null
          unit?: string | null
          ndc_code?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          brand?: string | null
          strength?: string | null
          unit?: string | null
          ndc_code?: string | null
          created_at?: string
        }
      }
      lab_results: {
        Row: {
          id: number
          patient_id: number
          visit_id: number | null
          test_name: string
          result: Json | null
          units: string | null
          normal_range: string | null
          collected_at: string | null
          uploaded_by: number | null
          file_url: string | null
          created_at: string
        }
        Insert: {
          id?: number
          patient_id: number
          visit_id?: number | null
          test_name: string
          result?: Json | null
          units?: string | null
          normal_range?: string | null
          collected_at?: string | null
          uploaded_by?: number | null
          file_url?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          patient_id?: number
          visit_id?: number | null
          test_name?: string
          result?: Json | null
          units?: string | null
          normal_range?: string | null
          collected_at?: string | null
          uploaded_by?: number | null
          file_url?: string | null
          created_at?: string
        }
      }
      files: {
        Row: {
          id: number
          owner_user_id: string | null
          patient_id: number | null
          visit_id: number | null
          file_name: string | null
          content_type: string | null
          url: string
          size: number | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          owner_user_id?: string | null
          patient_id?: number | null
          visit_id?: number | null
          file_name?: string | null
          content_type?: string | null
          url: string
          size?: number | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          owner_user_id?: string | null
          patient_id?: number | null
          visit_id?: number | null
          file_name?: string | null
          content_type?: string | null
          url?: string
          size?: number | null
          metadata?: Json | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: number
          user_id: string | null
          patient_id: number | null
          type: string | null
          payload: Json | null
          read: boolean
          send_at: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          patient_id?: number | null
          type?: string | null
          payload?: Json | null
          read?: boolean
          send_at?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          patient_id?: number | null
          type?: string | null
          payload?: Json | null
          read?: boolean
          send_at?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: number
          actor_user_id: string | null
          action: string
          table_name: string | null
          record_id: string | null
          changes: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          actor_user_id?: string | null
          action: string
          table_name?: string | null
          record_id?: string | null
          changes?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          actor_user_id?: string | null
          action?: string
          table_name?: string | null
          record_id?: string | null
          changes?: Json | null
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}