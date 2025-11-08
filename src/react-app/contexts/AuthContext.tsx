import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface ClinicUser {
  id: number;
  user_id: string;
  role: string;
  full_name: string;
  clinic_id: number;
  clinic_name?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  clinicUser: ClinicUser | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  clinicUser: null,
  signOut: async () => {},
  isLoading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [clinicUser, setClinicUser] = useState<ClinicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClinicUser = async (userId: string) => {
      console.log('Fetching clinic user for userId:', userId);
      try {
        // Only select columns that exist on clinic_users table.
        // Removed `email` and `phone` which caused Postgres 42703 errors.
        const { data: clinicUserData, error } = await supabase
          .from('clinic_users')
          .select(
            `id,user_id,role,full_name,clinic_id,clinic:clinics(id,name)`
          )
          .eq('user_id', userId)
          .maybeSingle();

        console.log('Clinic user query result:', { clinicUserData, error });

        if (error) {
          console.error('Supabase error fetching clinic_user:', {
            code: (error as any)?.code,
            message: (error as any)?.message,
            details: (error as any)?.details,
            hint: (error as any)?.hint,
          });
          throw error;
        }

        if (clinicUserData) {
          console.log('Setting clinic user:', clinicUserData);
          const clinic = Array.isArray((clinicUserData as any).clinic)
            ? (clinicUserData as any).clinic[0]
            : (clinicUserData as any).clinic;

          setClinicUser({
            id: (clinicUserData as any).id,
            user_id: (clinicUserData as any).user_id,
            role: (clinicUserData as any).role,
            full_name: (clinicUserData as any).full_name,
            clinic_id: (clinicUserData as any).clinic_id,
            clinic_name: clinic?.name,
          });
        } else {
          console.log('No clinic user found');
          setClinicUser(null);
        }
      } catch (error) {
        console.error('Error fetching clinic user:', error);
        setClinicUser(null);
      }
      setIsLoading(false);
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchClinicUser(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchClinicUser(session.user.id);
      } else {
        setClinicUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setClinicUser(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, clinicUser, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}