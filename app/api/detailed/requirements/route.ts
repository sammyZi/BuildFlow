import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { createSSEStream } from '@/lib/api/sse';
import { GeminiClient, resolveProvider } from '@/lib/gemini';

export const maxDuration = 120;

/**
 * POST /api/detailed/requirements
 * Generates a requirements document from app idea + user answers.
 * Streams progress via SSE.
 */
export async function POST(req: Request) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { idea, answers, provider } = await req.json();
    if (!idea || typeof idea !== 'string') {
      return NextResponse.json({ success: false, error: 'idea is required' }, { status: 400 });
    }

    const { stream, send, done } = createSSEStream();

    (async () => {
      try {
        send('progress', { status: 'generating', message: 'Analyzing your app idea…', progress: 10 });

        const client = new GeminiClient(resolveProvider(provider));
        const content = await client.generateDetailedRequirements(idea, answers);

        send('progress', { status: 'complete', message: 'Requirements ready', progress: 100 });
        send('result', { success: true, content });
      } catch (error: any) {
        send('error', { message: error.message || 'Failed to generate requirements' });
      } finally {
        done();
      }
    })();

    return stream;
  } catch (error: any) {
    console.error('Error in /api/detailed/requirements:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
