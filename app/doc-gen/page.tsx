'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2, Sparkles } from 'lucide-react';
import { ModelSelector } from '@/components/ModelSelector';
import { CopyButton } from '@/components/CopyButton';
import { DEFAULT_MODEL, type ModelId } from '@/lib/models';

interface DocResult {
  language: string;
  doc_style: string;
  documented_code: string;
  summary: string;
}

const DOC_STYLES = [
  { value: 'auto', label: 'Auto' },
  { value: 'jsdoc', label: 'JSDoc' },
  { value: 'docstring', label: 'Python Docstring' },
  { value: 'inline', label: 'Inline Comments' },
] as const;

export default function DocGenPage() {
  const [code, setCode] = useState('');
  const [style, setStyle] = useState<string>('auto');
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DocResult | null>(null);

  const handleGenerate = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/doc', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code, style, model }),
      });
      const json = (await res.json()) as Record<string, unknown>;
      if (!json.success || !json.data) {
        throw new Error('AI is busy. Try again in a moment.');
      }
      setResult(json.data as DocResult);
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
            <FileText size={20} className="text-[var(--accent-orange)]" />
            Doc Generator
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Paste code — get JSDoc, docstrings, or inline comments
            automatically.
          </p>
        </div>
        <ModelSelector value={model} onChange={setModel} />
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4">
        {/* Doc style selector */}
        <div className="flex items-center gap-1 mb-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-1 w-fit flex-wrap">
          {DOC_STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStyle(s.value)}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                style === s.value
                  ? 'bg-[var(--bg-elevated)] text-[var(--accent-orange)] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={12}
          placeholder={`function debounce(fn, delay) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n}`}
          className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3 text-sm font-mono resize-y outline-none focus:border-[var(--accent-orange)]/40 placeholder:text-[var(--text-muted)]"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={() => void handleGenerate()}
            disabled={loading || !code.trim()}
            className="shimmer flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--accent-orange)] text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {loading ? 'Documenting...' : 'Generate Docs'}
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
          {/* Summary di atas output */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h2 className="text-sm font-bold">Summary</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--accent-cyan)]">
                {result.language}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--accent-orange)] font-mono">
                {result.doc_style}
              </span>
            </div>
            <p className="text-sm text-[var(--text-primary)]/90 leading-relaxed">
              {result.summary}
            </p>
          </div>

          {/* Documented code */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold">Documented Code</h2>
              <CopyButton text={result.documented_code} />
            </div>
            <pre className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre">
              {result.documented_code}
            </pre>
          </div>
        </motion.div>
      )}
    </main>
  );
}
