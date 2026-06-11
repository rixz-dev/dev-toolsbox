import { MODEL_CHAIN, type ModelId, isValidModel, isLexcodeClaudeModel } from './models';
import { fetchLexcodeClaude } from './lexcode';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function getApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }
  return apiKey;
}

function buildHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://riz-dev-murex.vercel.app',
    'X-Title': 'Dev - Tools Box',
  };
}

// BUG FIX response time: matikan reasoning/thinking mode di semua request
function buildBody(
  model: ModelId,
  messages: ChatMessage[],
  stream: boolean
): Record<string, unknown> {
  return {
    model,
    messages,
    max_tokens: 4096,
    temperature: 0.2,
    stream,
    // Matikan reasoning/thinking mode:
    reasoning: { effort: 'none' }, // untuk model yang support parameter ini
    // Atau via provider-specific:
    extra_body: {
      reasoning_effort: 'none',
      thinking: { type: 'disabled' },
    },
  };
}

/** Urutkan chain: model pilihan user dulu, sisanya sesuai MODEL_CHAIN. */
function resolveChain(preferred?: string): ModelId[] {
  if (!isValidModel(preferred)) return MODEL_CHAIN;
  return [preferred, ...MODEL_CHAIN.filter((m) => m !== preferred)];
}

/** Non-streaming completion dengan fallback chain. */
export async function chatCompletion(
  messages: ChatMessage[],
  preferredModel?: string
): Promise<string> {
  const chain = resolveChain(preferredModel);
  let lastError: Error = new Error('AI unavailable');

  for (const model of chain) {
    if (isLexcodeClaudeModel(model)) {
      try {
        const system = messages.find((m) => m.role === 'system')?.content;
        const text = messages
          .filter((m) => m.role !== 'system')
          .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
          .join('\n\n');
        const answer = await fetchLexcodeClaude(text, system);
        if (answer.trim()) return answer;
        lastError = new Error('Empty LexCode response');
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('LexCode unavailable');
      }
      continue;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const apiKey = getApiKey();
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: buildHeaders(apiKey),
        body: JSON.stringify(buildBody(model, messages, false)),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const text = await res.text();
        lastError = new Error(`OpenRouter error: ${res.status} ${text}`);
        continue; // coba model berikutnya di chain
      }

      const json: unknown = await res.json();
      if (typeof json !== 'object' || json === null) {
        lastError = new Error('Invalid response from OpenRouter');
        continue;
      }

      const obj = json as Record<string, unknown>;
      const choices = obj.choices as Array<Record<string, unknown>> | undefined;
      if (!choices || !choices[0]) {
        lastError = new Error('No choices in response');
        continue;
      }

      const message = choices[0].message as Record<string, unknown> | undefined;
      const content = (message?.content || '') as string;
      if (!content.trim()) {
        lastError = new Error('Empty response');
        continue;
      }
      return content;
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        lastError = new Error('timeout');
      } else if (err instanceof Error) {
        lastError = err;
      }
    }
  }

  throw lastError;
}

/** Streaming completion (SSE body dari OpenRouter) dengan fallback chain. */
export async function chatCompletionStream(
  messages: ChatMessage[],
  preferredModel?: string
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = getApiKey();
  const chain = resolveChain(preferredModel);
  let lastError: Error = new Error('AI unavailable');

  for (const model of chain) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: buildHeaders(apiKey),
        body: JSON.stringify(buildBody(model, messages, true)),
      });

      if (!res.ok) {
        const text = await res.text();
        lastError = new Error(`OpenRouter error: ${res.status} ${text}`);
        continue;
      }

      if (!res.body) {
        lastError = new Error('No response body');
        continue;
      }

      return res.body;
    } catch (err) {
      if (err instanceof Error) lastError = err;
    }
  }

  throw lastError;
}

/** Backward-compatible wrapper untuk review route (existing). */
export async function fetchReview(
  prompt: string,
  preferredModel?: string
): Promise<string> {
  return chatCompletion(
    [
      {
        role: 'system',
        content:
          'You are an expert code reviewer. Return JSON only, no markdown, no explanation, no backticks.',
      },
      { role: 'user', content: prompt },
    ],
    preferredModel
  );
}
