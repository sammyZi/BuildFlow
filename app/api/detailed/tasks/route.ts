import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { GeminiClient } from '@/lib/gemini';

/**
 * POST /api/detailed/tasks
 * Generates a task breakdown from idea + requirements + design.
 */
export async function POST(req: Request) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { idea, requirements, design } = await req.json();
    if (!idea || !requirements || !design) {
      return NextResponse.json({ success: false, error: 'idea, requirements, and design are required' }, { status: 400 });
    }

    const client = new GeminiClient();
    const content = await client.generateDetailedTasks(idea, requirements, design);

    return NextResponse.json({ success: true, content });
  } catch (error: any) {
    console.error('Error in /api/detailed/tasks:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
