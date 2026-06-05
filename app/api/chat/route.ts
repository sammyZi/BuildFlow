import { streamText } from 'ai';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { CHAT_PROMPTS, geminiModel } from '@/lib/gemini';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { messages, stage, artifactContent } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages must be a non-empty array' },
        { status: 400 }
      );
    }

    const stageKey = typeof stage === 'string' && stage in CHAT_PROMPTS ? stage : 'requirements';
    let systemPrompt = CHAT_PROMPTS[stageKey] || CHAT_PROMPTS.requirements;

    // Inject current artifact content as context so the AI can reference it
    if (artifactContent && typeof artifactContent === 'string') {
      systemPrompt += `\n\nHere is the current ${stageKey}.md document that the user is discussing:\n\n---\n${artifactContent}\n---\n\nReference this document when answering questions. Be specific about sections, headings, and line items when suggesting changes.`;
    }

    const result = streamText({
      model: geminiModel(),
      system: systemPrompt,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
