'use client';

import { useReducer } from 'react';
import { CodeInput } from '@/components/CodeInput';
import { ReviewOutput } from '@/components/ReviewOutput';
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
  too_long: 'Code too long. Max ~500 lines recommended.',
};

export default function Home() {
  const [state, dispatch] = useReducer(reducer, {
    result: null,
    loading: false,
    error: null,
  });

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
          options: { scope: data.scope },
        }),
      });

      const json = (await res.json()) as Record<string, unknown>;

      if (!json.success || !json.data) {
        const errorKey =
          typeof json.error === 'string' ? json.error : 'unavailable';
        dispatch({
          type: 'ERROR',
          payload:
            ERROR_MESSAGES[errorKey] || ERROR_MESSAGES.unavailable,
        });
        return;
      }

      dispatch({ type: 'SUCCESS', payload: json.data as ReviewResult });
    } catch {
      dispatch({ type: 'ERROR', payload: ERROR_MESSAGES.unavailable });
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      <div className="w-full md:w-[40%] p-4 md:p-6 border-r border-[var(--border)] min-h-[50vh] md:min-h-screen">
        <CodeInput onSubmit={handleSubmit} loading={state.loading} />
      </div>
      <div className="w-full md:w-[60%] p-4 md:p-6 min-h-[50vh] md:min-h-screen">
        <ReviewOutput
          result={state.result}
          loading={state.loading}
          error={state.error}
        />
      </div>
    </main>
  );
}
