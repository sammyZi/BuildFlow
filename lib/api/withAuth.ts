import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

/**
 * Result type for withAuth — either a validated user or a NextResponse error.
 */
export type AuthResult =
  | { success: true; user: User }
  | { success: false; response: NextResponse };

/**
 * Extracts and validates the Bearer token from the Authorization header.
 * Returns the authenticated user or a pre-built error response.
 *
 * Usage:
 * ```ts
 * const auth = await withAuth(req);
 * if (!auth.success) return auth.response;
 * const { user } = auth;
 * ```
 */
export async function withAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.split(' ')[1];

  try {
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Unauthorized: Invalid token' },
          { status: 401 }
        ),
      };
    }

    return { success: true, user };
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized: Token validation failed' },
        { status: 401 }
      ),
    };
  }
}
