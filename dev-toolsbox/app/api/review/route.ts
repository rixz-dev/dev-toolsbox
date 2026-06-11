import { NextRequest, NextResponse } from 'next/server';
import { buildPrompt } from '@/lib/prompt';
import { fetchReview } from '@/lib/openrouter';
import { extractJSON } from '@/lib/parser';

const ERROR_MESSAGES = {
  timeout: 'Review timed out. Try shorter code.',
  parse: 'AI returned unexpected format. Retrying...',
  unavailable: 'AI is busy. Try again in a moment.',
  empty_code: 'Paste your code first.',
  too_long: 'Code too long. Max ~5000 lines recommended.',
  no_key: 'API key missing. Contact admin.',
} as const;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const code = body.code;
    const options = body.options;
    const model = typeof body.model === 'string' ? body.model : undefined;

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'empty_code' },
        { status: 400 }
      );
    }

    if (code.length > 500000) {
      return NextResponse.json(
        { success: false, error: 'too_long' },
        { status: 400 }
      );
    }

    const opts =
      typeof options === 'object' && options !== null
        ? (options as Record<string, unknown>)
        : {};
    const scope = Array.isArray(opts.scope)
      ? opts.scope.join(', ')
      : 'general';
    const prompt = buildPrompt(code, scope);

    const raw = await fetchReview(prompt, model);
    const result = extractJSON(raw);

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    let errorKey: keyof typeof ERROR_MESSAGES = 'unavailable';

    if (message === 'timeout') {
      errorKey = 'timeout';
    } else if (
      message.includes('JSON') ||
      message.includes('schema') ||
      message.includes('parse') ||
      message.includes('No JSON found')
    ) {
      errorKey = 'parse';
    } else if (message.includes('API key')) {
      errorKey = 'no_key';
    }

    const status =
      errorKey === 'timeout' ? 504 : errorKey === 'parse' ? 422 : 503;

    return NextResponse.json(
      {
        success: false,
        error: errorKey,
        message: ERROR_MESSAGES[errorKey],
      },
      { status }
    );
  }
}
