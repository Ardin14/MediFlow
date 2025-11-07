import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dfobufzzufnhbvctgiri.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmb2J1Znp6dWZuaGJ2Y3RnaXJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NzY3OTAsImV4cCI6MjA3ODA1Mjc5MH0.W-Oi0aiqFVEfzKNS1bfxX5eJbHFAQdB-hXoUdQXlla0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);