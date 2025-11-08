import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from "lucide-react";

interface SetupExistingGuardProps {
  children: React.ReactNode;
}

export default function SetupExistingGuard({ children }: SetupExistingGuardProps) {
  const { clinicUser, isLoading } = useAuth();

  // Show loading state while checking user status
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If user already has a clinic setup, redirect to dashboard
  if (clinicUser) {
    return <Navigate to="/dashboard" replace />;
  }

  // Otherwise, show the setup page
  return <>{children}</>;
}