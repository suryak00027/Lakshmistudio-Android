import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] CRITICAL: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. ' +
    'The production build cannot function without these. ' +
    'Ensure .env contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before building.'
  );
}

if (!supabaseUrl.startsWith('https://')) {
  throw new Error(`[Supabase] URL must use HTTPS scheme. Got: ${supabaseUrl}`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'lakshmi-studio-app',
    },
  },
});
