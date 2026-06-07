import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { withAuth } from '@/lib/api/withAuth';
import { createSSEStream } from '@/lib/api/sse';
import { GenerationOrchestrator, friendlyAIErrorMessage, resolveProvider } from '@/lib/gemini';
import type { GenerateRequest } from '@/types';

// Allow up to 2 minutes for the full pipeline
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;
    const { user } = auth;

    const { appIdea, userId, projectId, provider } = (await req.json()) as GenerateRequest & {
      projectId?: string;
      provider?: string;
    };

    // Resolve provider from the request; for retries we fall back to the
    // provider stored on the project so regeneration uses the same model.
    let aiProvider = resolveProvider(provider);

    if (!appIdea || typeof appIdea !== 'string' || appIdea.trim() === '') {
      return NextResponse.json({ success: false, error: 'Bad Request: appIdea must be a non-empty string' }, { status: 400 });
    }

    if (userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: userId does not match authenticated user' }, { status: 403 });
    }

    let project: { id: string };

    if (projectId) {
      // ─── Retry / regenerate into an existing project ──────────────────────
      const { data: existing, error: lookupError } = await supabaseAdmin
        .from('projects')
        .select('id, user_id, state_data')
        .eq('id', projectId)
        .single();

      if (lookupError || !existing) {
        return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
      }
      if (existing.user_id !== user.id) {
        return NextResponse.json({ success: false, error: 'Forbidden: You do not own this project' }, { status: 403 });
      }

      // If the caller didn't specify a provider, reuse the project's stored one.
      if (!provider && existing.state_data?.provider) {
        aiProvider = resolveProvider(existing.state_data.provider);
      }

      // Reset to a clean slate: mark generating and remove any partial artifacts.
      await supabaseAdmin
        .from('projects')
        .update({
          status: 'generating',
          prompt: appIdea,
          state_data: { ...(existing.state_data || {}), provider: aiProvider },
        })
        .eq('id', projectId);
      await supabaseAdmin.from('artifacts').delete().eq('project_id', projectId);

      project = { id: projectId };
    } else {
      // ─── Fresh project — mark generating until the pipeline finishes ──────
      const { data: created, error: insertError } = await supabaseAdmin
        .from('projects')
        .insert({
          user_id: userId,
          prompt: appIdea,
          status: 'generating',
          state_data: { provider: aiProvider },
        })
        .select('id')
        .single();

      if (insertError || !created) {
        throw new Error(`Failed to create project: ${insertError?.message || 'unknown error'}`);
      }
      project = created;
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

    // Run streaming pipeline, forwarding each event as a typed SSE message.
    // This runs detached from the client connection, so generation completes
    // even if the user navigates away mid-stream.
    (async () => {
      try {
        const orchestrator = new GenerationOrchestrator(aiProvider);
        await orchestrator.generateAllStreaming(
          project.id,
          appIdea,
          techPreferences,
          (event) => {
            // Send each event using its type as the SSE event name
            send(event.type, event);
          }
        );

        // Mark the project complete so the UI can stop polling.
        await supabaseAdmin
          .from('projects')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', project.id);
      } catch (err: any) {
        const message = err?.message || friendlyAIErrorMessage(err);
        send('error', { message });

        // Persist the failure + reason so a reloading/returning client can
        // surface it instead of polling forever.
        try {
          const { data: cur } = await supabaseAdmin
            .from('projects')
            .select('state_data')
            .eq('id', project.id)
            .single();

          await supabaseAdmin
            .from('projects')
            .update({
              status: 'failed',
              state_data: { ...(cur?.state_data || {}), error: message },
              updated_at: new Date().toISOString(),
            })
            .eq('id', project.id);
        } catch {
          /* best-effort — the SSE error event was already sent */
        }
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
