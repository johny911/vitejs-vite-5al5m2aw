// lib/supabase.ts
import { createClient, Session } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymfzsfkwsybbpezdjvni.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZnpzZmt3c3liYnBlemRqdm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTc5MjEsImV4cCI6MjA3Mjk3MzkyMX0.89KVKma7PS-2tK5GPqgDS3TyhsJykjEpPgIi9iM5JNI';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL or anon key is not set. Please update it in lib/supabase.ts'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true, // 🔑 automatically refreshes expired tokens
    persistSession: true,   // 🔑 saves session to localStorage for reloads
    detectSessionInUrl: true, // 🔑 restores session from redirect URLs
  },
});

/**
 * Ensure a valid session exists before rendering the app.
 * Called on startup in AuthProvider.
 */
export async function ensureSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('[Supabase] Error restoring session:', error.message);
    return null;
  }
  return data.session ?? null;
}