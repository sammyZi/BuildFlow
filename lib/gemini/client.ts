import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { FAST_PROMPTS, DETAILED_PROMPTS } from './prompts';

/**
 * GeminiClient wraps the Google Gemini API for all artifact generation.
 *
 * Used by both the Fast pipeline (sequential generation) and the
 * Detailed pipeline (step-by-step with user refinement).
 *
 * Features:
 * - Retry logic with exponential backoff (3 attempts)
 * - Rate limit handling (429 detection)
 * - Centralized prompts from prompts.ts
 */
export class GeminiClient {
  private google: ReturnType<typeof createGoogleGenerativeAI>;
  private maxRetries: number = 3;
  private baseDelay: number = 1000; // 1 second

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || '';

    if (!key) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY is required. Please set it in your environment variables.');
    }

    this.google = createGoogleGenerativeAI({ apiKey: key });
  }

  // ─── Fast pipeline methods ──────────────────────────────────────────────

  /**
   * Generate requirements.md from an app idea (fast pipeline).
   */
  async generateRequirements(appIdea: string): Promise<string> {
    return this.generateWithRetry(FAST_PROMPTS.requirements, appIdea);
  }

  /**
   * Generate design.md from app idea + requirements (fast pipeline).
   */
  async generateDesign(appIdea: string, requirements: string): Promise<string> {
    const userMessage = `App Idea: ${appIdea}\n\nRequirements:\n${requirements}`;
    return this.generateWithRetry(FAST_PROMPTS.design, userMessage);
  }

  /**
   * Generate tasks.md from app idea + requirements + design (fast pipeline).
   */
  async generateTasks(appIdea: string, requirements: string, design: string): Promise<string> {
    const userMessage = `App Idea: ${appIdea}\n\nRequirements:\n${requirements}\n\nDesign:\n${design}`;
    return this.generateWithRetry(FAST_PROMPTS.tasks, userMessage);
  }

  // ─── Detailed pipeline methods ──────────────────────────────────────────

  /**
   * Generate discovery questions for an app idea.
   * Returns raw JSON string (caller must parse).
   */
  async generateQuestions(idea: string): Promise<string> {
    const prompt = `App Idea: "${idea}"

Based on this specific app idea, generate 5 short and crisp discovery questions covering:
1. Target audience
2. Key features
3. Platform
4. Design style
5. Technical constraints

Each question must have exactly 4 short answer options. Keep the wording very concise.

Return ONLY a JSON array in this format:
[{"id":"q1","question":"Short question here?","options":["Short Opt 1","Short Opt 2","Short Opt 3","Short Opt 4"]}]

Make the questions and options SPECIFIC to: ${idea}`;

    return this.generateWithRetry(DETAILED_PROMPTS.questions, prompt);
  }

  /**
   * Generate requirements document from idea + user answers (detailed pipeline).
   */
  async generateDetailedRequirements(idea: string, answers?: string): Promise<string> {
    const prompt = `App Idea: ${idea}\n\n${answers ? `User's Answers to Discovery Questions:\n${answers}\n\n` : ''}Generate a detailed requirements document.`;
    return this.generateWithRetry(DETAILED_PROMPTS.requirements, prompt);
  }

  /**
   * Generate tech stack decision questions (detailed pipeline).
   */
  async generateDesignQuestions(idea: string, requirements: string): Promise<string> {
    const prompt = `App Idea: "${idea}"
Requirements:
${requirements}

Generate 3 short technical discovery questions covering:
1. Frontend Tech
2. Backend Programming Language (Do NOT ask about deployment models like Serverless/K8s/PaaS, ONLY ask about programming languages/frameworks like Node.js/Python/Go)
3. Database

Return ONLY a JSON array:
[{"id":"tech1","question":"Short tech question?","options":["Short Opt 1","Short Opt 2","Short Opt 3","Short Opt 4"]}]`;

    return this.generateWithRetry(DETAILED_PROMPTS.designQuestions, prompt);
  }

  /**
   * Generate system design document (detailed pipeline).
   */
  async generateDetailedDesign(idea: string, requirements: string, answers?: string): Promise<string> {
    const prompt = `App Idea: ${idea}\n\nApproved Requirements:\n${requirements}\n\n${answers ? `Selected Tech Stack Options:\n${answers}\n\n` : ''}`;
    return this.generateWithRetry(DETAILED_PROMPTS.design, prompt);
  }

  /**
   * Generate task breakdown (detailed pipeline).
   */
  async generateDetailedTasks(idea: string, requirements: string, design: string): Promise<string> {
    const prompt = `App Idea: ${idea}\n\nRequirements:\n${requirements}\n\nSystem Design:\n${design}`;
    return this.generateWithRetry(DETAILED_PROMPTS.tasks, prompt);
  }

  /**
   * Refine an existing document with user feedback.
   */
  async refineContent(currentContent: string, userPrompt: string): Promise<string> {
    const prompt = `Current Document:\n${currentContent}\n\nUser's requested changes:\n${userPrompt}\n\nPlease output the completely updated document.`;
    return this.generateWithRetry(DETAILED_PROMPTS.refine, prompt);
  }

  // ─── Core generation with retry ─────────────────────────────────────────

  /**
   * Generate text with retry logic and exponential backoff.
   */
  private async generateWithRetry(systemPrompt: string, userMessage: string): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const result = await generateText({
          model: this.google(process.env.GEMINI_MODEL || 'gemini-2.5-flash'),
          system: systemPrompt,
          prompt: userMessage,
        });

        return result.text;
      } catch (error: any) {
        lastError = error;

        const isRateLimitError =
          error?.message?.includes('rate limit') ||
          error?.message?.includes('429') ||
          error?.status === 429;

        if (attempt === this.maxRetries - 1) {
          break;
        }

        const delay = this.baseDelay * Math.pow(2, attempt);

        console.warn(
          `Gemini API call failed (attempt ${attempt + 1}/${this.maxRetries}). ` +
          `${isRateLimitError ? 'Rate limit error. ' : ''}` +
          `Retrying in ${delay}ms...`
        );

        await this.sleep(delay);
      }
    }

    throw new Error(
      `Gemini API call failed after ${this.maxRetries} attempts. ` +
      `Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Sleep utility for exponential backoff.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
