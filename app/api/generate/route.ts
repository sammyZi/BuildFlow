import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { withAuth } from '@/lib/api/withAuth';
import { GenerationOrchestrator } from '@/lib/gemini';
import type { GenerateRequest, GenerateResponse } from '@/types';

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

    // Invoke GenerationOrchestrator in background
    const orchestrator = new GenerationOrchestrator();
    orchestrator.generateAll(project.id, appIdea, techPreferences).catch(err => {
      console.error(`Background generation failed for project ${project.id}:`, err);
    });

    const response: GenerateResponse = {
      success: true,
      projectId: project.id,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/generate:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
