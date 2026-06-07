import { SupabaseService } from '../supabase/service';
import { GeminiClient } from './client';
import type { AIProvider } from './provider';

export type GenerationStage = 'requirements' | 'design' | 'tasks' | 'complete';
export type GenerationStatus = 'generating' | 'saving' | 'done';

export interface ProgressEvent {
  stage: GenerationStage;
  status: GenerationStatus;
  progress: number; // 0-100
  message: string;
}

export type OnProgress = (event: ProgressEvent) => void;

// ─── Streaming event types ──────────────────────────────────────────────────

export interface StreamFileStartEvent {
  type: 'file_start';
  stage: GenerationStage;
  filename: string;
}

export interface StreamChunkEvent {
  type: 'chunk';
  stage: GenerationStage;
  content: string;
}

export interface StreamFileDoneEvent {
  type: 'file_done';
  stage: GenerationStage;
}

export interface StreamProgressEvent {
  type: 'progress';
  stage: GenerationStage;
  progress: number;
  message: string;
}

export type StreamEvent = StreamFileStartEvent | StreamChunkEvent | StreamFileDoneEvent | StreamProgressEvent;

export type OnStreamEvent = (event: StreamEvent) => void;

export class GenerationOrchestrator {
  private client: GeminiClient;

  constructor(provider?: AIProvider) {
    this.client = new GeminiClient(provider);
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
      // Rethrow as-is so the (already user-friendly) message reaches the client.
      throw error;
    }
  }

  /**
   * Run the full pipeline with streaming text chunks.
   * Each stage streams content word-by-word via file_start/chunk/file_done events.
   *
   * Progress mapping:
   *   requirements: 0 → 30%
   *   design:       30 → 65%
   *   tasks:        65 → 100%
   */
  async generateAllStreaming(
    projectId: string,
    appIdea: string,
    techPreferences?: string,
    onEvent?: OnStreamEvent
  ): Promise<string> {
    const emit = onEvent || (() => {});

    try {
      // 1. Stream Requirements
      emit({ type: 'file_start', stage: 'requirements', filename: 'requirements.md' });
      emit({ type: 'progress', stage: 'requirements', progress: 0, message: 'Generating requirements document…' });

      let requirements = '';
      for await (const chunk of this.client.streamRequirements(appIdea)) {
        requirements += chunk;
        emit({ type: 'chunk', stage: 'requirements', content: chunk });
      }

      if (!requirements.trim()) throw new Error('Failed to generate the requirements document.');

      emit({ type: 'progress', stage: 'requirements', progress: 25, message: 'Saving requirements…' });
      await SupabaseService.saveArtifact(projectId, 'requirements', requirements);
      emit({ type: 'file_done', stage: 'requirements' });
      emit({ type: 'progress', stage: 'requirements', progress: 30, message: 'Requirements complete' });

      // 2. Stream Design
      emit({ type: 'file_start', stage: 'design', filename: 'design.md' });
      emit({ type: 'progress', stage: 'design', progress: 30, message: 'Generating system design…' });

      let design = '';
      for await (const chunk of this.client.streamDesign(appIdea, requirements, techPreferences)) {
        design += chunk;
        emit({ type: 'chunk', stage: 'design', content: chunk });
      }

      if (!design.trim()) throw new Error('Failed to generate the system design document.');

      emit({ type: 'progress', stage: 'design', progress: 60, message: 'Saving design…' });
      await SupabaseService.saveArtifact(projectId, 'design', design);
      emit({ type: 'file_done', stage: 'design' });
      emit({ type: 'progress', stage: 'design', progress: 65, message: 'System design complete' });

      // 3. Stream Tasks
      emit({ type: 'file_start', stage: 'tasks', filename: 'tasks.md' });
      emit({ type: 'progress', stage: 'tasks', progress: 65, message: 'Generating task breakdown…' });

      let tasks = '';
      for await (const chunk of this.client.streamTasks(appIdea, requirements, design)) {
        tasks += chunk;
        emit({ type: 'chunk', stage: 'tasks', content: chunk });
      }

      if (!tasks.trim()) throw new Error('Failed to generate the task breakdown.');

      emit({ type: 'progress', stage: 'tasks', progress: 95, message: 'Saving tasks…' });
      await SupabaseService.saveArtifact(projectId, 'tasks', tasks);
      emit({ type: 'file_done', stage: 'tasks' });
      emit({ type: 'progress', stage: 'tasks', progress: 98, message: 'Tasks complete' });

      // 4. Complete
      emit({ type: 'progress', stage: 'complete', progress: 100, message: 'All documents generated!' });

      return projectId;
    } catch (error: any) {
      console.error(`Streaming generation pipeline failed for project ${projectId}:`, error);
      // Rethrow as-is so the (already user-friendly) message reaches the client.
      throw error;
    }
  }
}
