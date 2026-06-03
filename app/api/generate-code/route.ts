import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { withAuth } from '@/lib/api/withAuth';
import { GeminiClient } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;
    const { user } = auth;

    const { projectId } = await req.json();

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Bad Request: projectId is required' },
        { status: 400 }
      );
    }

    // Verify the user owns this project
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not own this project' },
        { status: 403 }
      );
    }

    // Fetch all artifacts for the project
    const { data: artifacts, error: artifactsError } = await supabaseAdmin
      .from('artifacts')
      .select('artifact_type, content')
      .eq('project_id', projectId);

    if (artifactsError || !artifacts || artifacts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No artifacts found for this project' },
        { status: 404 }
      );
    }

    const requirements = artifacts.find(a => a.artifact_type === 'requirements')?.content || '';
    const design = artifacts.find(a => a.artifact_type === 'design')?.content || '';
    const tasks = artifacts.find(a => a.artifact_type === 'tasks')?.content || '';

    if (!requirements || !design) {
      return NextResponse.json(
        { success: false, error: 'Project must have requirements and design artifacts' },
        { status: 400 }
      );
    }

    // Generate scaffold
    const client = new GeminiClient();
    const rawOutput = await client.generateScaffold(requirements, design, tasks);

    // Clean the output — strip markdown code fences if the model wraps them
    let cleaned = rawOutput.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    // Validate it's parseable JSON
    const files = JSON.parse(cleaned);
    if (!Array.isArray(files)) {
      throw new Error('Generated output is not a valid file array');
    }

    return NextResponse.json({ success: true, files }, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/generate-code:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate starter code' },
      { status: 500 }
    );
  }
}
