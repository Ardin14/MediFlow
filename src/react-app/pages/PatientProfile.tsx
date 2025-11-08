import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Calendar, FileText, Activity } from 'lucide-react';
import type { 
  EnhancedPatient,
  UpdatePatientProfile,
  MedicalHistoryEntry 
} from '../../shared/patient-types';
import { BloodTypeSchema, GenderSchema } from '../../shared/patient-types';

export default function PatientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<EnhancedPatient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UpdatePatientProfile>({});
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistoryEntry[]>([]);

  useEffect(() => {
    if (id) fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (patientError) throw patientError;

      setPatient(patient);

      // Fetch medical history
      const { data: history, error: historyError } = await supabase
        .from('medical_history')
        .select('*')
        .eq('patient_id', id)
        .order('date', { ascending: false });

      if (historyError) throw historyError;

      setMedicalHistory(history || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patient');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(patient || {});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleSave = async () => {
    if (!patient?.id) return;

    try {
      setSaving(true);
      setError(null);

      const { error } = await supabase
        .from('patients')
        .update(editData)
        .eq('id', patient.id);

      if (error) throw error;

      await fetchPatient();
      setIsEditing(false);
      setEditData({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update patient');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof UpdatePatientProfile,
    value: string | number | null
  ) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading patient profile...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Patient not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Patient Profile
        </h1>
        <div className="space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.full_name || ''}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <div className="text-gray-900">{patient.full_name}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                {isEditing ? (
                  <select
                    value={editData.gender || ''}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select gender</option>
                    {GenderSchema.options.map((gender) => (
                      <option key={gender} value={gender}>
                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-gray-900">
                    {patient.gender ? 
                      patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) 
                      : 'Not specified'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editData.date_of_birth || ''}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <div className="text-gray-900">
                    {patient.date_of_birth ? 
                      new Date(patient.date_of_birth).toLocaleDateString() 
                      : 'Not specified'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <div className="text-gray-900">{patient.phone || 'Not provided'}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <div className="text-gray-900">{patient.email || 'Not provided'}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blood Type
                </label>
                {isEditing ? (
                  <select
                    value={editData.blood_type || ''}
                    onChange={(e) => handleInputChange('blood_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select blood type</option>
                    {BloodTypeSchema.options.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-gray-900">
                    {patient.blood_type || 'Not specified'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Medical Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergies
                </label>
                {isEditing ? (
                  <textarea
                    value={editData.allergies || ''}
                    onChange={(e) => handleInputChange('allergies', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <div className="text-gray-900">
                    {patient.allergies || 'No known allergies'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Medications
                </label>
                {isEditing ? (
                  <textarea
                    value={editData.medications || ''}
                    onChange={(e) => handleInputChange('medications', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <div className="text-gray-900">
                    {patient.medications || 'No current medications'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chronic Conditions
                </label>
                {isEditing ? (
                  <textarea
                    value={editData.chronic_conditions || ''}
                    onChange={(e) => handleInputChange('chronic_conditions', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <div className="text-gray-900">
                    {patient.chronic_conditions || 'None recorded'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Insurance Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Insurance Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Provider
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.insurance_provider || ''}
                    onChange={(e) => handleInputChange('insurance_provider', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <div className="text-gray-900">
                    {patient.insurance_provider || 'Not provided'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.insurance_number || ''}
                    onChange={(e) => handleInputChange('insurance_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <div className="text-gray-900">
                    {patient.insurance_number || 'Not provided'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Medical History Timeline */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Medical History
            </h2>
            
            <div className="space-y-4">
              {medicalHistory.length === 0 ? (
                <div className="text-gray-500 text-center py-4">
                  No medical history recorded
                </div>
              ) : (
                medicalHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="border-l-2 border-blue-500 pl-4 py-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {entry.entry_type.charAt(0).toUpperCase() + 
                           entry.entry_type.slice(1)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(entry.date).toLocaleDateString()}
                        </div>
                      </div>
                      {entry.entry_type === 'visit' && (
                        <Calendar className="h-5 w-5 text-gray-400" />
                      )}
                      {entry.entry_type === 'prescription' && (
                        <FileText className="h-5 w-5 text-gray-400" />
                      )}
                      {entry.entry_type === 'lab_result' && (
                        <Activity className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-700">
                      {entry.description}
                    </div>
                    {entry.attachments && entry.attachments.length > 0 && (
                      <div className="mt-2 flex items-center space-x-2">
                        {entry.attachments.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View Attachment {index + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}