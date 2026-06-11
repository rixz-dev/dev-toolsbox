'use client';

import { useReducer } from 'react';
import { motion } from 'framer-motion';
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
  too_long: 'Code too long. Max ~5000 lines recommended.',
  no_key: 'API key missing. Contact admin.',
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
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-surface)]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-orange)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                Dev - Tools Box
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                v1.0
              </span>
            </div>
          </motion.div>
          <motion.a
            href="https://riz-dev-murex.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.02 }}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-orange)] transition-colors"
          >
            by reiz_riz
          </motion.a>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row max-w-[1600px] mx-auto w-full p-4 md:p-6 gap-4 md:gap-6">
        <div className="w-full md:w-[40%] min-h-[50vh] md:min-h-[calc(100vh-3.5rem-3rem)]">
          <CodeInput onSubmit={handleSubmit} loading={state.loading} />
        </div>
        <div className="w-full md:w-[60%] min-h-[50vh] md:min-h-[calc(100vh-3.5rem-3rem)]">
          <ReviewOutput
            result={state.result}
            loading={state.loading}
            error={state.error}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-4">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
          <span>Dev - Tools Box v1.0 — AI Code Reviewer</span>
          <a
            href="https://riz-dev-murex.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--accent-orange)] transition-colors"
          >
            Creator: reiz_riz
          </a>
        </div>
      </footer>
    </div>
  );
}
