import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { withAuth } from '@/lib/api/withAuth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;
    const { user } = auth;

    const { id } = await params;

    const { data: project, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json({ success: true, project });

  } catch (error: any) {
    console.error('Error in /api/projects/[id]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}