import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';

/**
 * GET /api/artifacts/versions?artifactId=xxx
 * Returns all versions for a given artifact, newest first.
 */
export async function GET(req: Request) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(req.url);
    const artifactId = searchParams.get('artifactId');

    if (!artifactId) {
      return NextResponse.json(
        { success: false, error: 'artifactId is required' },
        { status: 400 }
      );
    }

    const { supabaseAdmin } = await import('@/lib/supabase/server');

    // Verify ownership through artifact → project → user
    const { data: artifact } = await supabaseAdmin
      .from('artifacts')
      .select('project_id, content')
      .eq('id', artifactId)
      .single();

    if (!artifact) {
      return NextResponse.json(
        { success: false, error: 'Artifact not found' },
        { status: 404 }
      );
    }

    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('user_id')
      .eq('id', artifact.project_id)
      .single();

    if (!project || project.user_id !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { data: versions, error } = await supabaseAdmin
      .from('artifact_versions')
      .select('*')
      .eq('artifact_id', artifactId)
      .order('version_number', { ascending: false });

    if (error) {
      console.error('Failed to fetch versions:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch versions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      versions: versions || [],
      currentContent: artifact.content,
    });
  } catch (error: any) {
    console.error('Error in /api/artifacts/versions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
