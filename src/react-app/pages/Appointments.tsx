import { useState, useEffect } from "react";
import Layout from "@/react-app/components/Layout";
import ScheduleAppointmentModal from "@/react-app/components/ScheduleAppointmentModal";
import { Plus, Calendar, Clock, User } from "lucide-react";
import { apiFetch } from "@/react-app/lib/api";

export default function Appointments() {
  const [clinicUser, setClinicUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const fetchData = async () => {
    try {
      const userData = await apiFetch<any>("/api/users/me");
      setClinicUser(userData.clinicUser);

      const appointmentsData = await apiFetch<any[]>("/api/appointments");
      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAppointmentScheduled = () => {
    // Refresh the appointments list
    fetchData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "checked_in":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (loading) {
    return (
      <Layout clinicUser={clinicUser}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout clinicUser={clinicUser}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          {(clinicUser?.role === "admin" || clinicUser?.role === "receptionist") && (
            <button 
              onClick={() => setShowScheduleModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Appointment
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            <div className="grid gap-4">
              {appointments.map((appointment: any) => (
                <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{appointment.patient_name}</h3>
                        <p className="text-sm text-gray-600">{appointment.reason || "General consultation"}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(appointment.appointment_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(appointment.appointment_date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {appointments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No appointments found
                </div>
              )}
            </div>
          </div>
        </div>

        <ScheduleAppointmentModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onAppointmentScheduled={handleAppointmentScheduled}
        />
      </div>
    </Layout>
  );
}
