import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { UserRole } from '../../shared/types';

const STAFF_ROLES: UserRole[] = ['admin', 'receptionist', 'doctor'];

interface SetupProps {
  session: Session | null;
}

export default function Setup({ session }: SetupProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [displayName, setDisplayName] = useState(
    session?.user?.user_metadata?.full_name ?? ''
  );
  const navigate = useNavigate();

  const createClinicUser = async () => {
    if (!session?.user) return;
    setLoading(true);
    setError(null);

    try {
      // First, check if user already exists in clinic_users
      const { data: existingUser } = await supabase
        .from('clinic_users')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (existingUser) {
        // User already exists, redirect to dashboard
        navigate('/dashboard');
        return;
      }

      // Create a new clinic first
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .insert({
          name: 'My Clinic', // You might want to add a clinic name field to the form
          address: 'TBD'     // You might want to add address fields to the form
        })
        .select()
        .single();

      if (clinicError) throw clinicError;

      // Then create the clinic user as admin
      // Note: not including `email` here because some DB deployments
      // may not have an `email` column on clinic_users (causes 42703 errors).
      const { error: userError } = await supabase
        .from('clinic_users')
        .insert({
          user_id: session.user.id,
          clinic_id: clinic.id,
          role: selectedRole,
          full_name: displayName || session.user.email,
          status: 'active'
        })
        .select()
        .single();

      if (userError) throw userError;

      // On success navigate to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Setup error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Complete your profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Set up your role in the clinic system
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); createClinicUser(); }}>
            <div>
              <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="display_name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <div className="mt-1">
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  {STAFF_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {selectedRole === 'admin' && "Full access to manage the clinic, staff, and patients"}
                {selectedRole === 'receptionist' && "Schedule appointments and manage patient records"}
                {selectedRole === 'doctor' && "Access to patient consultations and medical records"}
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !displayName}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Setting up...' : 'Continue to Dashboard'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
