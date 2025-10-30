import { useAuth } from "@getmocha/users-service/react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { 
  Stethoscope, 
  Calendar, 
  Users, 
  FileText, 
  Shield, 
  Clock,
  Loader2,
  Building2 
} from "lucide-react";

export default function Home() {
  const { user, isPending, redirectToLogin, fetchUser } = useAuth();
  const [clinicUser, setClinicUser] = useState<any>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [clinics, setClinics] = useState<any[]>([]);
  const [registrationData, setRegistrationData] = useState({
    role: 'patient',
    clinic_id: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkClinicUser = async () => {
      if (user) {
        setIsCheckingUser(true);
        try {
          const response = await fetch("/api/users/me");
          const data = await response.json();
          if (data.clinicUser) {
            setClinicUser(data.clinicUser);
          } else {
            setShowRegistration(true);
            // Fetch available clinics
            const clinicsResponse = await fetch("/api/clinics");
            const clinicsData = await clinicsResponse.json();
            setClinics(clinicsData);
            if (clinicsData.length > 0) {
              setRegistrationData(prev => ({ ...prev, clinic_id: clinicsData[0].id.toString() }));
            }
          }
        } catch (error) {
          console.error("Error fetching clinic user:", error);
        }
        setIsCheckingUser(false);
      }
    };

    if (!isPending && user) {
      checkClinicUser();
    }
  }, [user, isPending]);

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationData.clinic_id) {
      alert("Please select a clinic");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/clinic-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...registrationData,
          clinic_id: parseInt(registrationData.clinic_id)
        }),
      });

      if (response.ok) {
        // Refresh user data
        await fetchUser();
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isPending || isCheckingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (user && clinicUser) {
    return <Navigate to="/dashboard" replace />;
  }

  if (user && showRegistration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Complete Registration</h2>
            <p className="text-gray-600 mt-2">Set up your clinic account</p>
          </div>

          <form onSubmit={handleRegistration} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                Select Clinic
              </label>
              <select
                value={registrationData.clinic_id}
                onChange={(e) => setRegistrationData({ ...registrationData, clinic_id: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a clinic...</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                    {clinic.address && ` - ${clinic.address}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={registrationData.role}
                onChange={(e) => setRegistrationData({ ...registrationData, role: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="receptionist">Receptionist</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={registrationData.phone}
                onChange={(e) => setRegistrationData({ ...registrationData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your phone number"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? "Registering..." : "Complete Registration"}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Important:</h4>
            <p className="text-xs text-blue-800">
              By registering with a clinic, you'll only have access to data and patients within that specific clinic. 
              This ensures patient privacy and data security across different healthcare facilities.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">MediFlow</span>
            </div>
            <button
              onClick={redirectToLogin}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Secure Multi-Clinic
            <span className="text-blue-600 block">Management System</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Streamline your healthcare practice with our comprehensive platform for patient management, 
            appointments, consultations, and billing. Each clinic's data is completely isolated for maximum security.
          </p>
          <button
            onClick={redirectToLogin}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg shadow-lg hover:shadow-xl"
          >
            Get Started Today
          </button>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Patient Management</h3>
            <p className="text-gray-600">
              Register and manage patient records, medical history, and personal information in one secure place.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Appointment Scheduling</h3>
            <p className="text-gray-600">
              Book, manage, and track appointments with an intuitive calendar interface and automated reminders.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Digital Consultations</h3>
            <p className="text-gray-600">
              Record consultation notes, diagnoses, and prescriptions digitally for better care coordination.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Multi-Clinic Security</h3>
            <p className="text-gray-600">
              Complete data isolation between clinics with role-based access controls for maximum patient privacy and security.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Billing & Invoicing</h3>
            <p className="text-gray-600">
              Generate invoices, track payments, and manage clinic finances with integrated billing features.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Multi-Clinic Support</h3>
            <p className="text-gray-600">
              Support for multiple independent clinics with separate patient databases and complete data isolation.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-blue-100 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 MediFlow. Built for modern healthcare practices with enterprise-grade security.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
