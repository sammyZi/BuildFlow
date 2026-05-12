import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase admin client
 * Uses service role key and BYPASSES Row Level Security (RLS) policies
 * NEVER import this in client components — server/API routes only
 */
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase server environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Lazy singleton — only instantiated when first accessed (server-side only)
let _adminClient: ReturnType<typeof createAdminClient> | null = null;

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createAdminClient>, {
  get(_target, prop) {
    if (!_adminClient) {
      _adminClient = createAdminClient();
    }
    return (_adminClient as any)[prop];
  },
});
