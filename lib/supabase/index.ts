/**
 * Supabase client and utilities
 * 
 * This module provides:
 * - Client-side Supabase client (respects RLS)
 * - Server-side Supabase admin client (bypasses RLS)
 * - Authentication helper functions
 * - Database service layer
 */

export { supabase } from './client';
export { supabaseAdmin } from './server';
export {
  signUp,
  signIn,
  signOut,
  getSession,
  getUser,
  onAuthStateChange,
} from './auth';
export { SupabaseService } from './service';
