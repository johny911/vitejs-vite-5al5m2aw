import { createClient, Session } from '@supabase/supabase-js';

// --- Your Supabase project credentials ---
const supabaseUrl = 'https://ymfzsfkwsybbpezdjvni.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZnpzZmt3c3liYnBlemRqdm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTc5MjEsImV4cCI6MjA3Mjk3MzkyMX0.89KVKma7PS-2tK5GPqgDS3TyhsJykjEpPgIi9iM5JNI';

// Safety check (never commit undefined creds)
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or anon key is not set. Please update supabaseClient.ts');
}

// --- Supabase client ---
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,     // refresh JWTs in background
    persistSession: true,       // save session to localStorage
    detectSessionInUrl: true,   // restore after email login links
  },
});

// --- Helper: ensure a session is restored at boot ---
export async function ensureSession(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[Supabase] getSession error:', error.message);
      return null;
    }
    return data.session ?? null;
  } catch (err) {
    console.error('[Supabase] ensureSession failed:', err);
    return null;
  }
}