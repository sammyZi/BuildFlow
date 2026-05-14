import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, idea, status, current_step, state_data } = body;

    let targetProjectId = projectId;

    if (!targetProjectId) {
      // Create project first
      const { data: project, error: insertError } = await supabaseAdmin
        .from('projects')
        .insert({
          user_id: user.id,
          prompt: idea,
          status: status || 'draft',
          current_step: current_step || 'questions',
          state_data: state_data || {}
        })
        .select()
        .single();
        
      if (insertError) throw insertError;
      targetProjectId = project.id;
    } else {
      // Update existing project
      const { error: updateError } = await supabaseAdmin
        .from('projects')
        .update({
          status: status || 'draft',
          current_step: current_step,
          state_data: state_data,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetProjectId)
        .eq('user_id', user.id); // Ensure user owns it

      if (updateError) throw updateError;
    }

    return NextResponse.json({ success: true, projectId: targetProjectId });

  } catch (error: any) {
    console.error('Error in /api/projects/autosave:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}