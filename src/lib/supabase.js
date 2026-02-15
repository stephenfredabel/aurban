import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Returns true when both Supabase env vars are set.
 * Every service file checks this before attempting a Supabase call;
 * when false the app falls back to mock / api.js data.
 */
export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Singleton Supabase client.
 * `null` when env vars are missing — callers must guard with isSupabaseConfigured().
 */
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: sessionStorage,          // clears on tab close (matches existing security model)
        storageKey: 'aurban_sb_session',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,          // handles OAuth redirects
      },
    })
  : null;
