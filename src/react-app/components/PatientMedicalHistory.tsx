import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar, FileText, Clock, Filter } from 'lucide-react';

interface PatientMedicalHistoryProps {
  patientId: number;
  clinicId: number;
}

type RecordType = 'appointment' | 'prescription' | 'visit' | 'all';

interface MedicalRecord {
  id: number;
  type: RecordType;
  date: string;
  title: string;
  description: string;
  status?: string;
}

export default function PatientMedicalHistory({ patientId, clinicId }: PatientMedicalHistoryProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [filterType, setFilterType] = useState<RecordType>('all');
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

  useEffect(() => {
    fetchMedicalHistory();
  }, [patientId, filterType, dateRange]);

  const fetchMedicalHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch appointments
      const appointmentsPromise = supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          reason,
          status,
          doctor:clinic_users!doctor_id(full_name)
        `)
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .order('appointment_date', { ascending: false });

      // Fetch prescriptions with visits
      const prescriptionsPromise = supabase
        .from('prescriptions')
        .select(`
          id,
          created_at,
          medicine_name,
          dosage,
          duration,
          visit:visits(diagnosis)
        `)
        .eq('clinic_id', clinicId)
        .eq('visit.patient_id', patientId)
        .order('created_at', { ascending: false });

      // Fetch visits
      const visitsPromise = supabase
        .from('visits')
        .select(`
          id,
          created_at,
          diagnosis,
          notes,
          doctor:clinic_users(full_name)
        `)
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      const [
        { data: appointments, error: appointmentsError },
        { data: prescriptions, error: prescriptionsError },
        { data: visits, error: visitsError }
      ] = await Promise.all([
        appointmentsPromise,
        prescriptionsPromise,
        visitsPromise
      ]);

      if (appointmentsError) throw appointmentsError;
      if (prescriptionsError) throw prescriptionsError;
      if (visitsError) throw visitsError;

      // Convert to unified format
      const allRecords: MedicalRecord[] = [
        ...(appointments?.map(a => ({
          id: a.id,
          type: 'appointment' as RecordType,
          date: a.appointment_date,
          // Supabase may return foreign rows as arrays; guard accordingly
          title: `Appointment with Dr. ${a.doctor?.[0]?.full_name || 'Unknown'}`,
          description: a.reason || 'No reason provided',
          status: a.status
        })) || []),
        ...(prescriptions?.map(p => ({
          id: p.id,
          type: 'prescription' as RecordType,
          date: p.created_at,
          title: p.medicine_name,
          description: `Dosage: ${p.dosage || 'Not specified'}, Duration: ${p.duration || 'Not specified'}`,
          status: 'prescribed'
        })) || []),
        ...(visits?.map(v => ({
          id: v.id,
          type: 'visit' as RecordType,
          date: v.created_at,
          title: `Consultation with Dr. ${v.doctor?.[0]?.full_name || 'Unknown'}`,
          description: v.diagnosis || 'No diagnosis recorded',
          status: 'completed'
        })) || [])
      ];

      // Apply filters
      let filteredRecords = allRecords;
      
      if (filterType !== 'all') {
        filteredRecords = filteredRecords.filter(r => r.type === filterType);
      }

      if (dateRange.from) {
        filteredRecords = filteredRecords.filter(r => 
          new Date(r.date) >= new Date(dateRange.from!)
        );
      }

      if (dateRange.to) {
        filteredRecords = filteredRecords.filter(r => 
          new Date(r.date) <= new Date(dateRange.to!)
        );
      }

      // Sort by date
      filteredRecords.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setRecords(filteredRecords);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch medical history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'booked':
        return 'bg-blue-100 text-blue-800';
      case 'prescribed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIcon = (type: RecordType) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'prescription':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'visit':
        return <Clock className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center space-x-4 pb-4 border-b">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as RecordType)}
            className="border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Records</option>
            <option value="appointment">Appointments</option>
            <option value="prescription">Prescriptions</option>
            <option value="visit">Visits</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={dateRange.from || ''}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            className="border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.to || ''}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            className="border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Records Timeline */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-4 text-gray-500">Loading medical history...</div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">{error}</div>
        ) : records.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No medical records found</div>
        ) : (
          records.map((record) => (
            <div
              key={`${record.type}-${record.id}`}
              className="flex items-start space-x-4 p-4 bg-white rounded-lg border border-gray-200"
            >
              <div className="flex-shrink-0">
                {getIcon(record.type)}
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">
                    {record.title}
                  </h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(record.status)}`}>
                    {record.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {record.description}
                </p>
                <time className="mt-2 text-xs text-gray-500">
                  {new Date(record.date).toLocaleString()}
                </time>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}