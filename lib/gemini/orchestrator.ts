import { SupabaseService } from '../supabase/service';
import { GeminiClient } from './client';

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
    try {
      // 1. Generate Requirements
      console.log(`Starting requirements generation for project ${projectId}...`);
      const requirements = await this.client.generateRequirements(appIdea);
      await SupabaseService.saveArtifact(projectId, 'requirements', requirements);
      console.log(`Saved requirements for project ${projectId}.`);

      // 2. Generate Design
      console.log(`Starting design generation for project ${projectId}...`);
      const design = await this.client.generateDesign(appIdea, requirements, techPreferences);
      await SupabaseService.saveArtifact(projectId, 'design', design);
      console.log(`Saved design for project ${projectId}.`);

      // 3. Generate Tasks
      console.log(`Starting tasks generation for project ${projectId}...`);
      const tasks = await this.client.generateTasks(appIdea, requirements, design);
      await SupabaseService.saveArtifact(projectId, 'tasks', tasks);
      console.log(`Saved tasks for project ${projectId}.`);

      console.log(`Successfully completed generation pipeline for project ${projectId}.`);
      return projectId;
    } catch (error: any) {
      console.error(`Generation pipeline failed for project ${projectId}:`, error);
      throw new Error(`Generation pipeline failed: ${error.message || 'Unknown error'}`);
    }
  }
}
