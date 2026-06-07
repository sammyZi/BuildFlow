import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { GeminiClient, resolveProvider } from '@/lib/gemini';

export const maxDuration = 120;

/**
 * POST /api/detailed/refine
 * Refines an existing document based on user feedback.
 * Used for iterative editing via the chat-like refinement input.
 */
export async function POST(req: Request) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { currentContent, prompt, provider } = await req.json();
    if (!currentContent || !prompt) {
      return NextResponse.json(
        { success: false, error: 'currentContent and prompt are required' },
        { status: 400 }
      );
    }

    const client = new GeminiClient(resolveProvider(provider));
    const content = await client.refineContent(currentContent, prompt);

    return NextResponse.json({ success: true, content });
  } catch (error: any) {
    console.error('Error in /api/detailed/refine:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
