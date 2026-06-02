import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/detailed/save
 * Saves a completed detailed pipeline project with all its artifacts.
 * Creates or updates the project, then upserts all artifact documents.
 */
export async function POST(req: Request) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;
    const { user } = auth;

    const { projectId, idea, requirements, design, tasks } = await req.json();

    if (!requirements || !design || !tasks) {
      return NextResponse.json(
        { success: false, error: 'requirements, design, and tasks are required' },
        { status: 400 }
      );
    }

    let finalProjectId = projectId;

    if (projectId) {
      // Verify the user owns this project before modifying
      const { data: existingProject, error: verifyError } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

      if (verifyError || !existingProject) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized to modify this project' },
          { status: 403 }
        );
      }

      const { error: updateError } = await supabaseAdmin
        .from('projects')
        .update({ status: 'completed' })
        .eq('id', projectId);

      if (updateError) throw updateError;
    } else {
      // Create new project
      const { data: project, error: insertError } = await supabaseAdmin
        .from('projects')
        .insert({ user_id: user.id, prompt: idea, status: 'completed' })
        .select()
        .single();

      if (insertError) throw insertError;
      finalProjectId = project.id;
    }

    // Delete existing artifacts to avoid duplicates if re-saving
    await supabaseAdmin.from('artifacts').delete().eq('project_id', finalProjectId);

    // Insert all three artifacts
    const artifacts = [
      { project_id: finalProjectId, artifact_type: 'requirements', content: requirements },
      { project_id: finalProjectId, artifact_type: 'design', content: design },
      { project_id: finalProjectId, artifact_type: 'tasks', content: tasks },
    ];

    const { error: artifactsError } = await supabaseAdmin
      .from('artifacts')
      .insert(artifacts);

    if (artifactsError) throw artifactsError;

    return NextResponse.json({ success: true, projectId: finalProjectId });
  } catch (error: any) {
    console.error('Error in /api/detailed/save:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
