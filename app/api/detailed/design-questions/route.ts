import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { GeminiClient, resolveProvider } from '@/lib/gemini';

/**
 * POST /api/detailed/design-questions
 * Generates tech stack decision questions based on idea + requirements.
 */
export async function POST(req: Request) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { idea, requirements, provider } = await req.json();
    if (!idea || !requirements) {
      return NextResponse.json({ success: false, error: 'idea and requirements are required' }, { status: 400 });
    }

    const client = new GeminiClient(resolveProvider(provider));
    const raw = await client.generateDesignQuestions(idea, requirements);

    // Clean up the response — remove markdown code blocks if present
    const cleaned = raw
      .trim()
      .replace(/```json\n?/gi, '')
      .replace(/```\n?$/g, '')
      .replace(/^```\n?/g, '')
      .trim();

    return NextResponse.json({ success: true, content: cleaned });
  } catch (error: any) {
    console.error('Error in /api/detailed/design-questions:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
