import { useState, useEffect } from "react";
import { useParams } from "react-router";
import Layout from "@/react-app/components/Layout";
import { FileText, Pill, Save } from "lucide-react";
import { apiFetch } from "@/react-app/lib/api";

export default function Consultation() {
  const { appointmentId } = useParams();
  const [, setClinicUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await apiFetch<any>("/api/users/me");
        setClinicUser(userData.clinicUser);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Consultation</h1>
          <p className="text-gray-600">Appointment ID: {appointmentId}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <FileText className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Consultation Notes</h2>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnosis
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter diagnosis..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter consultation notes..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Consultation
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <Pill className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Prescriptions</h2>
            </div>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medicine Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter medicine name..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 500mg"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 7 days, twice daily"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="mt-3 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Prescription
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
