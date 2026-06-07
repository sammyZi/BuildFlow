import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { createSSEStream } from '@/lib/api/sse';
import { GeminiClient, resolveProvider } from '@/lib/gemini';

export const maxDuration = 120;

/**
 * POST /api/detailed/tasks
 * Generates a task breakdown from idea + requirements + design.
 * Streams progress via SSE.
 */
export async function POST(req: Request) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { idea, requirements, design, provider } = await req.json();
    if (!idea || !requirements || !design) {
      return NextResponse.json({ success: false, error: 'idea, requirements, and design are required' }, { status: 400 });
    }

    const { stream, send, done } = createSSEStream();

    (async () => {
      try {
        send('progress', { status: 'generating', message: 'Breaking down into tasks…', progress: 10 });

        const client = new GeminiClient(resolveProvider(provider));
        const content = await client.generateDetailedTasks(idea, requirements, design);

        send('progress', { status: 'complete', message: 'Tasks ready', progress: 100 });
        send('result', { success: true, content });
      } catch (error: any) {
        send('error', { message: error.message || 'Failed to generate tasks' });
      } finally {
        done();
      }
    })();

    return stream;
  } catch (error: any) {
    console.error('Error in /api/detailed/tasks:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
