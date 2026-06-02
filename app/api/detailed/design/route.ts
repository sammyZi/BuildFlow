import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { GeminiClient } from '@/lib/gemini';

/**
 * POST /api/detailed/design
 * Generates a system design document from idea + requirements + tech answers.
 */
export async function POST(req: Request) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { idea, requirements, answers } = await req.json();
    if (!idea || !requirements) {
      return NextResponse.json({ success: false, error: 'idea and requirements are required' }, { status: 400 });
    }

    const client = new GeminiClient();
    const content = await client.generateDetailedDesign(idea, requirements, answers);

    return NextResponse.json({ success: true, content });
  } catch (error: any) {
    console.error('Error in /api/detailed/design:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
