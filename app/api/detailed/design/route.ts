import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { createSSEStream } from '@/lib/api/sse';
import { GeminiClient, resolveProvider } from '@/lib/gemini';

export const maxDuration = 120;

/**
 * POST /api/detailed/design
 * Generates a system design document from idea + requirements + tech answers.
 * Streams progress via SSE.
 */
export async function POST(req: Request) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { idea, requirements, answers, provider } = await req.json();
    if (!idea || !requirements) {
      return NextResponse.json({ success: false, error: 'idea and requirements are required' }, { status: 400 });
    }

    const { stream, send, done } = createSSEStream();

    (async () => {
      try {
        send('progress', { status: 'generating', message: 'Designing system architecture…', progress: 10 });

        const client = new GeminiClient(resolveProvider(provider));
        const content = await client.generateDetailedDesign(idea, requirements, answers);

        send('progress', { status: 'complete', message: 'Design ready', progress: 100 });
        send('result', { success: true, content });
      } catch (error: any) {
        send('error', { message: error.message || 'Failed to generate design' });
      } finally {
        done();
      }
    })();

    return stream;
  } catch (error: any) {
    console.error('Error in /api/detailed/design:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
