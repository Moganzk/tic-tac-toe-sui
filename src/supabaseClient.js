import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nqkrbtnuudfjqnybpkpb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xa3JidG51dWRmanFueWJwa3BiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MTgxNTgsImV4cCI6MjA2MzQ5NDE1OH0.Vks91esWDBMGd05tj2vDJmIcOFIVyMcc9XrcVyPU9LY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
