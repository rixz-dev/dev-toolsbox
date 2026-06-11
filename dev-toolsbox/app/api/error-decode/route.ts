import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/openrouter';
import { extractJSONObject } from '@/lib/json';

const SYSTEM_PROMPT =
  'You are an expert debugger. The user pastes an error message or stack trace from any language. ' +
  'Return a JSON object ONLY — no markdown, no explanation, no backticks. Schema: ' +
  '{ "language": string (detected), "error_type": string, "root_cause": string, ' +
  '"explanation": string, "fix": string (code or steps), "prevention": string }';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const errorText = body.error;
    const model = typeof body.model === 'string' ? body.model : undefined;

    if (
      !errorText ||
      typeof errorText !== 'string' ||
      errorText.trim().length === 0
    ) {
      return NextResponse.json(
        { success: false, error: 'empty_input' },
        { status: 400 }
      );
    }

    if (errorText.length > 100000) {
      return NextResponse.json(
        { success: false, error: 'too_long' },
        { status: 400 }
      );
    }

    const raw = await chatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Decode this error/stack trace:\n\n${errorText}`,
        },
      ],
      model
    );

    const data = extractJSONObject(raw);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    const status = message === 'timeout' ? 504 : 503;
    return NextResponse.json(
      { success: false, error: message === 'timeout' ? 'timeout' : 'unavailable' },
      { status }
    );
  }
}
