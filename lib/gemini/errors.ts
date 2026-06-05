/**
 * Maps raw Gemini / AI SDK errors to a small set of kinds and to friendly,
 * user-facing messages. Used so the UI can show something meaningful instead
 * of a stack trace or an endless spinner when the model is rate-limited,
 * overloaded, or misconfigured.
 */

export type AIErrorKind = 'rate_limit' | 'overloaded' | 'auth' | 'timeout' | 'unknown';

function collectErrorText(error: any): string {
  if (!error) return '';
  const parts: string[] = [];
  const visit = (e: any, depth: number) => {
    if (!e || depth > 4) return;
    if (typeof e === 'string') { parts.push(e); return; }
    if (e.message) parts.push(String(e.message));
    if (e.responseBody) parts.push(String(e.responseBody));
    if (e.lastError) visit(e.lastError, depth + 1);
    if (e.cause) visit(e.cause, depth + 1);
    if (Array.isArray(e.errors)) e.errors.forEach((sub: any) => visit(sub, depth + 1));
  };
  visit(error, 0);
  return parts.join(' ').toLowerCase();
}

function statusOf(error: any): number | undefined {
  return (
    error?.statusCode ??
    error?.status ??
    error?.lastError?.statusCode ??
    error?.cause?.statusCode
  );
}

export function classifyAIError(error: any): AIErrorKind {
  const text = collectErrorText(error);
  const status = statusOf(error);

  if (
    status === 429 ||
    text.includes('resource_exhausted') ||
    text.includes('quota') ||
    text.includes('rate limit') ||
    text.includes('too many requests')
  ) {
    return 'rate_limit';
  }

  if (
    status === 503 ||
    text.includes('unavailable') ||
    text.includes('overloaded') ||
    text.includes('high demand')
  ) {
    return 'overloaded';
  }

  if (
    status === 401 ||
    status === 403 ||
    text.includes('api key') ||
    text.includes('api_key') ||
    text.includes('permission denied') ||
    text.includes('unauthenticated')
  ) {
    return 'auth';
  }

  if (text.includes('timeout') || text.includes('timed out') || text.includes('aborted')) {
    return 'timeout';
  }

  return 'unknown';
}

export function friendlyAIErrorMessage(error: any): string {
  switch (classifyAIError(error)) {
    case 'rate_limit':
      return 'The AI service is busy right now (usage limit reached). Please wait a minute and try again.';
    case 'overloaded':
      return 'The AI model is experiencing high demand at the moment. Please try again in a few moments.';
    case 'auth':
      return 'The AI service rejected the request. Please check the API key and billing configuration.';
    case 'timeout':
      return 'The AI request took too long and was stopped. Please try again.';
    default:
      return 'The AI service failed to generate a response. Please try again.';
  }
}
