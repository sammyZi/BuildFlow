import { SupabaseService } from '../supabase/service';
import { GeminiClient } from './client';

export type GenerationStage = 'requirements' | 'design' | 'tasks' | 'complete';
export type GenerationStatus = 'generating' | 'saving' | 'done';

export interface ProgressEvent {
  stage: GenerationStage;
  status: GenerationStatus;
  progress: number; // 0-100
  message: string;
}

export type OnProgress = (event: ProgressEvent) => void;

export class GenerationOrchestrator {
  private client: GeminiClient;

  constructor() {
    this.client = new GeminiClient();
  }

  /**
   * Run the full generation pipeline for a project (Fast mode).
   * Generates requirements → design → tasks sequentially, saving each to Supabase.
   * @param projectId The ID of the project in the database
   * @param appIdea The user's app idea prompt
   * @param techPreferences The user's global tech stack preferences
   * @returns The project ID if successful
   */
  async generateAll(projectId: string, appIdea: string, techPreferences?: string): Promise<string> {
    return this.generateAllWithProgress(projectId, appIdea, techPreferences);
  }

  /**
   * Run the full pipeline with progress callbacks.
   * Each stage reports: generating → saving → done.
   *
   * Progress mapping:
   *   requirements: 0 → 30%
   *   design:       30 → 65%
   *   tasks:        65 → 100%
   */
  async generateAllWithProgress(
    projectId: string,
    appIdea: string,
    techPreferences?: string,
    onProgress?: OnProgress
  ): Promise<string> {
    const emit = onProgress || (() => {});

    try {
      // 1. Generate Requirements
      emit({ stage: 'requirements', status: 'generating', progress: 0, message: 'Generating requirements document…' });
      const requirements = await this.client.generateRequirements(appIdea);
      emit({ stage: 'requirements', status: 'saving', progress: 25, message: 'Saving requirements…' });
      await SupabaseService.saveArtifact(projectId, 'requirements', requirements);
      emit({ stage: 'requirements', status: 'done', progress: 30, message: 'Requirements complete' });

      // 2. Generate Design
      emit({ stage: 'design', status: 'generating', progress: 30, message: 'Generating system design…' });
      const design = await this.client.generateDesign(appIdea, requirements, techPreferences);
      emit({ stage: 'design', status: 'saving', progress: 60, message: 'Saving design…' });
      await SupabaseService.saveArtifact(projectId, 'design', design);
      emit({ stage: 'design', status: 'done', progress: 65, message: 'System design complete' });

      // 3. Generate Tasks
      emit({ stage: 'tasks', status: 'generating', progress: 65, message: 'Generating task breakdown…' });
      const tasks = await this.client.generateTasks(appIdea, requirements, design);
      emit({ stage: 'tasks', status: 'saving', progress: 95, message: 'Saving tasks…' });
      await SupabaseService.saveArtifact(projectId, 'tasks', tasks);
      emit({ stage: 'tasks', status: 'done', progress: 98, message: 'Tasks complete' });

      // 4. Complete
      emit({ stage: 'complete', status: 'done', progress: 100, message: 'All documents generated!' });

      return projectId;
    } catch (error: any) {
      console.error(`Generation pipeline failed for project ${projectId}:`, error);
      throw new Error(`Generation pipeline failed: ${error.message || 'Unknown error'}`);
    }
  }
}
