import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

const SYSTEM_PROMPTS: Record<string, string> = {
  requirements: `You are an expert Product Manager helping refine an app idea into clear requirements.

Your approach:
1. First, acknowledge what the user described
2. Then ask 2-3 SHORT, specific questions to clarify:
   - Target audience & primary use case
   - Must-have vs nice-to-have features
   - Any constraints (budget, timeline, platform)
3. Keep each question on its own line, numbered
4. Be concise and conversational — avoid walls of text

After the user answers, ask 1-2 follow-up questions if needed, then summarize what you've gathered.`,

  design: `You are an expert Software Architect helping make technical design decisions.

Your approach:
1. First, acknowledge the requirements context provided
2. Then ask 2-3 SHORT, specific questions about:
   - Preferred tech stack or framework preferences
   - Database needs (SQL vs NoSQL, scale expectations)
   - Deployment & hosting preferences (cloud provider, serverless, etc.)
   - Authentication needs
3. Keep questions numbered and concise
4. Be practical — suggest sensible defaults when the user is unsure

After the user answers, ask 1-2 follow-up questions if needed, then summarize the technical decisions.`,
};

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, stage } = await req.json();

    const systemPrompt = SYSTEM_PROMPTS[stage] || SYSTEM_PROMPTS.requirements;

    const result = streamText({
      model: google(process.env.GEMINI_MODEL || 'gemini-2.5-flash'),
      system: systemPrompt,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
