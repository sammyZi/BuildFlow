import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Client-side Supabase client
 * Uses anon key and respects Row Level Security (RLS) policies
 * Safe to use in browser/client components
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
