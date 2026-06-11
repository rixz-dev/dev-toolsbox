import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/openrouter';
import { extractJSONObject } from '@/lib/json';

const SYSTEM_PROMPT =
  'You convert natural language descriptions into regular expressions. ' +
  'Return a JSON object ONLY — no markdown, no explanation, no backticks. Schema: ' +
  '{ "regex": string (pattern only, no delimiters), "flags": string (e.g. "gim"), ' +
  '"explanation": string, "breakdown": [ { "part": string, "meaning": string } ], ' +
  '"examples": { "matches": [string], "non_matches": [string] } }';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const description = body.description;
    const model = typeof body.model === 'string' ? body.model : undefined;

    if (
      !description ||
      typeof description !== 'string' ||
      description.trim().length === 0
    ) {
      return NextResponse.json(
        { success: false, error: 'empty_input' },
        { status: 400 }
      );
    }

    const raw = await chatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Create a regex for: ${description}`,
        },
      ],
      model
    );

    const data = extractJSONObject(raw);
    if (typeof data.regex !== 'string') {
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
