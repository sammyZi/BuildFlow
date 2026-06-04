import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { withAuth } from '@/lib/api/withAuth';
import { createSSEStream } from '@/lib/api/sse';
import { GeminiClient } from '@/lib/gemini';

// Scaffold generation can take 60+ seconds (generates 15-35 files via Gemini)
export const maxDuration = 120;

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

    // Create SSE stream
    const { stream, send, done } = createSSEStream();

    (async () => {
      try {
        send('progress', { status: 'generating', message: 'Calling AI to generate scaffold…', progress: 5 });

        // Mark as generating in database to prevent duplicate concurrent generations
        const { data: projData } = await supabaseAdmin
          .from('projects')
          .select('state_data')
          .eq('id', projectId)
          .single();
        
        await supabaseAdmin
          .from('projects')
          .update({
            state_data: { ...(projData?.state_data || {}), isGeneratingCode: true }
          })
          .eq('id', projectId);

        // Generate scaffold
        const client = new GeminiClient();
        const rawOutput = await client.generateScaffold(requirements, design, tasks);

        send('progress', { status: 'parsing', message: 'Parsing generated files…', progress: 70 });

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

        // Stream each file as it's "discovered"
        const total = files.length;
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.path) {
            const fileProgress = 70 + Math.round(((i + 1) / total) * 25);
            send('file', {
              index: i,
              total,
              path: file.path,
              progress: fileProgress,
            });
          }
        }

        send('progress', { status: 'packaging', message: 'Packaging files for download…', progress: 97 });

        // Send all files in the final event
        send('result', { success: true, files });
        send('progress', { status: 'done', message: 'Scaffold complete!', progress: 100 });

        // Save generated code to database within project state_data
        const { data: currentProject } = await supabaseAdmin
          .from('projects')
          .select('state_data')
          .eq('id', projectId)
          .single();

        const currentState = currentProject?.state_data || {};
        await supabaseAdmin
          .from('projects')
          .update({
            state_data: { ...currentState, generatedCode: files, isGeneratingCode: false },
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId);
      } catch (error: any) {
        console.error('Error in /api/generate-code:', error);
        send('error', { message: error.message || 'Failed to generate starter code' });
        
        // Reset generating flag on error
        const { data: proj } = await supabaseAdmin.from('projects').select('state_data').eq('id', projectId).single();
        await supabaseAdmin.from('projects').update({
          state_data: { ...(proj?.state_data || {}), isGeneratingCode: false }
        }).eq('id', projectId);
      } finally {
        done();
      }
    })();

    return stream;
  } catch (error: any) {
    console.error('Error in /api/generate-code:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate starter code' },
      { status: 500 }
    );
  }
}
