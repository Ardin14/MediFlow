import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useAuth } from '@/react-app/contexts/AuthContext';
import { supabase } from './lib/supabaseClient';

// Page imports
import DashboardPage from "./pages/Dashboard";
import PatientsPage from "./pages/Patients";
import PatientProfilePage from "./pages/PatientProfile";
import AppointmentsPage from "./pages/Appointments";
import ConsultationPage from "./pages/Consultation";
import BillingPage from "./pages/Billing";
import ReportsPage from "./pages/Reports";
import ProtectedRoute from "./components/ProtectedRoute";
import SetupPage from "./pages/Setup";
import SetupExistingGuard from "./components/SetupExistingGuard";

export default function App() {
  const { session } = useAuth();

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            !session ? (
              <div className="flex min-h-screen items-center justify-center">
                <Auth
                  supabaseClient={supabase}
                  appearance={{ theme: ThemeSupa }}
                  providers={['google']}
                  redirectTo={`${window.location.origin}/dashboard`}
                />
              </div>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

                <Route
          path="/setup"
          element={
            session ? (
              <SetupExistingGuard>
                <SetupPage session={session} />
              </SetupExistingGuard>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <PatientsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patients/:id"
          element={
            <ProtectedRoute>
              <PatientProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <AppointmentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/consultation"
          element={
            <ProtectedRoute>
              <ConsultationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <BillingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
