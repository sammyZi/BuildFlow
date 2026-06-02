import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { GeminiClient } from '@/lib/gemini';

/**
 * POST /api/detailed/requirements
 * Generates a requirements document from app idea + user answers.
 */
export async function POST(req: Request) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { idea, answers } = await req.json();
    if (!idea || typeof idea !== 'string') {
      return NextResponse.json({ success: false, error: 'idea is required' }, { status: 400 });
    }

    const client = new GeminiClient();
    const content = await client.generateDetailedRequirements(idea, answers);

    return NextResponse.json({ success: true, content });
  } catch (error: any) {
    console.error('Error in /api/detailed/requirements:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
