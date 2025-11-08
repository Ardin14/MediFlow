import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

interface SetupProps {
  session: Session | null;
}

export default function Setup({ session }: SetupProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(
    session?.user?.user_metadata?.full_name ?? ''
  );
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const navigate = useNavigate();

  const handleSetup = async () => {
    if (!session?.user) return;
    setLoading(true);
    setError(null);

    try {
      // If already registered, go to dashboard
      const { data: existingUser } = await supabase
        .from('clinic_users')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (existingUser) {
        navigate('/dashboard');
        return;
      }

      if (!clinicName.trim()) throw new Error('Clinic name is required');

      const { error: rpcError } = await supabase.rpc('create_clinic_and_admin', {
        p_name: clinicName.trim(),
        p_address: clinicAddress || null,
        p_phone: clinicPhone || null,
        p_admin_full_name: displayName || session.user.email,
        p_admin_phone: clinicPhone || null,
      });
      if (rpcError) throw rpcError;

      // Success: redirect
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
          Set up your clinic
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create a clinic and become its administrator.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSetup(); }}>
            <div>
              <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
                Your Full Name
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
              <label htmlFor="clinic_name" className="block text-sm font-medium text-gray-700">
                Clinic Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="clinic_name"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Sunrise Medical Center"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="clinic_address" className="block text-sm font-medium text-gray-700">
                Address (optional)
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="clinic_address"
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="123 Example Street"
                />
              </div>
            </div>

            <div>
              <label htmlFor="clinic_phone" className="block text-sm font-medium text-gray-700">
                Phone (optional)
              </label>
              <div className="mt-1">
                <input
                  type="tel"
                  id="clinic_phone"
                  value={clinicPhone}
                  onChange={(e) => setClinicPhone(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="+1 555 123 4567"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !displayName || !clinicName}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating clinic...' : 'Create Clinic'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
