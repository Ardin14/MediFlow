import { createClient } from '@supabase/supabase-js';

// Production / local configuration should supply these via Vite env vars:
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Do NOT hardcode service_role keys.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail early with a helpful error during development/build so envs are added.
  console.error('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. See .env.local or your hosting env vars.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
