import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/openrouter';
import { extractJSONObject } from '@/lib/json';

const SYSTEM_PROMPT =
  'You generate conventional commit messages from a git diff or change description. ' +
  'Return a JSON object ONLY — no markdown, no explanation, no backticks. Schema: ' +
  '{ "commits": [ { "type": "feat|fix|chore|refactor|docs|test|style|perf", ' +
  '"scope": string (optional), "message": string, "body": string (optional), ' +
  '"breaking": boolean } ], "recommended": number (index) }. ' +
  'Return minimum 1, maximum 3 commit options. "recommended" is the index of the best fit.';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input = body.input;
    const mode = body.mode === 'diff' ? 'diff' : 'description';
    const model = typeof body.model === 'string' ? body.model : undefined;

    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'empty_input' },
        { status: 400 }
      );
    }

    if (input.length > 200000) {
      return NextResponse.json(
        { success: false, error: 'too_long' },
        { status: 400 }
      );
    }

    const userContent =
      mode === 'diff'
        ? `Generate conventional commit message(s) for this git diff:\n\n${input}`
        : `Generate conventional commit message(s) for these described changes:\n\n${input}`;

    const raw = await chatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      model
    );

    const data = extractJSONObject(raw);
    if (!Array.isArray(data.commits) || data.commits.length === 0) {
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
