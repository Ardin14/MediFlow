import { Session } from '@supabase/supabase-js';
import { Navigate } from 'react-router-dom';
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from '../lib/supabaseClient';

interface ProtectedRouteProps {
  children: React.ReactNode;
  session: Session | null;
}

export default function ProtectedRoute({ children, session }: ProtectedRouteProps) {
  const [clinicUser, setClinicUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkClinicUser = async () => {
      if (session?.user) {
        try {
          const { data, error } = await supabase
            .from('clinic_users')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();

          // maybeSingle() returns `null` for zero rows instead of throwing.
          if (error) throw error;
          setClinicUser(data ?? null);
        } catch (error) {
          console.error('Error fetching clinic user:', error);
        }
      }
      setIsLoading(false);
    };

    checkClinicUser();
  }, [session]);

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
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
}
