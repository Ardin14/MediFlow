import { createClient } from '@supabase/supabase-js';

// Read from Vite env (set these in Vercel: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Surface a clear error during build/runtime if envs are missing
  // Avoid throwing hard errors that blank the screen; log and create a dummy client to keep app booting
  // but most API calls will fail until envs are set correctly.
  // eslint-disable-next-line no-console
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
