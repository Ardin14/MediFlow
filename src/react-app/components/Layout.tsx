import { useState } from "react";
import { useAuth } from "@getmocha/users-service/react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  Stethoscope,
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  BarChart3,
  Menu,
  X,
  LogOut,
  User,
  Building2,
  Shield
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  clinicUser?: any;
}

export default function Layout({ children, clinicUser }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "receptionist", "doctor", "patient"]
    },
    {
      name: "Patients",
      href: "/patients",
      icon: Users,
      roles: ["admin", "receptionist", "doctor"]
    },
    {
      name: "Appointments",
      href: "/appointments",
      icon: Calendar,
      roles: ["admin", "receptionist", "doctor", "patient"]
    },
    {
      name: "Billing",
      href: "/billing",
      icon: CreditCard,
      roles: ["admin", "receptionist"]
    },
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart3,
      roles: ["admin"]
    }
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(clinicUser?.role || "patient")
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-900">MediFlow</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Clinic Info */}
        {clinicUser?.clinic_name && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center text-sm">
              <Building2 className="w-4 h-4 text-blue-600 mr-2" />
              <div>
                <p className="font-medium text-blue-900">{clinicUser.clinic_name}</p>
                <p className="text-blue-700 text-xs">Your clinic workspace</p>
              </div>
            </div>
          </div>
        )}

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${
                    isActive ? "text-blue-700" : "text-gray-400"
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Security Notice */}
        <div className="absolute bottom-4 left-3 right-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start">
              <Shield className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-green-900">Secure Access</p>
                <p className="text-xs text-green-700 mt-1">
                  Data is isolated to your clinic only
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-6 h-6 text-gray-500" />
            </button>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {clinicUser?.full_name || user?.google_user_data?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {clinicUser?.role || "Patient"} 
                    {clinicUser?.clinic_name && (
                      <span className="text-blue-600"> • {clinicUser.clinic_name}</span>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
