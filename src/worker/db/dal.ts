import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use an untyped SupabaseClient here to avoid PostgREST overload/type issues
type AnySupabase = SupabaseClient<any>;

type Tables = Database['public']['Tables'];

export class DataAccessLayer {
  constructor(private readonly supabase: AnySupabase) {}

  // Clinic Users
  async getClinicUser(userId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('clinic_users')
      .select()
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createClinicUser(userData: Omit<Tables['clinic_users']['Insert'], 'id'>): Promise<any> {
    const { data, error } = await this.supabase
      .from('clinic_users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Patients
  async getPatient(id: number): Promise<any> {
    const { data, error } = await this.supabase
      .from('patients')
      .select()
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createPatient(patientData: Omit<Tables['patients']['Insert'], 'id'>): Promise<any> {
    const { data, error } = await this.supabase
      .from('patients')
      .insert([patientData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Appointments
  async getAppointments(patientId?: number, doctorId?: number): Promise<any[]> {
    let query = this.supabase
      .from('appointments')
      .select();
    
    if (patientId) {
      query = query.eq('patient_id', patientId);
    }
    if (doctorId) {
      query = query.eq('doctor_id', doctorId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createAppointment(appointmentData: Omit<Tables['appointments']['Insert'], 'id'>): Promise<any> {
    const { data, error } = await this.supabase
      .from('appointments')
      .insert([appointmentData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateAppointmentStatus(id: number, status: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}