import { useAuth } from '@/react-app/contexts/AuthContext';
import { Clock } from 'lucide-react';

export default function PendingApproval() {
  const { clinicUser } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Pending Approval</h2>
        <p className="text-gray-600 mt-2">
          Your account is awaiting approval from the clinic admin. You will receive access once approved.
        </p>
        <div className="mt-6 text-sm text-gray-500">
          Status: <span className="font-medium capitalize">{clinicUser?.status || 'pending'}</span>
        </div>
      </div>
    </div>
  );
}