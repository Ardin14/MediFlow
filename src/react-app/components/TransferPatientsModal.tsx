import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X } from 'lucide-react';

interface TransferPatientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientIds: number[];
  currentClinicId: number;
  onTransferComplete: () => void;
}

export default function TransferPatientsModal({
  isOpen,
  onClose,
  patientIds,
  currentClinicId,
  onTransferComplete
}: TransferPatientsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetClinicId, setTargetClinicId] = useState<string>('');
  const [clinics, setClinics] = useState<Array<{ id: number; name: string }>>([]);
  const [searchClinic, setSearchClinic] = useState('');

  const searchClinics = async (searchTerm: string) => {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name')
        .neq('id', currentClinicId)
        .ilike('name', `%${searchTerm}%`)
        .limit(5);

      if (error) throw error;
      setClinics(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search clinics');
    }
  };

  const handleTransfer = async () => {
    if (!targetClinicId) {
      setError('Please select a target clinic');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Start a transaction to update all related records
      const { error: transferError } = await supabase.rpc('transfer_patients', {
        p_patient_ids: patientIds,
        p_target_clinic_id: parseInt(targetClinicId)
      });

      if (transferError) throw transferError;

      onTransferComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transfer patients');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Transfer {patientIds.length} Patient{patientIds.length > 1 ? 's' : ''}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Target Clinic
            </label>
            <input
              type="text"
              value={searchClinic}
              onChange={(e) => {
                setSearchClinic(e.target.value);
                searchClinics(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type to search clinics..."
            />
          </div>

          {clinics.length > 0 && (
            <div className="mt-2 space-y-2">
              {clinics.map((clinic) => (
                <label
                  key={clinic.id}
                  className={`flex items-center p-3 rounded-lg cursor-pointer ${
                    targetClinicId === clinic.id.toString()
                      ? 'bg-blue-50 border-blue-200'
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="clinic"
                    value={clinic.id}
                    checked={targetClinicId === clinic.id.toString()}
                    onChange={(e) => setTargetClinicId(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-3">{clinic.name}</span>
                </label>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleTransfer}
              disabled={loading || !targetClinicId}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Transferring...' : 'Transfer Patients'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}