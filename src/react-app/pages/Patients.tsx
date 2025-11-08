import { useState, useEffect } from "react";
import Layout from "@/react-app/components/Layout";
import AddPatientModal from "@/react-app/components/AddPatientModal";
import TransferPatientsModal from "@/react-app/components/TransferPatientsModal";
import { Plus, Search, Edit, Trash2, Move } from "lucide-react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { supabase } from "@/react-app/lib/supabaseClient";

export default function Patients() {
  const { clinicUser } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState<number[]>([]);

  const fetchData = async () => {
    try {
      if (!clinicUser?.clinic_id) {
        setPatients([]);
        return;
      }

      // Fetch patients directly from Supabase for dev/local without API proxy
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicUser.clinic_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching patients from Supabase:", error);
        setPatients([]);
      } else {
        setPatients(data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Re-run when clinic changes becomes available
  }, [clinicUser?.clinic_id]);

  const handlePatientAdded = () => {
    // Refresh the patients list
    fetchData();
  };

  const handleTransferComplete = () => {
    // Refresh the patients list and clear selection
    fetchData();
    setSelectedPatients([]);
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const togglePatientSelection = (patientId: number) => {
    setSelectedPatients((prev) =>
      prev.includes(patientId)
        ? prev.filter((id) => id !== patientId)
        : [...prev, patientId]
    );
  };

  const toggleAllPatients = () => {
    if (selectedPatients.length === filteredPatients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(filteredPatients.map((p) => p.id));
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

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Patients</h1>
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>
          
          <div className="flex gap-3">
            {selectedPatients.length > 0 && (
              <button
                onClick={() => setShowTransferModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                <Move className="w-4 h-4 mr-2" />
                Transfer Selected
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Patient
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={
                          filteredPatients.length > 0 &&
                          selectedPatients.length === filteredPatients.length
                        }
                        onChange={toggleAllPatients}
                      />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date of Birth
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.map((patient: any) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={selectedPatients.includes(patient.id)}
                        onChange={() => togglePatientSelection(patient.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="font-medium text-gray-900">
                          {patient.full_name}
                        </div>
                        {patient.user_id && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Registered
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.phone}</div>
                      <div className="text-sm text-gray-500">{patient.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {patient.gender || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {typeof clinicUser?.clinic_id === 'number' && (
          <AddPatientModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onPatientAdded={handlePatientAdded}
            clinicId={clinicUser.clinic_id as number}
          />
        )}

        {showTransferModal && typeof clinicUser?.clinic_id === 'number' && (
          <TransferPatientsModal
            isOpen={showTransferModal}
            onClose={() => setShowTransferModal(false)}
            patientIds={selectedPatients}
            currentClinicId={clinicUser.clinic_id as number}
            onTransferComplete={handleTransferComplete}
          />
        )}
      </div>
    </Layout>
  );
}
