import { createGoogleGenerativeAI } from '@ai-sdk/google';

/**
 * Centralized Google Gemini provider.
 *
 * Resolves the API key from either GOOGLE_GENERATIVE_AI_API_KEY (the SDK
 * default) or GEMINI_API_KEY (documented in .env), so every entry point —
 * the GeminiClient pipelines AND the chat streaming route — behaves the same
 * regardless of which variable is set.
 */
let _provider: ReturnType<typeof createGoogleGenerativeAI> | null = null;

export function getGoogleProvider(apiKey?: string): ReturnType<typeof createGoogleGenerativeAI> {
  if (!apiKey && _provider) return _provider;

  const key =
    apiKey ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    '';

  if (!key) {
    throw new Error(
      'GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY is required. Please set it in your environment variables.'
    );
  }

  const provider = createGoogleGenerativeAI({ apiKey: key });
  if (!apiKey) _provider = provider;
  return provider;
}

/** The default Gemini model id, overridable via GEMINI_MODEL. */
export function getGeminiModelId(): string {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

/** Convenience helper returning a ready-to-use model instance. */
export function geminiModel(modelId?: string) {
  return getGoogleProvider()(modelId || getGeminiModelId());
}
