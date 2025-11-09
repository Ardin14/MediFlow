import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/react-app/lib/supabaseClient';
import { Building2 } from 'lucide-react';

export default function JoinClinic() {
  const navigate = useNavigate();
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<'doctor' | 'nurse' | 'receptionist'>('doctor');
  const [clinicId, setClinicId] = useState<number | null>(null);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from('clinics').select('id,name,address,phone').order('name');
      if (error) {
        setError(error.message);
      } else {
        setClinics(data || []);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!clinicId) { setError('Please select a clinic'); return; }
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase.from('clinic_users').insert({
        user_id: user.id,
        clinic_id: clinicId,
        role,
        full_name: user.user_metadata?.full_name || user.email,
        phone: phone || null,
        status: 'pending'
      });
      if (insertError) throw insertError;

      navigate('/pending-approval');
    } catch (err: any) {
      setError(err.message || 'Failed to join clinic');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-sm rounded-2xl p-8 border border-gray-100">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join an existing clinic</h1>
          <p className="text-gray-600 mt-1">Request access to a clinic. An admin must approve you.</p>
        </div>

        {error && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clinic</label>
            <select
              value={clinicId ?? ''}
              onChange={(e) => setClinicId(Number(e.target.value))}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="" disabled>Choose a clinic...</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.address ? ` - ${c.address}` : ''}{c.phone ? ` (${c.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="receptionist">Receptionist</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+1 555 123 4567"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Request access'}
          </button>
        </form>
      </div>
    </div>
  );
}