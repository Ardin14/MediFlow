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
  status?: 'active' | 'inactive' | 'pending';
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

// eslint-disable-next-line react-refresh/only-export-components
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
        const selectCols = `id,user_id,role,full_name,status,clinic_id,clinic:clinics(id,name)`;

        // 1) Try by user_id first
        const { data: byUser, error: byUserErr } = await supabase
          .from('clinic_users')
          .select(selectCols)
          .eq('user_id', userId)
          .maybeSingle();

        if (byUserErr) {
          console.error('Supabase error fetching clinic_user by user_id:', byUserErr);
        }

        let row: any = byUser ?? null;

        // 2) If not found, try by email (pre-provisioned staff)
        if (!row) {
          const { data: sessionData } = await supabase.auth.getSession();
          const email = sessionData.session?.user?.email || '';
          if (email) {
            const { data: byEmail, error: byEmailErr } = await supabase
              .from('clinic_users')
              .select(selectCols + ',email')
              .eq('email', email)
              .maybeSingle();

            if (byEmailErr) {
              console.error('Supabase error fetching clinic_user by email:', byEmailErr);
            }

            if (byEmail) {
              // Attempt to claim this row by setting user_id
              if (!(byEmail as any).user_id) {
                const { error: claimErr } = await supabase
                  .from('clinic_users')
                  .update({ user_id: userId })
                  .eq('id', (byEmail as any).id);
                if (claimErr) {
                  console.error('Error claiming pre-provisioned clinic_user:', claimErr);
                } else {
                  // Re-fetch by user_id to get joined clinic alias consistency
                  const { data: re } = await supabase
                    .from('clinic_users')
                    .select(selectCols)
                    .eq('user_id', userId)
                    .maybeSingle();
                  row = re ?? byEmail;
                }
              } else {
                row = byEmail;
              }
            }
          }
        }

        if (row) {
          console.log('Setting clinic user:', row);
          const clinic = Array.isArray((row as any).clinic)
            ? (row as any).clinic[0]
            : (row as any).clinic;

          setClinicUser({
            id: (row as any).id,
            user_id: (row as any).user_id,
            role: (row as any).role,
            full_name: (row as any).full_name,
            clinic_id: (row as any).clinic_id,
            clinic_name: clinic?.name,
            status: (row as any).status,
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