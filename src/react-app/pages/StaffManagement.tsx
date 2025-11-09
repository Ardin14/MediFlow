import { useState, useEffect } from 'react';
import Layout from '@/react-app/components/Layout';
import { supabase } from '../lib/supabaseClient';
import { Plus, Mail, AlertTriangle, CheckCircle } from 'lucide-react';
import { generateSecurePassword } from '../utils/password';
import { useAuth } from '@/react-app/contexts/AuthContext';

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'admin' | 'doctor' | 'nurse' | 'receptionist';
  status: 'active' | 'inactive' | 'pending';
}

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStaffAdded: () => void;
  clinicId: number;
}

function AddStaffModal({ isOpen, onClose, onStaffAdded, clinicId }: AddStaffModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'doctor' as StaffMember['role'],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const password = generateSecurePassword();

      // 1. Create user account
      const { data: auth, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password,
        options: {
          data: {
            full_name: form.fullName,
            clinic_id: clinicId,
            role: form.role
          }
        }
      });

      if (authError) throw authError;

      // 2. Create clinic_user record with email for pre-provisioning/lookup
      const { error: staffError } = await supabase
        .from('clinic_users')
        .insert({
          user_id: auth.user!.id,
          clinic_id: clinicId,
          role: form.role,
          full_name: form.fullName,
          email: form.email,
          phone: form.phone,
          status: 'pending'
        });

      if (staffError) throw staffError;

      // 3. Send welcome email with credentials
      const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          email: form.email,
          password,
          name: form.fullName,
          role: form.role
        }
      });

      if (emailError) throw emailError;

      onStaffAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add staff member');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Add Staff Member</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as StaffMember['role'] })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="receptionist">Receptionist</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StaffManagement() {
  const { clinicUser } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = async () => {
    try {
      if (!clinicUser?.clinic_id) return;

      const { data: staffData } = await supabase
        .from('clinic_users')
        .select('*')
        .eq('clinic_id', clinicUser.clinic_id);

      setStaff(staffData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // refetch when clinic context changes
  }, [clinicUser?.clinic_id]);

  const resendInvite = async (staffMember: StaffMember) => {
    try {
      const password = generateSecurePassword();

      // Reset password and send new invite
      await supabase.auth.resetPasswordForEmail(staffMember.email);

      // Send welcome email with new credentials
      await supabase.functions.invoke('send-welcome-email', {
        body: {
          email: staffMember.email,
          password,
          name: staffMember.full_name,
          role: staffMember.role
        }
      });
    } catch (error) {
      console.error('Error resending invite:', error);
    }
  };

  const toggleStatus = async (staffMember: StaffMember) => {
    try {
      const newStatus = staffMember.status === 'active' ? 'inactive' : 'active';

      await supabase
        .from('clinic_users')
        .update({ status: newStatus })
        .eq('id', staffMember.id);

      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const approveStaff = async (staffMember: StaffMember) => {
    try {
      await supabase
        .from('clinic_users')
        .update({ status: 'active' })
        .eq('id', staffMember.id);

      fetchData();
    } catch (error) {
      console.error('Error approving staff member:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (clinicUser?.role !== 'admin') {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
            You do not have permission to manage staff.
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Staff Member
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staff.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {member.full_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.phone}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          member.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : member.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-3">
                        {member.status === 'pending' && (
                          <>
                            <button
                              onClick={() => approveStaff(member)}
                              className="text-green-600 hover:text-green-900 flex items-center gap-1"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => resendInvite(member)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Resend invite"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => toggleStatus(member)}
                          className={`${
                            member.status === 'active'
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {member.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <AddStaffModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onStaffAdded={fetchData}
          clinicId={clinicUser?.clinic_id as number}
        />
      </div>
    </Layout>
  );
}