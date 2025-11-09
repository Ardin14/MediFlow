import { useState, useEffect } from "react";
import Layout from "@/react-app/components/Layout";
import ScheduleAppointmentModal from "@/react-app/components/ScheduleAppointmentModal";
import { Plus, Calendar, Clock, User } from "lucide-react";
import { supabase } from "@/react-app/lib/supabaseClient";

export default function Appointments() {
  const [clinicUser, setClinicUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const fetchData = async () => {
    try {
      // Load current user and clinic user
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      let clinicUserRow: any = null;
      if (userId) {
        const { data } = await supabase
          .from('clinic_users')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        clinicUserRow = data;
        setClinicUser(data);
      }

      if (!clinicUserRow?.clinic_id) {
        setAppointments([]);
        return;
      }

      // Base query for appointments in this clinic
      let apptQuery = supabase
        .from('appointments')
        .select('*')
        .eq('clinic_id', clinicUserRow.clinic_id)
        .order('appointment_date', { ascending: false });

      // If doctor, limit to own appointments when possible
      if (clinicUserRow.role === 'doctor') {
        apptQuery = apptQuery.eq('doctor_id', clinicUserRow.id);
      }

      const { data: appts, error: apptErr } = await apptQuery;
      if (apptErr) throw apptErr;

      const list = appts || [];

      // Enrich with names (patient, doctor)
      const patientIds = Array.from(new Set(list.map((a: any) => a.patient_id).filter(Boolean)));
      const doctorIds = Array.from(new Set(list.map((a: any) => a.doctor_id).filter(Boolean)));

      const [patientsRes, doctorsRes] = await Promise.all([
        patientIds.length
          ? supabase.from('patients').select('id, full_name').in('id', patientIds)
          : Promise.resolve({ data: [] } as any),
        doctorIds.length
          ? supabase.from('clinic_users').select('id, full_name').in('id', doctorIds)
          : Promise.resolve({ data: [] } as any),
      ]);

      const patientsMap = new Map((patientsRes.data || []).map((p: any) => [p.id, p.full_name]));
      const doctorsMap = new Map((doctorsRes.data || []).map((d: any) => [d.id, d.full_name]));

      const withNames = list.map((a: any) => ({
        ...a,
        patient_name: patientsMap.get(a.patient_id) || 'Unknown',
        doctor_name: doctorsMap.get(a.doctor_id) || '—',
      }));

      setAppointments(withNames);
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

  const allowedStatusRoles = ["admin", "receptionist", "nurse", "doctor"] as const;
  const statuses = ["booked", "checked_in", "completed", "cancelled"] as const;

  const updateStatus = async (id: number, status: string) => {
    try {
      if (!clinicUser?.clinic_id) return;
      await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id)
        .eq('clinic_id', clinicUser.clinic_id);
      fetchData();
    } catch (err) {
      console.error("Failed to update status", err);
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          {(clinicUser?.role === "admin" || clinicUser?.role === "receptionist" || clinicUser?.role === "nurse") && (
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
                      {clinicUser && allowedStatusRoles.includes(clinicUser.role) ? (
                        <select
                          className="px-2 py-1 rounded-full text-xs font-medium border border-gray-300 bg-white"
                          value={appointment.status}
                          onChange={(e) => updateStatus(appointment.id, e.target.value)}
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>
                              {s.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status.replace("_", " ")}
                        </span>
                      )}
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
          clinicId={clinicUser?.clinic_id}
        />
      </div>
    </Layout>
  );
}
