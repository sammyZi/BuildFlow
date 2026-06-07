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

    // ─── Step 2: Surgically propagate the change to the other documents ──
    // Rather than regenerating downstream docs from scratch (which would
    // discard prior content/edits), we update ONLY the sections affected by
    // this change in each related document. This keeps requirements, design,
    // and tasks consistent — e.g. a tech-stack change updates the design's
    // tech-stack section and the impacted tasks, leaving everything else as-is.
    const TYPE_LABELS: Record<string, string> = {
      requirements: 'requirements',
      design: 'system design',
      tasks: 'implementation tasks',
    };

    // Propagate to every other artifact, in canonical order, using the freshly
    // refined document as the source of truth for the change.
    const cascadeTargets = ['requirements', 'design', 'tasks'].filter(t => t !== artifactType);

    for (const targetType of cascadeTargets) {
      const { data: targetCurrent } = await supabaseAdmin
        .from('artifacts')
        .select('*')
        .eq('project_id', projectId)
        .eq('artifact_type', targetType)
        .single();

      if (!targetCurrent || !targetCurrent.content?.trim()) continue;

      let updatedTarget: string;
      try {
        updatedTarget = await client.propagateChange(
          TYPE_LABELS[targetType] || targetType,
          targetCurrent.content,
          prompt,
          TYPE_LABELS[artifactType] || artifactType,
          refinedContent
        );
      } catch (err) {
        console.error(`Failed to propagate change to ${targetType}:`, err);
        continue;
      }

      // If the document was unaffected, skip the DB write and version bump.
      if (!updatedTarget.trim() || updatedTarget.trim() === targetCurrent.content.trim()) continue;

      await saveVersion(
        targetCurrent.id,
        projectId,
        targetCurrent.content,
        `[Auto] ${TYPE_LABELS[artifactType] || artifactType} changed: ${prompt}`
      );

      const { data: savedTarget, error: targetError } = await supabaseAdmin
        .from('artifacts')
        .update({ content: updatedTarget })
        .eq('id', targetCurrent.id)
        .eq('project_id', projectId)
        .select()
        .single();

      if (targetError) {
        console.error(`Failed to cascade-update ${targetType}:`, targetError);
      } else if (savedTarget) {
        updatedArtifacts.push(savedTarget);
      }
    }

    return NextResponse.json({
      success: true,
      content: refinedContent,
      artifact: updatedArtifact,
      updatedArtifacts,
      cascaded: updatedArtifacts.length > 1,
    });
  } catch (error: any) {
    console.error('Error in /api/artifacts/refine:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
