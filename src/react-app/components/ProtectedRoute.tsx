import { Navigate } from 'react-router-dom';
import { Loader2 } from "lucide-react";
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, clinicUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (!clinicUser) {
    return <Navigate to="/onboarding" replace />;
  }

  if (clinicUser && (clinicUser as any).status && (clinicUser as any).status !== 'active') {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
}
