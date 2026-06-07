import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { GeminiClient, resolveProvider } from '@/lib/gemini';

// Refining requirements cascades into regenerating design + tasks,
// which can mean up to ~5 sequential Gemini calls. Allow extra headroom.
export const maxDuration = 300;

/**
 * POST /api/artifacts/refine
 * Refines an existing completed artifact and updates it in the database.
 * Saves the previous version before updating for version history.
 * 
 * Cascading logic:
 * - If requirements are refined → regenerate design and tasks automatically
 * - If design is refined → regenerate tasks automatically
 * - If tasks are refined → no cascade
 */
export async function POST(req: Request) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { artifactId, projectId, currentContent, prompt, artifactType, provider } = await req.json();
    if (!artifactId || !projectId || !currentContent || !prompt || !artifactType) {
      return NextResponse.json(
        { success: false, error: 'artifactId, projectId, currentContent, prompt, and artifactType are required' },
        { status: 400 }
      );
    }

    const { supabaseAdmin } = await import('@/lib/supabase/server');

    // Verify the user owns this project
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('user_id, prompt, state_data')
      .eq('id', projectId)
      .single();

    if (!project || project.user_id !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: 'Project not found or unauthorized' },
        { status: 403 }
      );
    }

    const client = new GeminiClient(resolveProvider(provider ?? project.state_data?.provider));
    const appIdea = project.prompt;
    const updatedArtifacts: any[] = [];

    // ─── Helper: save version before update ──────────────────────────────
    async function saveVersion(aId: string, pId: string, content: string, changePrompt: string) {
      // Get current max version number
      const { data: versions } = await supabaseAdmin
        .from('artifact_versions')
        .select('version_number')
        .eq('artifact_id', aId)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersion = (versions && versions.length > 0) ? versions[0].version_number + 1 : 1;

      await supabaseAdmin.from('artifact_versions').insert({
        artifact_id: aId,
        project_id: pId,
        version_number: nextVersion,
        content,
        change_prompt: changePrompt,
      });

      return nextVersion;
    }

    // ─── Step 1: Save current version, then refine ───────────────────────
    await saveVersion(artifactId, projectId, currentContent, prompt);

    const refinedContent = await client.refineContent(currentContent, prompt);

    const { data: updatedArtifact, error: updateError } = await supabaseAdmin
      .from('artifacts')
      .update({ content: refinedContent })
      .eq('id', artifactId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update artifact:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to save refined content' },
        { status: 500 }
      );
    }

    updatedArtifacts.push(updatedArtifact);

    // ─── Step 2: Cascade regeneration ────────────────────────────────────

    if (artifactType === 'requirements') {
      // Requirements changed → regenerate design, then tasks

      // Get current design artifact to save its version
      const { data: designArtifactCurrent } = await supabaseAdmin
        .from('artifacts')
        .select('*')
        .eq('project_id', projectId)
        .eq('artifact_type', 'design')
        .single();

      if (designArtifactCurrent) {
        await saveVersion(designArtifactCurrent.id, projectId, designArtifactCurrent.content, `[Auto] Requirements changed: ${prompt}`);
      }

      const newDesign = await client.generateDesign(appIdea, refinedContent);

      const { data: designArtifact, error: designError } = await supabaseAdmin
        .from('artifacts')
        .update({ content: newDesign })
        .eq('project_id', projectId)
        .eq('artifact_type', 'design')
        .select()
        .single();

      if (designError) {
        console.error('Failed to cascade-update design:', designError);
      } else {
        updatedArtifacts.push(designArtifact);
      }

      // Get current tasks artifact to save its version
      const { data: tasksArtifactCurrent } = await supabaseAdmin
        .from('artifacts')
        .select('*')
        .eq('project_id', projectId)
        .eq('artifact_type', 'tasks')
        .single();

      if (tasksArtifactCurrent) {
        await saveVersion(tasksArtifactCurrent.id, projectId, tasksArtifactCurrent.content, `[Auto] Requirements changed: ${prompt}`);
      }

      const designContent = designArtifact?.content || newDesign;
      const newTasks = await client.generateTasks(appIdea, refinedContent, designContent);

      const { data: tasksArtifact, error: tasksError } = await supabaseAdmin
        .from('artifacts')
        .update({ content: newTasks })
        .eq('project_id', projectId)
        .eq('artifact_type', 'tasks')
        .select()
        .single();

      if (tasksError) {
        console.error('Failed to cascade-update tasks:', tasksError);
      } else {
        updatedArtifacts.push(tasksArtifact);
      }

    } else if (artifactType === 'design') {
      // Design changed → regenerate tasks

      const { data: reqArtifact } = await supabaseAdmin
        .from('artifacts')
        .select('content')
        .eq('project_id', projectId)
        .eq('artifact_type', 'requirements')
        .single();

      // Save current tasks version
      const { data: tasksArtifactCurrent } = await supabaseAdmin
        .from('artifacts')
        .select('*')
        .eq('project_id', projectId)
        .eq('artifact_type', 'tasks')
        .single();

      if (tasksArtifactCurrent) {
        await saveVersion(tasksArtifactCurrent.id, projectId, tasksArtifactCurrent.content, `[Auto] Design changed: ${prompt}`);
      }

      const requirementsContent = reqArtifact?.content || '';
      const newTasks = await client.generateTasks(appIdea, requirementsContent, refinedContent);

      const { data: tasksArtifact, error: tasksError } = await supabaseAdmin
        .from('artifacts')
        .update({ content: newTasks })
        .eq('project_id', projectId)
        .eq('artifact_type', 'tasks')
        .select()
        .single();

      if (tasksError) {
        console.error('Failed to cascade-update tasks:', tasksError);
      } else {
        updatedArtifacts.push(tasksArtifact);
      }
    }

    return NextResponse.json({
      success: true,
      content: refinedContent,
      artifact: updatedArtifact,
      updatedArtifacts,
      cascaded: artifactType !== 'tasks',
    });
  } catch (error: any) {
    console.error('Error in /api/artifacts/refine:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
