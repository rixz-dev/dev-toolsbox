import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/openrouter';
import { extractJSONObject } from '@/lib/json';

const SYSTEM_PROMPT =
  'You generate documentation for code: JSDoc for JS/TS, docstrings for Python, or inline comments. ' +
  'Return a JSON object ONLY — no markdown, no explanation, no backticks. Schema: ' +
  '{ "language": string, "doc_style": "jsdoc|docstring|inline", ' +
  '"documented_code": string (full code with docs inserted), ' +
  '"summary": string (what this code does) }';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const code = body.code;
    const styleRaw = body.style;
    const model = typeof body.model === 'string' ? body.model : undefined;

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'empty_input' },
        { status: 400 }
      );
    }

    if (code.length > 200000) {
      return NextResponse.json(
        { success: false, error: 'too_long' },
        { status: 400 }
      );
    }

    const style =
      styleRaw === 'jsdoc' ||
      styleRaw === 'docstring' ||
      styleRaw === 'inline'
        ? styleRaw
        : 'auto';

    const styleInstruction =
      style === 'auto'
        ? 'Choose the most appropriate doc style for the detected language.'
        : `Use the "${style}" documentation style.`;

    const raw = await chatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `${styleInstruction}\n\nDocument this code:\n\n${code}`,
        },
      ],
      model
    );

    const data = extractJSONObject(raw);
    if (typeof data.documented_code !== 'string') {
      throw new Error('Invalid schema');
    }

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
