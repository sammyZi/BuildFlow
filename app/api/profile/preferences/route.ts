import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';

/**
 * GET /api/profile/preferences
 * Returns the user's tech_preferences
 */
export async function GET(req: Request) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { supabaseAdmin } = await import('@/lib/supabase/server');
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('tech_preferences')
      .eq('id', auth.user.id)
      .single();

    if (error) {
      console.error('Failed to fetch preferences:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch preferences' }, { status: 500 });
    }

    return NextResponse.json({ success: true, tech_preferences: profile?.tech_preferences || '' });
  } catch (error: any) {
    console.error('Error in GET /api/profile/preferences:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}

/**
 * PATCH /api/profile/preferences
 * Updates the user's tech_preferences
 */
export async function PATCH(req: Request) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { tech_preferences } = await req.json();

    const { supabaseAdmin } = await import('@/lib/supabase/server');
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ tech_preferences, updated_at: new Date().toISOString() })
      .eq('id', auth.user.id);

    if (error) {
      console.error('Failed to update preferences:', error);
      return NextResponse.json({ success: false, error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in PATCH /api/profile/preferences:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}
