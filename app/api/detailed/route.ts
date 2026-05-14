import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Read the body once and reuse it
    const body = await req.json();
    const { action, idea, currentContent, prompt, requirements, design, answers } = body;

    const model = google(process.env.GEMINI_MODEL || 'gemini-2.5-flash');

    if (action === 'generate_questions') {
      const { text } = await generateText({
        model,
        system: 'You are an expert Product Manager conducting a discovery session. Generate exactly 5 focused questions SPECIFIC to the app idea provided. Each question should help gather essential information about the project. Return ONLY valid JSON array format - no markdown, no code blocks, no explanations.',
        prompt: `App Idea: "${idea}"

Based on this specific app idea, generate 5 discovery questions covering:
1. Target audience/users (who will use this app?)
2. Key features priority (what's most important?)
3. Platform preference (mobile/web/desktop?)
4. Design style preference (modern/minimal/colorful?)
5. Technical requirements (performance/scalability/integrations?)

Each question must have exactly 4 relevant answer options.

Return ONLY a JSON array in this format:
[{"id":"q1","question":"Your question here?","options":["Option 1","Option 2","Option 3","Option 4"]}]

Make the questions and options SPECIFIC to: ${idea}`,
      });
      
      // Clean up the response - remove markdown code blocks if present
      let cleanedText = text.trim();
      
      // Remove markdown code blocks
      cleanedText = cleanedText.replace(/```json\n?/gi, '').replace(/```\n?$/g, '').replace(/^```\n?/g, '');
      
      // Remove any leading/trailing whitespace
      cleanedText = cleanedText.trim();
      
      console.log('Generated questions (cleaned):', cleanedText);
      
      return NextResponse.json({ success: true, content: cleanedText });
    }

    if (action === 'generate_requirements') {
      const { text } = await generateText({
        model,
        system: 'You are an expert Product Manager. Generate a comprehensive requirements document for the following app idea, incorporating the user\'s answers to discovery questions. Use markdown formatting with headings, bullet points, and clear sections for Target Audience, Core Features, User Stories, and Non-functional Requirements. Be concise and professional.',
        prompt: `App Idea: ${idea}\n\n${answers ? `User's Answers to Discovery Questions:\n${answers}\n\n` : ''}Generate a detailed requirements document.`,
      });
      return NextResponse.json({ success: true, content: text });
    }

    if (action === 'refine_content') {
      const { text } = await generateText({
        model,
        system: 'You are an expert refining a technical document based on user feedback. Keep the formatting professional and in markdown. Apply the user\'s requested changes to the document while keeping the rest intact and coherent.',
        prompt: `Current Document:\n${currentContent}\n\nUser's requested changes:\n${prompt}\n\nPlease output the completely updated document.`,
      });
      return NextResponse.json({ success: true, content: text });
    }

    if (action === 'generate_design_questions') {
      const { text } = await generateText({
        model,
        system: 'You are an expert Software Architect identifying technical trade-offs. Generate exactly 3 focused questions around tech stack options for this app system. Each question should have exactly 4 defined technical options. Return ONLY valid JSON array format.',
        prompt: `App Idea: "${idea}"
Requirements:
${requirements}

Generate 3 technical discovery questions covering:
1. Frontend Framework / UI Tech Stack
2. Backend Infrastructure / Language
3. Database / Storage approach

Return ONLY a JSON array in this format:
[{"id":"tech1","question":"Your tech question?","options":["Tech Option 1","Tech Option 2","Tech Option 3","Tech Option 4"]}]`,
      });
      
      let cleanedText = text.trim().replace(/```json\n?/gi, '').replace(/```\n?$/g, '').replace(/^```\n?/g, '').trim();
      return NextResponse.json({ success: true, content: cleanedText });
    }

    if (action === 'generate_design') {
      const { text } = await generateText({
        model,
        system: 'You are an expert Software Architect. Generate a technical system design document based on the given app idea, requirements, and tech stack choices. Include System Architecture, Tech Stack (Frontend, Backend, Database), Data Models, and API Endpoints. Use markdown formatting.',
        prompt: `App Idea: ${idea}\n\nApproved Requirements:\n${requirements}\n\n${answers ? `Selected Tech Stack Options:\n${answers}\n\n` : ''}`,
      });
      return NextResponse.json({ success: true, content: text });
    }

    if (action === 'generate_tasks') {
      const { text } = await generateText({
        model,
        system: 'You are an expert Engineering Manager. Generate a detailed, sprint-ready task breakdown based on the provided requirements and system design. Group tasks by Phase (e.g., Setup, Frontend, Backend, Integration). Provide a short description and acceptance criteria for each task. Use markdown formatting with checkboxes `- [ ]`.',
        prompt: `App Idea: ${idea}\n\nRequirements:\n${requirements}\n\nSystem Design:\n${design}`,
      });
      return NextResponse.json({ success: true, content: text });
    }

    if (action === 'save_project') {
      const { requirements: reqDoc, design: desDoc, tasks: taskDoc } = body;
      
      // 1. Create project
      const { data: project, error: insertError } = await supabaseAdmin
        .from('projects')
        .insert({ user_id: user.id, prompt: idea })
        .select()
        .single();

      if (insertError) throw insertError;

      // 2. Insert artifacts
      const artifacts = [
        { project_id: project.id, artifact_type: 'requirements', content: reqDoc },
        { project_id: project.id, artifact_type: 'design', content: desDoc },
        { project_id: project.id, artifact_type: 'tasks', content: taskDoc },
      ];

      const { error: artifactsError } = await supabaseAdmin
        .from('artifacts')
        .insert(artifacts);

      if (artifactsError) throw artifactsError;

      return NextResponse.json({ success: true, projectId: project.id });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Error in /api/detailed:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
