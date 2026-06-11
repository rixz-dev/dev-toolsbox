'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GitCommitHorizontal,
  Loader2,
  Sparkles,
  Star,
} from 'lucide-react';
import { ModelSelector } from '@/components/ModelSelector';
import { CopyButton } from '@/components/CopyButton';
import { DEFAULT_MODEL, type ModelId } from '@/lib/models';

interface CommitOption {
  type: string;
  scope?: string;
  message: string;
  body?: string;
  breaking: boolean;
}

interface CommitResult {
  commits: CommitOption[];
  recommended: number;
}

function formatCommit(c: CommitOption): string {
  const scope = c.scope ? `(${c.scope})` : '';
  const bang = c.breaking ? '!' : '';
  const header = `${c.type}${scope}${bang}: ${c.message}`;
  return c.body ? `${header}\n\n${c.body}` : header;
}

export default function CommitGenPage() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'diff' | 'description'>('diff');
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CommitResult | null>(null);

  const handleGenerate = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/commit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input, mode, model }),
      });
      const json = (await res.json()) as Record<string, unknown>;
      if (!json.success || !json.data) {
        throw new Error('AI is busy. Try again in a moment.');
      }
      setResult(json.data as CommitResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI is busy. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 max-w-[1100px] mx-auto w-full p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold flex items-center gap-2">
            <GitCommitHorizontal
              size={20}
              className="text-[var(--accent-orange)]"
            />
            Git Commit Generator
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Paste a diff or describe your changes — get conventional commit
            messages.
          </p>
        </div>
        <ModelSelector value={model} onChange={setModel} />
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4">
        {/* Toggle: diff vs describe */}
        <div className="flex items-center gap-1 mb-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-1 w-fit">
          <button
            onClick={() => setMode('diff')}
            className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
              mode === 'diff'
                ? 'bg-[var(--bg-elevated)] text-[var(--accent-orange)] font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            I have a diff
          </button>
          <button
            onClick={() => setMode('description')}
            className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
              mode === 'description'
                ? 'bg-[var(--bg-elevated)] text-[var(--accent-orange)] font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Describe changes
          </button>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={10}
          placeholder={
            mode === 'diff'
              ? 'diff --git a/src/auth.ts b/src/auth.ts\n+ export function refreshToken() { ... }'
              : 'Added token refresh logic to the auth module and fixed logout redirect bug'
          }
          className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3 text-sm font-mono resize-y outline-none focus:border-[var(--accent-orange)]/40 placeholder:text-[var(--text-muted)]"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={() => void handleGenerate()}
            disabled={loading || !input.trim()}
            className="shimmer flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--accent-orange)] text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {loading ? 'Generating...' : 'Generate Commits'}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-xs text-[var(--critical)] border border-[var(--critical)]/30 bg-[var(--critical)]/5 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {result.commits.map((c, i) => {
            const isRecommended = i === result.recommended;
            const fullText = formatCommit(c);
            return (
              <div
                key={i}
                className={`bg-[var(--bg-surface)] border rounded-2xl p-4 ${
                  isRecommended
                    ? 'border-[var(--accent-orange)]/60 ring-1 ring-[var(--accent-orange)]/20'
                    : 'border-[var(--border)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--accent-cyan)]">
                      {c.type}
                      {c.scope ? `(${c.scope})` : ''}
                    </span>
                    {c.breaking && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--critical)]/10 border border-[var(--critical)]/30 text-[var(--critical)]">
                        BREAKING
                      </span>
                    )}
                    {isRecommended && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-orange)]/10 border border-[var(--accent-orange)]/30 text-[var(--accent-orange)]">
                        <Star size={10} /> Recommended
                      </span>
                    )}
                  </div>
                  <CopyButton text={fullText} />
                </div>
                <pre className="text-sm font-mono whitespace-pre-wrap break-words text-[var(--text-primary)]/90">
                  {fullText}
                </pre>
              </div>
            );
          })}
        </motion.div>
      )}
    </main>
  );
}
