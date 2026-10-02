import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] CRITICAL: Environment variables are missing. ' +
    'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. ' +
    'In a Capacitor build, these must be baked into the JS bundle at build time via the .env file.'
  );
}

if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('[Supabase] URL must use HTTPS scheme. Got:', supabaseUrl);
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'lakshmi-studio-app',
      },
    },
  }
);
