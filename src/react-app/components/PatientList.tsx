import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Download, Trash2, X,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import type { 
  EnhancedPatient, 
  PatientSearchParams, 
  Gender,
  BloodType
} from '../../shared/patient-types';

interface PatientListProps {
  clinicId: number;
}

export default function PatientList({ clinicId }: PatientListProps) {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<EnhancedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatients, setSelectedPatients] = useState<number[]>([]);
  
  // Search and filter state
  const [searchParams, setSearchParams] = useState<PatientSearchParams>({
    page: 1,
    pageSize: 20,
    sortBy: 'name',
    sortOrder: 'asc'
  });
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [totalPatients, setTotalPatients] = useState(0);
  const [filterCount, setFilterCount] = useState(0);

  useEffect(() => {
    fetchPatients();
  }, [searchParams, clinicId]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('patients')
        .select('*', { count: 'exact' })
        .eq('clinic_id', clinicId);

      // Apply search
      if (searchParams.search) {
        query = query.or(
          `full_name.ilike.%${searchParams.search}%,` +
          `email.ilike.%${searchParams.search}%,` +
          `phone.ilike.%${searchParams.search}%`
        );
      }

      // Apply filters
      if (searchParams.gender) {
        query = query.eq('gender', searchParams.gender);
      }
      if (searchParams.bloodType) {
        query = query.eq('blood_type', searchParams.bloodType);
      }
      if (searchParams.hasInsurance !== undefined) {
        query = searchParams.hasInsurance
          ? query.not('insurance_number', 'is', null)
          : query.is('insurance_number', null);
      }
      if (searchParams.lastVisitRange?.from) {
        query = query.gte('last_visit_date', searchParams.lastVisitRange.from);
      }
      if (searchParams.lastVisitRange?.to) {
        query = query.lte('last_visit_date', searchParams.lastVisitRange.to);
      }

      // Apply sorting
      if (searchParams.sortBy) {
        query = query.order(searchParams.sortBy, {
          ascending: searchParams.sortOrder === 'asc'
        });
      }

      // Apply pagination
      const from = (searchParams.page - 1) * searchParams.pageSize;
      const to = from + searchParams.pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setPatients(data || []);
      setTotalPatients(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchParams(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilter = (filters: Partial<PatientSearchParams>) => {
    setSearchParams(prev => ({ ...prev, ...filters, page: 1 }));
    setShowFilters(false);
    
    // Count active filters
    setFilterCount(
      Object.values(filters).filter(v => v !== undefined && v !== null).length
    );
  };

  const handleSort = (sortBy: PatientSearchParams['sortBy']) => {
    setSearchParams(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleBulkOperation = async (operation: 'delete' | 'export') => {
    if (!selectedPatients.length) return;

    if (operation === 'delete') {
      if (!confirm('Are you sure you want to delete the selected patients?')) return;

      try {
        const { error } = await supabase
          .from('patients')
          .delete()
          .in('id', selectedPatients)
          .eq('clinic_id', clinicId);

        if (error) throw error;
        
        fetchPatients();
        setSelectedPatients([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete patients');
      }
    } else if (operation === 'export') {
      // Filter patients to export
      const patientsToExport = patients.filter(p => 
        selectedPatients.includes(p.id)
      );

      // Create CSV content
      const headers = [
        'Full Name', 'Gender', 'Date of Birth', 'Phone', 'Email',
        'Blood Type', 'Allergies', 'Insurance Provider', 'Insurance Number'
      ];
      
      const csvContent = [
        headers.join(','),
        ...patientsToExport.map(p => [
          p.full_name,
          p.gender || '',
          p.date_of_birth || '',
          p.phone || '',
          p.email || '',
          p.blood_type || '',
          p.allergies || '',
          p.insurance_provider || '',
          p.insurance_number || ''
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `patients_export_${new Date().toISOString()}.csv`;
      link.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and filters header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search patients..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchParams.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="h-5 w-5 mr-2" />
            Filters
            {filterCount > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-sm">
                {filterCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {selectedPatients.length > 0 && (
            <>
              <button
                onClick={() => handleBulkOperation('export')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download className="h-5 w-5 mr-2" />
                Export
              </button>
              <button
                onClick={() => handleBulkOperation('delete')}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Patients table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedPatients.length === patients.length}
                    onChange={(e) => {
                      setSelectedPatients(
                        e.target.checked ? patients.map(p => p.id) : []
                      );
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th 
                  onClick={() => handleSort('name')}
                  className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  Name
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date of Birth
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Visit
                </th>
                <th className="px-6 py-3 bg-gray-50"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Loading patients...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No patients found
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedPatients.includes(patient.id)}
                        onChange={(e) => {
                          setSelectedPatients(prev =>
                            e.target.checked
                              ? [...prev, patient.id]
                              : prev.filter(id => id !== patient.id)
                          );
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {patient.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {patient.gender || 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {patient.phone || 'No phone'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {patient.email || 'No email'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.date_of_birth
                        ? new Date(patient.date_of_birth).toLocaleDateString()
                        : 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.last_visit_date
                        ? new Date(patient.last_visit_date).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setSearchParams(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={searchParams.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setSearchParams(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={searchParams.page * searchParams.pageSize >= totalPatients}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {(searchParams.page - 1) * searchParams.pageSize + 1}
                </span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(searchParams.page * searchParams.pageSize, totalPatients)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{totalPatients}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setSearchParams(prev => ({ ...prev, page: 1 }))}
                  disabled={searchParams.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">First</span>
                  <ChevronLeft className="h-5 w-5" />
                  <ChevronLeft className="h-5 w-5 -ml-2" />
                </button>
                <button
                  onClick={() => setSearchParams(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={searchParams.page === 1}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSearchParams(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={searchParams.page * searchParams.pageSize >= totalPatients}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSearchParams(prev => ({ 
                    ...prev, 
                    page: Math.ceil(totalPatients / searchParams.pageSize)
                  }))}
                  disabled={searchParams.page * searchParams.pageSize >= totalPatients}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Last</span>
                  <ChevronRight className="h-5 w-5" />
                  <ChevronRight className="h-5 w-5 -ml-2" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Filter dialog */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium">Filter Patients</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  value={searchParams.gender || ''}
                  onChange={(e) => handleFilter({ 
                    gender: e.target.value as Gender || undefined 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Any</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blood Type
                </label>
                <select
                  value={searchParams.bloodType || ''}
                  onChange={(e) => handleFilter({ 
                    bloodType: e.target.value as BloodType || undefined 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Any</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Status
                </label>
                <select
                  value={searchParams.hasInsurance === undefined ? '' : searchParams.hasInsurance.toString()}
                  onChange={(e) => handleFilter({ 
                    hasInsurance: e.target.value === '' ? undefined : e.target.value === 'true'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Any</option>
                  <option value="true">Has Insurance</option>
                  <option value="false">No Insurance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Visit Date Range
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={searchParams.lastVisitRange?.from || ''}
                    onChange={(e) => handleFilter({
                      lastVisitRange: {
                        ...searchParams.lastVisitRange,
                        from: e.target.value || undefined
                      }
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="date"
                    value={searchParams.lastVisitRange?.to || ''}
                    onChange={(e) => handleFilter({
                      lastVisitRange: {
                        ...searchParams.lastVisitRange,
                        to: e.target.value || undefined
                      }
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-4 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => {
                  handleFilter({
                    gender: undefined,
                    bloodType: undefined,
                    hasInsurance: undefined,
                    lastVisitRange: undefined
                  });
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Reset Filters
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="ml-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}