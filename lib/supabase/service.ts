import { supabase } from './client';
import { supabaseAdmin } from './server';
import type { Profile, Project, Artifact, ArtifactType } from '@/types';

/**
 * SupabaseService class
 * Provides methods for database operations with proper error handling
 * Uses client-side client for user operations and admin client for backend operations
 */
export class SupabaseService {
  /**
   * Create a new project for a user
   * @param userId - The user's ID
   * @param prompt - The app idea prompt
   * @returns The created project
   */
  static async createProject(userId: string, prompt: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        prompt,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }

    return data;
  }

  /**
   * Save an artifact to the database
   * Uses admin client to bypass RLS (called from backend)
   * @param projectId - The project ID
   * @param type - The artifact type
   * @param content - The artifact content
   * @returns The created artifact
   */
  static async saveArtifact(
    projectId: string,
    type: ArtifactType,
    content: string
  ): Promise<Artifact> {
    const { data, error } = await supabaseAdmin
      .from('artifacts')
      .insert({
        project_id: projectId,
        artifact_type: type,
        content,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save artifact: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all projects for a user
   * @param userId - The user's ID
   * @returns Array of projects sorted by creation date (newest first)
   */
  static async getProjectsByUser(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all artifacts for a project
   * @param projectId - The project ID
   * @returns Array of artifacts sorted by creation date
   */
  static async getArtifactsByProject(projectId: string): Promise<Artifact[]> {
    const { data, error } = await supabase
      .from('artifacts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch artifacts: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Subscribe to real-time artifact updates for a project
   * @param projectId - The project ID to subscribe to
   * @param callback - Function to call when artifacts are inserted/updated
   * @returns Subscription object with unsubscribe method
   */
  static subscribeToArtifacts(
    projectId: string,
    callback: (artifact: Artifact) => void
  ) {
    const channel = supabase
      .channel(`artifacts:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'artifacts',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          callback(payload.new as Artifact);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  }

  /**
   * Get a single project by ID
   * @param projectId - The project ID
   * @returns The project or null if not found
   */
  static async getProjectById(projectId: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw new Error(`Failed to fetch project: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a project and all its artifacts
   * @param projectId - The project ID
   */
  static async deleteProject(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  /**
   * Check if all artifacts exist for a project
   * @param projectId - The project ID
   * @returns True if all three artifact types exist
   */
  static async hasAllArtifacts(projectId: string): Promise<boolean> {
    const artifacts = await this.getArtifactsByProject(projectId);
    const types = new Set(artifacts.map((a) => a.artifact_type));
    return types.has('requirements') && types.has('design') && types.has('tasks');
  }
}
