import { useAuth } from "@getmocha/users-service/react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isPending } = useAuth();
  const [clinicUser, setClinicUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkClinicUser = async () => {
      if (user) {
        try {
          const response = await fetch("/api/users/me");
          const data = await response.json();
          setClinicUser(data.clinicUser);
        } catch (error) {
          console.error("Error fetching clinic user:", error);
        }
      }
      setIsLoading(false);
    };

    if (!isPending) {
      checkClinicUser();
    }
  }, [user, isPending]);

  if (isPending || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!clinicUser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
