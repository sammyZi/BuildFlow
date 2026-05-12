import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { SupabaseService } from '@/lib/supabase/service';
import { GenerationOrchestrator } from '@/lib/gemini';
import type { GenerateRequest, GenerateResponse } from '@/types';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const { appIdea, userId } = await req.json() as GenerateRequest;

    if (!appIdea || typeof appIdea !== 'string' || appIdea.trim() === '') {
      return NextResponse.json({ success: false, error: 'Bad Request: appIdea must be a non-empty string' }, { status: 400 });
    }

    if (userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: userId does not match authenticated user' }, { status: 403 });
    }

    // Call supabaseAdmin directly to bypass RLS since we've already validated the user and token
    const { data: project, error: insertError } = await supabaseAdmin
      .from('projects')
      .insert({
        user_id: userId,
        prompt: appIdea,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create project: ${insertError.message}`);
    }

    // Invoke GenerationOrchestrator in background
    const orchestrator = new GenerationOrchestrator();
    orchestrator.generateAll(project.id, appIdea).catch(err => {
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
