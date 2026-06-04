import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { withAuth } from '@/lib/api/withAuth';
import { createSSEStream } from '@/lib/api/sse';
import { GenerationOrchestrator } from '@/lib/gemini';
import type { GenerateRequest } from '@/types';

// Allow up to 2 minutes for the full pipeline
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;
    const { user } = auth;

    const { appIdea, userId } = await req.json() as GenerateRequest;

    if (!appIdea || typeof appIdea !== 'string' || appIdea.trim() === '') {
      return NextResponse.json({ success: false, error: 'Bad Request: appIdea must be a non-empty string' }, { status: 400 });
    }

    if (userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: userId does not match authenticated user' }, { status: 403 });
    }

    // Create project in database
    const { data: project, error: insertError } = await supabaseAdmin
      .from('projects')
      .insert({
        user_id: userId,
        prompt: appIdea,
        status: 'completed',
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create project: ${insertError.message}`);
    }

    // Fetch user preferences
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('tech_preferences')
      .eq('id', user.id)
      .single();

    const techPreferences = profile?.tech_preferences || undefined;

    // Create SSE stream and run pipeline with progress
    const { stream, send, done } = createSSEStream();

    // Send projectId immediately so the client can start navigating
    send('init', { projectId: project.id });

    // Run pipeline asynchronously, streaming progress
    (async () => {
      try {
        const orchestrator = new GenerationOrchestrator();
        await orchestrator.generateAllWithProgress(
          project.id,
          appIdea,
          techPreferences,
          (event) => {
            send('progress', event);
          }
        );
      } catch (err: any) {
        send('error', { message: err.message || 'Generation failed' });
      } finally {
        done();
      }
    })();

    return stream;
  } catch (error: any) {
    console.error('Error in /api/generate:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
