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
        system: 'You are an expert Product Manager conducting a discovery session. Generate exactly 5 short, crisp, and concise questions SPECIFIC to the app idea provided. Each question should be a single brief sentence. Return ONLY valid JSON array format - no markdown, no code blocks, no explanations.',
        prompt: `App Idea: "${idea}"

Based on this specific app idea, generate 5 short and crisp discovery questions covering:
1. Target audience
2. Key features
3. Platform
4. Design style
5. Technical constraints

Each question must have exactly 4 short answer options. Keep the wording very concise.

Return ONLY a JSON array in this format:
[{"id":"q1","question":"Short question here?","options":["Short Opt 1","Short Opt 2","Short Opt 3","Short Opt 4"]}]

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
        system: 'You are an expert Product Manager. Generate a comprehensive requirements document for the following app idea, incorporating the user\'s answers to discovery questions. Use highly structured markdown formatting. Start with a clear H1 heading. DO NOT include Date, Version or Author metadata. Use distinct headings, bullet points, and clear spaced sections for Target Audience, Core Features, User Stories, and Non-functional Requirements. Ensure proper spacing between paragraphs.',
        prompt: `App Idea: ${idea}\n\n${answers ? `User's Answers to Discovery Questions:\n${answers}\n\n` : ''}Generate a detailed requirements document.`,
      });
      
      const dateString = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const [heading, ...rest] = text.split('\\n');
      const textWithDate = `${heading}\\n*Date: ${dateString}*\\n${rest.join('\\n')}`;
      
      return NextResponse.json({ success: true, content: textWithDate });
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
        system: 'You are an expert Software Architect. Generate exactly 3 short, crisp questions around tech stack options. Each question and its 4 options must be extremely brief. Return ONLY valid JSON array format.',
        prompt: `App Idea: "${idea}"
Requirements:
${requirements}

Generate 3 short technical discovery questions covering:
1. Frontend Tech
2. Backend Programming Language (Do NOT ask about deployment models like Serverless/K8s/PaaS, ONLY ask about programming languages/frameworks like Node.js/Python/Go)
3. Database

Return ONLY a JSON array:
[{"id":"tech1","question":"Short tech question?","options":["Short Opt 1","Short Opt 2","Short Opt 3","Short Opt 4"]}]`,
      });
      
      let cleanedText = text.trim().replace(/```json\n?/gi, '').replace(/```\n?$/g, '').replace(/^```\n?/g, '').trim();
      return NextResponse.json({ success: true, content: cleanedText });
    }

    if (action === 'generate_design') {
      const { text } = await generateText({
        model,
        system: 'You are an expert Software Architect. Generate a technical system design document based on the given app idea, requirements, and tech stack choices. Include System Architecture (with a Mermaid diagram), Tech Stack (Frontend, Backend, Database), Data Models, and API Endpoints. Use markdown formatting. IMPORTANT: In Mermaid diagrams, if a node label contains parenthesis `()`, slashes `/`, spaces, or special characters, you MUST wrap the label text in double quotes to prevent syntax errors. Example: `NodeId["My Node (Details)"]`. NEVER use `--(Label)-->` or `-- Label -->` for edge labels; use standard `-->|Label|` syntax only. For subgraphs, the ID must be a single word without special characters or spaces, e.g., `subgraph InfrastructureServices [Infrastructure & Services]`. Ensure all Data Models are presented in standard Markdown tables with proper line breaks (`\\n`) for each row. Do not output tables on a single line.',
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
      const { requirements: reqDoc, design: desDoc, tasks: taskDoc, projectId } = body;
      
      let finalProjectId = projectId;
      // 1. Create or update project
      if (projectId) {
        // SECURITY FIX: Verify the user owns this project before modifying
        const { data: existingProject, error: verifyError } = await supabaseAdmin
          .from('projects')
          .select('id')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single();

        if (verifyError || !existingProject) {
          return NextResponse.json({ success: false, error: 'Unauthorized to modify this project' }, { status: 403 });
        }

        const { error: updateError } = await supabaseAdmin
          .from('projects')
          .update({ status: 'completed' })
          .eq('id', projectId);
        if (updateError) throw updateError;
      } else {
        const { data: project, error: insertError } = await supabaseAdmin
          .from('projects')
          .insert({ user_id: user.id, prompt: idea, status: 'completed' })
          .select()
          .single();

        if (insertError) throw insertError;
        finalProjectId = project.id;
      }

      // First, delete existing artifacts to avoid duplicates if re-saving
      await supabaseAdmin.from('artifacts').delete().eq('project_id', finalProjectId);

      // 2. Insert artifacts
      const artifacts = [
        { project_id: finalProjectId, artifact_type: 'requirements', content: reqDoc },
        { project_id: finalProjectId, artifact_type: 'design', content: desDoc },
        { project_id: finalProjectId, artifact_type: 'tasks', content: taskDoc },
      ];

      const { error: artifactsError } = await supabaseAdmin
        .from('artifacts')
        .insert(artifacts);

      if (artifactsError) throw artifactsError;

      return NextResponse.json({ success: true, projectId: finalProjectId });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Error in /api/detailed:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
