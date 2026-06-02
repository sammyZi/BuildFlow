import { supabase } from './client';

/**
 * Authentication helper functions
 * These wrap Supabase auth methods for easier use throughout the application
 */

/**
 * Sign up a new user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns User data and session if successful, error otherwise
 */
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign in an existing user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns User data and session if successful, error otherwise
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Get the current user session
 * @returns Session data if user is authenticated, null otherwise
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return data.session;
}

/**
 * Get the current authenticated user
 * @returns User data if authenticated, null otherwise
 */
export async function getUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}

/**
 * Listen to authentication state changes
 * @param callback - Function to call when auth state changes
 * @returns Subscription object with unsubscribe method
 */
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Send a password reset email
 * @param email - User's email address
 */
export async function resetPassword(email: string) {
  const origin = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://build-flow-theta.vercel.app';
    
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Update user password
 * @param password - New password
 */
export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw new Error(error.message);
  }
}
