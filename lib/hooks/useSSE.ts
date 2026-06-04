/**
 * Client-side utility for consuming SSE streams from POST requests.
 *
 * We can't use the native EventSource API because it only supports GET.
 * Instead we use fetch() + ReadableStream and manually parse the SSE format.
 *
 * Usage:
 * ```ts
 * const { startStream } = useSSE<MyEventPayload>();
 * await startStream('/api/generate', { body: { appIdea } }, {
 *   onEvent: (event, data) => { ... },
 *   onError: (err) => { ... },
 *   onDone: () => { ... },
 * });
 * ```
 */

import { supabase } from '@/lib/supabase/client';

export interface SSEOptions<T = any> {
  /** Called for each named event received */
  onEvent: (event: string, data: T) => void;
  /** Called if the stream encounters an error */
  onError?: (error: Error) => void;
  /** Called when the stream completes (receives [DONE]) */
  onDone?: () => void;
}

/**
 * Start an SSE stream via a POST request with auth headers.
 * Returns a promise that resolves when the stream ends.
 */
export async function startSSEStream<T = any>(
  url: string,
  body: Record<string, any>,
  options: SSEOptions<T>,
  signal?: AbortSignal
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    options.onError?.(new Error('Please sign in again.'));
    return;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      options.onError?.(new Error('Request was cancelled.'));
    } else {
      options.onError?.(new Error(err.message || 'Network error'));
    }
    return;
  }

  if (!response.ok) {
    let msg = `HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      msg = errBody.error || msg;
    } catch { /* ignore */ }
    options.onError?.(new Error(msg));
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    options.onError?.(new Error('No response body'));
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events from buffer.
      // Each event is separated by a double newline.
      const parts = buffer.split('\n\n');
      // The last part may be incomplete, keep it in the buffer
      buffer = parts.pop() || '';

      for (const part of parts) {
        if (!part.trim()) continue;

        let eventName = 'message';
        let eventData = '';

        for (const line of part.split('\n')) {
          if (line.startsWith('event: ')) {
            eventName = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            eventData = line.slice(6);
          }
        }

        if (eventName === 'done' || eventData === '[DONE]') {
          options.onDone?.();
          return;
        }

        if (eventData) {
          try {
            const parsed = JSON.parse(eventData) as T;
            options.onEvent(eventName, parsed);
          } catch {
            // Non-JSON data, send as-is
            options.onEvent(eventName, eventData as any);
          }
        }
      }
    }

    // Stream ended without [DONE] — still call onDone
    options.onDone?.();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      options.onError?.(new Error('Stream was cancelled.'));
    } else {
      options.onError?.(err);
    }
  }
}
