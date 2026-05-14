// TypeScript type definitions for AI Architect Hub
// This file will contain shared interfaces and types

export type ArtifactType = 'requirements' | 'design' | 'tasks';

export interface Profile {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  prompt: string;
  status?: string;
  current_step?: string;
  state_data?: any;
  created_at: string;
  updated_at: string;
}

export interface Artifact {
  id: string;
  project_id: string;
  artifact_type: ArtifactType;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface GenerateRequest {
  appIdea: string;
  userId: string;
}

export interface GenerateResponse {
  success: boolean;
  projectId: string;
  error?: string;
}

export interface GenerationContext {
  appIdea: string;
  requirements?: string;
  design?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}
