import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
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

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
            <ProtectedRoute session={session}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/setup"
          element={
            session ? (
              <SetupPage session={session} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/patients"
          element={
            <ProtectedRoute session={session}>
              <PatientsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patients/:id"
          element={
            <ProtectedRoute session={session}>
              <PatientProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments"
          element={
            <ProtectedRoute session={session}>
              <AppointmentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/consultation"
          element={
            <ProtectedRoute session={session}>
              <ConsultationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/billing"
          element={
            <ProtectedRoute session={session}>
              <BillingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute session={session}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
