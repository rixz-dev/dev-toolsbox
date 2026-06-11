'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bug,
  Loader2,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Wrench,
  ShieldCheck,
} from 'lucide-react';
import { ModelSelector } from '@/components/ModelSelector';
import { CopyButton } from '@/components/CopyButton';
import { DEFAULT_MODEL, type ModelId } from '@/lib/models';

interface DecodeResult {
  language: string;
  error_type: string;
  root_cause: string;
  explanation: string;
  fix: string;
  prevention: string;
}

const SECTIONS = [
  { key: 'root_cause', title: 'Root Cause', icon: AlertTriangle, color: 'var(--critical)' },
  { key: 'explanation', title: 'Explanation', icon: Lightbulb, color: 'var(--warning)' },
  { key: 'fix', title: 'Fix', icon: Wrench, color: 'var(--accent-cyan)' },
  { key: 'prevention', title: 'Prevention', icon: ShieldCheck, color: 'var(--success)' },
] as const;

export default function ErrorDecoderPage() {
  const [input, setInput] = useState('');
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DecodeResult | null>(null);

  const handleDecode = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/error-decode', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: input, model }),
      });
      const json = (await res.json()) as Record<string, unknown>;
      if (!json.success || !json.data) {
        throw new Error('AI is busy. Try again in a moment.');
      }
      setResult(json.data as DecodeResult);
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
            <Bug size={20} className="text-[var(--accent-orange)]" />
            Error Decoder
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Paste any error message or stack trace — get root cause, fix, and
            prevention.
          </p>
        </div>
        <ModelSelector value={model} onChange={setModel} />
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={8}
          placeholder={`TypeError: Cannot read properties of undefined (reading 'map')\n    at App (App.tsx:12:24)\n    ...`}
          className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3 text-sm font-mono resize-y outline-none focus:border-[var(--accent-orange)]/40 placeholder:text-[var(--text-muted)]"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={() => void handleDecode()}
            disabled={loading || !input.trim()}
            className="shimmer flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--accent-orange)] text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {loading ? 'Decoding...' : 'Decode Error'}
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
          className="space-y-4"
        >
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="px-2.5 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--accent-cyan)]">
              {result.language}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--warning)] font-mono">
              {result.error_type}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const value = result[section.key];
              const isFix = section.key === 'fix';
              return (
                <div
                  key={section.key}
                  className={`bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 ${
                    isFix ? 'md:col-span-2' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="flex items-center gap-2 text-sm font-bold">
                      <Icon size={15} style={{ color: section.color }} />
                      {section.title}
                    </h2>
                    {isFix && <CopyButton text={value} />}
                  </div>
                  {isFix ? (
                    <pre className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                      {value}
                    </pre>
                  ) : (
                    <p className="text-sm text-[var(--text-primary)]/90 leading-relaxed whitespace-pre-wrap">
                      {value}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </main>
  );
}
