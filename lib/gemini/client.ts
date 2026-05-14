import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

/**
 * MiniMaxClient wraps the Google Gemini API for generating
 * requirements, design, and tasks artifacts.
 * 
 * Features:
 * - Sequential generation with context accumulation
 * - Retry logic with exponential backoff (3 attempts)
 * - Rate limit handling
 * - Specialized system prompts for each artifact type
 */
export class MiniMaxClient {
  private google: ReturnType<typeof createGoogleGenerativeAI>;
  private maxRetries: number = 3;
  private baseDelay: number = 1000; // 1 second

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || '';

    if (!key) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY is required. Please set it in your environment variables.');
    }

    // Create Google AI provider with API key
    this.google = createGoogleGenerativeAI({
      apiKey: key,
    });
  }

  /**
   * Generate requirements.md from an app idea
   * @param appIdea - The user's app concept
   * @returns Markdown-formatted requirements document
   */
  async generateRequirements(appIdea: string): Promise<string> {
    const systemPrompt = "You are an expert Product Manager. Given the following app idea, generate a requirements.md file detailing the target audience, core user stories, and strict feature scope. IMPORTANT: Do not wrap your response in a markdown code block (like ```markdown). Respond with raw markdown text only.";

    return this.generateWithRetry(systemPrompt, appIdea);
  }

  /**
   * Generate design.md from app idea and requirements
   * @param appIdea - The user's app concept
   * @param requirements - Previously generated requirements.md content
   * @returns Markdown-formatted design document
   */
  async generateDesign(appIdea: string, requirements: string): Promise<string> {
    const systemPrompt = `You are an expert Software Architect. Using the attached requirements, create a design.md file specifying the ideal tech stack, database schema, and exact folder structure.

IMPORTANT: When including Mermaid diagrams in your markdown:
1. Wrap diagrams in code blocks with the 'mermaid' language identifier
2. Always quote edge labels that contain special characters (parentheses, slashes, brackets, etc.)
3. Example of correct syntax:
   \`\`\`mermaid
   graph TD
       A[Start] -->|"Step 1 (with details)"| B[Process]
       B -->|"Data (JSON/XML)"| C[End]
   \`\`\`
4. Use quotes around ANY label text that contains: ( ) / [ ] { } or other special characters`;

    const userMessage = `App Idea: ${appIdea}\n\nRequirements:\n${requirements}`;

    return this.generateWithRetry(systemPrompt, userMessage);
  }

  /**
   * Generate tasks.md from app idea, requirements, and design
   * @param appIdea - The user's app concept
   * @param requirements - Previously generated requirements.md content
   * @param design - Previously generated design.md content
   * @returns Markdown-formatted tasks document
   */
  async generateTasks(appIdea: string, requirements: string, design: string): Promise<string> {
    const systemPrompt = "You are a Lead Developer. Break down the attached requirements and design into a tasks.md file. Format this as a highly granular checklist where each item is small enough to be independently executed by an AI IDE without additional context. IMPORTANT: Do not wrap your response in a markdown code block (like ```markdown). Respond with raw markdown text only.";

    const userMessage = `App Idea: ${appIdea}\n\nRequirements:\n${requirements}\n\nDesign:\n${design}`;

    return this.generateWithRetry(systemPrompt, userMessage);
  }

  /**
   * Internal method to generate text with retry logic and exponential backoff
   * @param systemPrompt - The system prompt for the generation
   * @param userMessage - The user message/prompt
   * @returns Generated markdown content
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

        // Check if it's a rate limit error
        const isRateLimitError =
          error?.message?.includes('rate limit') ||
          error?.message?.includes('429') ||
          error?.status === 429;

        // If this is the last attempt, don't wait
        if (attempt === this.maxRetries - 1) {
          break;
        }

        // Calculate exponential backoff delay: 1s, 2s, 4s
        const delay = this.baseDelay * Math.pow(2, attempt);

        console.warn(
          `Gemini API call failed (attempt ${attempt + 1}/${this.maxRetries}). ` +
          `${isRateLimitError ? 'Rate limit error. ' : ''}` +
          `Retrying in ${delay}ms...`
        );

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // All retries failed
    throw new Error(
      `Gemini API call failed after ${this.maxRetries} attempts. ` +
      `Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Sleep utility for exponential backoff
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
