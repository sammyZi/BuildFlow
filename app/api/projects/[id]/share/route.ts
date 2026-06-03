import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * PATCH /api/projects/[id]/share
 * Toggles the is_public flag for a project.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { is_public } = await req.json();

    // Verify project belongs to user
    const { data: project, error: checkError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .single();

    if (checkError || !project) {
      return NextResponse.json({ success: false, error: 'Project not found or unauthorized' }, { status: 404 });
    }

    // Update is_public flag
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({ is_public, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to update project sharing:', updateError);
      return NextResponse.json({ success: false, error: 'Failed to update sharing settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true, is_public });
  } catch (error: any) {
    console.error('Error in PATCH /api/projects/[id]/share:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}
