import { createClient } from '@supabase/supabase-js';

// Dalla dashboard Supabase: Project Settings > API.
// La chiave anon è pubblica per definizione: la protezione dei dati è data da RLS.
const SUPABASE_URL = 'https://sryaialdzyrxirzgjtsu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyeWFpYWxkenlyeGlyemdqdHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ5MzY3MjEsImV4cCI6MjExMDUxMjcyMX0.3TcZTl_76yjC0IxYCGQ8RNfTnGcCKvFuhsx1X3AwR4I';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  // Non usiamo Supabase Auth: niente sessioni da salvare o rinnovare.
  auth: { persistSession: false, autoRefreshToken: false },
});
