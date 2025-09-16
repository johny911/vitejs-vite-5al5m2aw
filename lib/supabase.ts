import { createClient } from '@supabase/supabase-js';

// IMPORTANT: These are the credentials you provided.
const supabaseUrl = 'https://ymfzsfkwsybbpezdjvni.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZnpzZmt3c3liYnBlemRqdm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTc5MjEsImV4cCI6MjA3Mjk3MzkyMX0.89KVKma7PS-2tK5GPqgDS3TyhsJykjEpPgIi9iM5JNI';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or anon key is not set. Please update it in lib/supabase.ts");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
