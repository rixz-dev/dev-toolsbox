'use client';

import { useReducer, useState } from 'react';
import { CodeInput } from '@/components/CodeInput';
import { ReviewOutput } from '@/components/ReviewOutput';
import { ModelSelector } from '@/components/ModelSelector';
import { DEFAULT_MODEL, type ModelId } from '@/lib/models';
import type { ReviewResult } from '@/lib/parser';

type State = {
  result: ReviewResult | null;
  loading: boolean;
  error: string | null;
};

type Action =
  | { type: 'START' }
  | { type: 'SUCCESS'; payload: ReviewResult }
  | { type: 'ERROR'; payload: string }
  | { type: 'RESET' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START':
      return { result: null, loading: true, error: null };
    case 'SUCCESS':
      return { result: action.payload, loading: false, error: null };
    case 'ERROR':
      return { result: null, loading: false, error: action.payload };
    case 'RESET':
      return { result: null, loading: false, error: null };
    default:
      return state;
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  timeout: 'Review timed out. Try shorter code.',
  parse: 'AI returned unexpected format. Retrying...',
  unavailable: 'AI is busy. Try again in a moment.',
  empty_code: 'Paste your code first.',
  too_long: 'Code too long. Max ~5000 lines recommended.',
  no_key: 'API key missing. Contact admin.',
};

export default function ReviewerPage() {
  const [state, dispatch] = useReducer(reducer, {
    result: null,
    loading: false,
    error: null,
  });
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);

  const handleSubmit = async (data: {
    code: string;
    language: string;
    scope: string[];
  }) => {
    dispatch({ type: 'START' });

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          code: data.code,
          language: data.language,
          model,
          options: { scope: data.scope },
        }),
      });

      const json = (await res.json()) as Record<string, unknown>;

      if (!json.success || !json.data) {
        const errorKey =
          typeof json.error === 'string' ? json.error : 'unavailable';
        dispatch({
          type: 'ERROR',
          payload: ERROR_MESSAGES[errorKey] || ERROR_MESSAGES.unavailable,
        });
        return;
      }

      dispatch({ type: 'SUCCESS', payload: json.data as ReviewResult });
    } catch {
      dispatch({ type: 'ERROR', payload: ERROR_MESSAGES.unavailable });
    }
  };

  return (
    <main className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full p-4 md:p-6 gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold">
            AI Code Reviewer
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Paste code, get a structured review with score and fixes.
          </p>
        </div>
        <ModelSelector value={model} onChange={setModel} />
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6">
        <div className="w-full md:w-[40%] min-h-[50vh] md:min-h-[calc(100vh-3.5rem-9rem)]">
          <CodeInput onSubmit={handleSubmit} loading={state.loading} />
        </div>
        <div className="w-full md:w-[60%] min-h-[50vh] md:min-h-[calc(100vh-3.5rem-9rem)]">
          <ReviewOutput
            result={state.result}
            loading={state.loading}
            error={state.error}
          />
        </div>
      </div>
    </main>
  );
}
