import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Read Supabase credentials from environment variables only (never hardcode)
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
const missingSupabaseEnv = [];

if (!supabaseUrl) missingSupabaseEnv.push('VITE_SUPABASE_URL');
if (!supabaseAnonKey) missingSupabaseEnv.push('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = missingSupabaseEnv.length === 0;
export const supabaseConfigErrorMessage = isSupabaseConfigured
    ? ''
    : `Missing Supabase configuration: ${missingSupabaseEnv.join(', ')}. Set them in .env for local development or in Vercel Project Settings -> Environment Variables for deployments, then rebuild/redeploy.`;

const createMissingConfigClient = (): SupabaseClient => {
    const throwMissingConfigError = () => {
        throw new Error(supabaseConfigErrorMessage);
    };

    return new Proxy(
        {},
        {
            get() {
                return throwMissingConfigError;
            },
        }
    ) as SupabaseClient;
};

export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    })
    : createMissingConfigClient();
