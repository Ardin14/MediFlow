import { useNavigate, Navigate } from 'react-router-dom';
import { Building2, Users } from 'lucide-react';
import { useAuth } from '@/react-app/contexts/AuthContext';

export default function Onboarding() {
  const navigate = useNavigate();
  const { clinicUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (clinicUser) {
    if ((clinicUser as any).status && (clinicUser as any).status !== 'active') {
      return <Navigate to="/pending-approval" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-3xl w-full bg-white shadow-sm rounded-2xl p-8 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 text-center">Welcome! How would you like to get started?</h1>
        <p className="text-gray-600 text-center mt-2">Choose one of the options below to continue.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <button
            onClick={() => navigate('/setup')}
            className="p-6 border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow transition text-left"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">I am an Administrator</h3>
            <p className="text-sm text-gray-600 mt-1">Create a new clinic and manage its staff and settings.</p>
          </button>

          <button
            onClick={() => navigate('/join-clinic')}
            className="p-6 border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow transition text-left"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">I work at a clinic</h3>
            <p className="text-sm text-gray-600 mt-1">Join an existing clinic as a doctor, nurse, or receptionist.</p>
          </button>
        </div>
      </div>
    </div>
  );
}
