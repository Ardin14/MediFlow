import { useEffect, useState } from "react";
import { useAuth } from "@getmocha/users-service/react";
import Layout from "@/react-app/components/Layout";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingInvoices: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [clinicUser, setClinicUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todayAppointments: 0,
    pendingInvoices: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get clinic user info
        const userResponse = await fetch("/api/users/me");
        const userData = await userResponse.json();
        setClinicUser(userData.clinicUser);

        // Get dashboard stats
        const statsResponse = await fetch("/api/dashboard/stats");
        const statsData = await statsResponse.json();
        setStats(statsData);

        // Get recent appointments
        const appointmentsResponse = await fetch("/api/appointments");
        const appointmentsData = await appointmentsResponse.json();
        setRecentAppointments(appointmentsData.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "checked_in":
        return <Activity className="w-4 h-4 text-blue-500" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getRoleSpecificCards = () => {
    const role = clinicUser?.role;
    
    if (role === "admin" || role === "receptionist") {
      return [
        {
          title: "Total Patients",
          value: stats.totalPatients,
          icon: Users,
          color: "bg-blue-500",
          change: ""
        },
        {
          title: "Today's Appointments",
          value: stats.todayAppointments,
          icon: Calendar,
          color: "bg-green-500",
          change: ""
        },
        {
          title: "Pending Invoices",
          value: stats.pendingInvoices,
          icon: DollarSign,
          color: "bg-yellow-500",
          change: ""
        },
        {
          title: "Revenue This Month",
          value: "$0",
          icon: TrendingUp,
          color: "bg-purple-500",
          change: ""
        }
      ];
    } else if (role === "doctor") {
      return [
        {
          title: "Today's Appointments",
          value: stats.todayAppointments,
          icon: Calendar,
          color: "bg-blue-500",
          change: ""
        },
        {
          title: "Patients This Week",
          value: "0",
          icon: Users,
          color: "bg-green-500",
          change: ""
        },
        {
          title: "Consultations Today",
          value: "0",
          icon: Activity,
          color: "bg-purple-500",
          change: ""
        }
      ];
    } else {
      return [
        {
          title: "Upcoming Appointments",
          value: "0",
          icon: Calendar,
          color: "bg-blue-500",
          change: ""
        },
        {
          title: "Medical Records",
          value: "0",
          icon: Activity,
          color: "bg-green-500",
          change: ""
        },
        {
          title: "Prescriptions",
          value: "0",
          icon: DollarSign,
          color: "bg-purple-500",
          change: ""
        }
      ];
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {getGreeting()}, {clinicUser?.full_name || user?.google_user_data?.name}!
          </h1>
          <p className="text-gray-600 mt-1">
            {clinicUser?.role === "patient" 
              ? "Here's your health overview and upcoming appointments."
              : "Here's what's happening in your clinic today."
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getRoleSpecificCards().map((card, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  {card.change && (
                    <p className="text-sm text-green-600 mt-1">{card.change} from last month</p>
                  )}
                </div>
                <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Appointments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Recent Appointments</h3>
            </div>
            <div className="p-6">
              {recentAppointments.length > 0 ? (
                <div className="space-y-4">
                  {recentAppointments.map((appointment: any) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{appointment.patient_name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(appointment.appointment_date).toLocaleDateString()} at{" "}
                          {new Date(appointment.appointment_date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(appointment.status)}
                        <span className="text-sm text-gray-600 capitalize">{appointment.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent appointments</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {(clinicUser?.role === "admin" || clinicUser?.role === "receptionist") && (
                  <>
                    <a
                      href="/patients"
                      className="flex items-center p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Users className="w-5 h-5 mr-3" />
                      Register New Patient
                    </a>
                    <a
                      href="/appointments"
                      className="flex items-center p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <Calendar className="w-5 h-5 mr-3" />
                      Schedule Appointment
                    </a>
                  </>
                )}
                {clinicUser?.role === "doctor" && (
                  <a
                    href="/appointments"
                    className="flex items-center p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <Activity className="w-5 h-5 mr-3" />
                    View Today's Appointments
                  </a>
                )}
                {clinicUser?.role === "patient" && (
                  <a
                    href="/appointments"
                    className="flex items-center p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Calendar className="w-5 h-5 mr-3" />
                    Book Appointment
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
