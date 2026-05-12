import express, { Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase/server';
import { SupabaseService } from '../lib/supabase/service';
import { GenerationOrchestrator } from '../lib/gemini';
import type { GenerateRequest, GenerateResponse } from '../types';

const app = express();

app.use(express.json());

app.post('/api/generate', async (req: Request, res: Response): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
    }

    const { appIdea, userId } = req.body as GenerateRequest;

    if (!appIdea || typeof appIdea !== 'string' || appIdea.trim() === '') {
      return res.status(400).json({ success: false, error: 'Bad Request: appIdea must be a non-empty string' });
    }

    if (userId !== user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden: userId does not match authenticated user' });
    }

    // Call SupabaseService.createProject()
    const project = await SupabaseService.createProject(userId, appIdea);

    // Invoke GenerationOrchestrator in background
    const orchestrator = new GenerationOrchestrator();
    orchestrator.generateAll(project.id, appIdea).catch(err => {
      console.error(`Background generation failed for project ${project.id}:`, err);
    });

    const response: GenerateResponse = {
      success: true,
      projectId: project.id,
    };

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('Error in /api/generate:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
});

export default app;
