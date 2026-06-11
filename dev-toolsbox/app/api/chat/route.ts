import { NextRequest } from 'next/server';
import {
  chatCompletionStream,
  type ChatMessage,
} from '@/lib/openrouter';
import { searchTavily, buildSearchContext } from '@/lib/tavily';

export const runtime = 'nodejs';

const SYSTEM_PROMPT =
  'You are a direct, helpful AI assistant for developers inside Dev - Tools Box. ' +
  'Answer immediately and concisely. Use markdown formatting. ' +
  'When web search results are provided as context, ground your answer in them and cite source URLs.';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    const enableSearch = body.enableSearch === true;
    const query = typeof body.query === 'string' ? body.query : '';
    const model = typeof body.model === 'string' ? body.model : undefined;

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // 2. Kalau enableSearch — hit Tavily dulu, inject hasil ke context
    let sources: Array<{ url: string; title: string; content: string }> = [];
    if (enableSearch && query.trim()) {
      try {
        sources = await searchTavily(query.trim());
        if (sources.length > 0) {
          const searchContext = buildSearchContext(sources);
          // Inject sebagai system message tambahan, bukan ubah user message
          messages.push({
            role: 'system',
            content: `Web search results for context:\n\n${searchContext}`,
          });
        }
      } catch {
        // search gagal → lanjut tanpa context, jangan blokir chat
      }
    }

    for (const m of rawMessages) {
      if (
        typeof m === 'object' &&
        m !== null &&
        ((m as Record<string, unknown>).role === 'user' ||
          (m as Record<string, unknown>).role === 'assistant') &&
        typeof (m as Record<string, unknown>).content === 'string'
      ) {
        const mm = m as { role: 'user' | 'assistant'; content: string };
        messages.push({ role: mm.role, content: mm.content });
      }
    }

    // 3 & 4. Kirim ke OpenRouter, stream response ke client via SSE
    const upstream = await chatCompletionStream(messages, model);

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let buffer = '';

    const transform = new TransformStream<Uint8Array, Uint8Array>({
      start(controller) {
        // Kirim sources duluan supaya UI bisa render collapsible
        if (sources.length > 0) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'sources', sources })}\n\n`
            )
          );
        }
      },
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
            );
            continue;
          }
          try {
            const parsed = JSON.parse(data) as Record<string, unknown>;
            const choices = parsed.choices as
              | Array<Record<string, unknown>>
              | undefined;
            const delta = choices?.[0]?.delta as
              | Record<string, unknown>
              | undefined;
            const token =
              typeof delta?.content === 'string' ? delta.content : '';
            if (token) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'token', token })}\n\n`
                )
              );
            }
          } catch {
            // ignore non-JSON lines
          }
        }
      },
      flush(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        );
      },
    });

    return new Response(upstream.pipeThrough(transform), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI unavailable';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
