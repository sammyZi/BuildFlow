import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { CHAT_PROMPTS } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { messages, stage, artifactContent } = await req.json();

    let systemPrompt = CHAT_PROMPTS[stage] || CHAT_PROMPTS.requirements;

    // Inject current artifact content as context so the AI can reference it
    if (artifactContent) {
      systemPrompt += `\n\nHere is the current ${stage}.md document that the user is discussing:\n\n---\n${artifactContent}\n---\n\nReference this document when answering questions. Be specific about sections, headings, and line items when suggesting changes.`;
    }

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
