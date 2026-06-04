/**
 * Server-side SSE helper for Next.js API routes.
 *
 * Usage:
 * ```ts
 * export async function POST(req: Request) {
 *   const { stream, send, done } = createSSEStream();
 *   (async () => {
 *     await send('progress', { stage: 'requirements', progress: 10 });
 *     // ... do work ...
 *     await send('progress', { stage: 'done', progress: 100 });
 *     done();
 *   })();
 *   return stream;
 * }
 * ```
 */

export interface SSEController {
  /** The Response object to return from the route handler */
  stream: Response;
  /** Send a named SSE event with a JSON-serializable payload */
  send: (event: string, data: unknown) => void;
  /** Send the final [DONE] marker and close the stream */
  done: () => void;
}

export function createSSEStream(): SSEController {
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl;
    },
    cancel() {
      controller = null;
    },
  });

  const send = (event: string, data: unknown) => {
    if (!controller) return;
    try {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      controller.enqueue(encoder.encode(payload));
    } catch {
      // Stream may have been closed by the client
    }
  };

  const done = () => {
    if (!controller) return;
    try {
      controller.enqueue(encoder.encode('event: done\ndata: [DONE]\n\n'));
      controller.close();
    } catch {
      // Already closed
    }
    controller = null;
  };

  const response = new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  });

  return { stream: response, send, done };
}
