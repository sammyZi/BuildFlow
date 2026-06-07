import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

/**
 * AI provider selection. The app can generate artifacts with either Google
 * Gemini or OpenAI — chosen per request from the UI, falling back to
 * DEFAULT_AI_PROVIDER (then 'gemini') when unspecified.
 */
export type AIProvider = 'gemini' | 'openai';

export function isAIProvider(value: unknown): value is AIProvider {
  return value === 'gemini' || value === 'openai';
}

/** Resolve a provider id from an untrusted value, applying env/default fallback. */
export function resolveProvider(value?: unknown): AIProvider {
  if (isAIProvider(value)) return value;
  const envDefault = process.env.DEFAULT_AI_PROVIDER;
  if (isAIProvider(envDefault)) return envDefault;
  return 'gemini';
}

// ─── Google Gemini ───────────────────────────────────────────────────────────

let _googleProvider: ReturnType<typeof createGoogleGenerativeAI> | null = null;

export function getGoogleProvider(apiKey?: string): ReturnType<typeof createGoogleGenerativeAI> {
  if (!apiKey && _googleProvider) return _googleProvider;

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
  if (!apiKey) _googleProvider = provider;
  return provider;
}

/** The default Gemini model id, overridable via GEMINI_MODEL. */
export function getGeminiModelId(): string {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

// ─── OpenAI ──────────────────────────────────────────────────────────────────

let _openaiProvider: ReturnType<typeof createOpenAI> | null = null;

export function getOpenAIProvider(apiKey?: string): ReturnType<typeof createOpenAI> {
  if (!apiKey && _openaiProvider) return _openaiProvider;

  const key = apiKey || process.env.OPENAI_API_KEY || '';

  if (!key) {
    throw new Error(
      'OPENAI_API_KEY is required to use the OpenAI provider. Please set it in your environment variables.'
    );
  }

  const provider = createOpenAI({ apiKey: key });
  if (!apiKey) _openaiProvider = provider;
  return provider;
}

/** The default OpenAI model id, overridable via OPENAI_MODEL. */
export function getOpenAIModelId(): string {
  return process.env.OPENAI_MODEL || 'gpt-5.4-mini';
}

// ─── Unified resolution ────────────────────────────────────────────────────

/**
 * Return a ready-to-use language model for the given provider. This is the
 * single entry point every generation path should use so switching providers
 * is a one-line change.
 */
export function getModel(provider?: AIProvider, modelId?: string): LanguageModel {
  const resolved = resolveProvider(provider);
  if (resolved === 'openai') {
    return getOpenAIProvider()(modelId || getOpenAIModelId());
  }
  return getGoogleProvider()(modelId || getGeminiModelId());
}

/** Convenience helper returning a ready-to-use Gemini model instance. */
export function geminiModel(modelId?: string): LanguageModel {
  return getGoogleProvider()(modelId || getGeminiModelId());
}
