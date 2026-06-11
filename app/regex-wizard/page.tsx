'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Loader2, Sparkles, Check, X } from 'lucide-react';
import { ModelSelector } from '@/components/ModelSelector';
import { CopyButton } from '@/components/CopyButton';
import { DEFAULT_MODEL, type ModelId } from '@/lib/models';
import { LoadingWithGames } from '@/components/LoadingWithGames';

interface RegexResult {
  regex: string;
  flags: string;
  explanation: string;
  breakdown: Array<{ part: string; meaning: string }>;
  examples: {
    matches: string[];
    non_matches: string[];
  };
}

/** Live tester logic — pure frontend, tidak ada API call. */
function highlightMatches(
  testString: string,
  pattern: string,
  flags: string
): { ok: boolean; nodes: React.ReactNode[]; count: number } {
  try {
    // pastikan flag g supaya bisa iterate semua match
    const safeFlags = flags.includes('g') ? flags : flags + 'g';
    const re = new RegExp(pattern, safeFlags);
    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    let count = 0;
    let m: RegExpExecArray | null;

    while ((m = re.exec(testString)) !== null) {
      if (m.index > lastIndex) {
        nodes.push(testString.slice(lastIndex, m.index));
      }
      nodes.push(
        <mark
          key={`${m.index}-${count}`}
          className="bg-[var(--accent-orange)]/30 text-[var(--text-primary)] rounded px-0.5"
        >
          {m[0] || '∅'}
        </mark>
      );
      lastIndex = m.index + m[0].length;
      count++;
      // hindari infinite loop pada zero-length match
      if (m[0].length === 0) re.lastIndex++;
      if (count > 5000) break;
    }
    if (lastIndex < testString.length) {
      nodes.push(testString.slice(lastIndex));
    }
    return { ok: true, nodes, count };
  } catch {
    return { ok: false, nodes: [testString], count: 0 };
  }
}

export default function RegexWizardPage() {
  const [description, setDescription] = useState('');
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RegexResult | null>(null);
  const [testString, setTestString] = useState('');

  const handleGenerate = async () => {
    if (!description.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/regex', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ description, model }),
      });
      const json = (await res.json()) as Record<string, unknown>;
      if (!json.success || !json.data) {
        throw new Error('AI is busy. Try again in a moment.');
      }
      setResult(json.data as RegexResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI is busy. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const tested = useMemo(() => {
    if (!result || !testString) return null;
    return highlightMatches(testString, result.regex, result.flags || '');
  }, [result, testString]);

  const fullPattern = result
    ? `/${result.regex}/${result.flags || ''}`
    : '';

  return (
    <main className="flex-1 max-w-[1100px] mx-auto w-full p-4 md:p-6 space-y-5">
      <LoadingWithGames isOpen={loading} message="Conjuring regex pattern..." />
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold flex items-center gap-2">
            <Wand2 size={20} className="text-[var(--accent-orange)]" />
            Regex Wizard
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Describe a pattern in natural language — get regex, breakdown, and
            a live tester.
          </p>
        </div>
        <ModelSelector value={model} onChange={setModel} />
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="e.g. match email addresses ending in .id or .com, case-insensitive"
          className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3 text-sm resize-y outline-none focus:border-[var(--accent-orange)]/40 placeholder:text-[var(--text-muted)]"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={() => void handleGenerate()}
            disabled={loading || !description.trim()}
            className="shimmer flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--accent-orange)] text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {loading ? 'Conjuring...' : 'Generate Regex'}
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
          {/* Pattern besar + copy */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold">Pattern</h2>
              <CopyButton text={fullPattern} />
            </div>
            <pre className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4 text-base md:text-lg font-mono overflow-x-auto text-[var(--accent-cyan)]">
              {fullPattern}
            </pre>
            <p className="text-sm text-[var(--text-muted)] mt-3 leading-relaxed">
              {result.explanation}
            </p>
          </div>

          {/* Breakdown table */}
          {Array.isArray(result.breakdown) && result.breakdown.length > 0 && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 overflow-x-auto">
              <h2 className="text-sm font-bold mb-3">Breakdown</h2>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)]">
                    <th className="py-2 pr-4 font-bold">Pattern Part</th>
                    <th className="py-2 font-bold">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {result.breakdown.map((b, i) => (
                    <tr
                      key={i}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <td className="py-2 pr-4 font-mono text-[var(--accent-orange)] whitespace-nowrap">
                        {b.part}
                      </td>
                      <td className="py-2 text-[var(--text-primary)]/85">
                        {b.meaning}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Examples */}
          {result.examples && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4">
                <h2 className="flex items-center gap-2 text-sm font-bold mb-2 text-[var(--success)]">
                  <Check size={14} /> Matches
                </h2>
                <ul className="space-y-1 text-xs font-mono">
                  {(result.examples.matches ?? []).map((ex, i) => (
                    <li key={i} className="break-all">{ex}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4">
                <h2 className="flex items-center gap-2 text-sm font-bold mb-2 text-[var(--critical)]">
                  <X size={14} /> Non-matches
                </h2>
                <ul className="space-y-1 text-xs font-mono">
                  {(result.examples.non_matches ?? []).map((ex, i) => (
                    <li key={i} className="break-all">{ex}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Live tester — pure JS frontend */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold">Live Tester</h2>
              {tested && tested.ok && (
                <span className="text-xs text-[var(--text-muted)]">
                  {tested.count} match{tested.count !== 1 ? 'es' : ''}
                </span>
              )}
            </div>
            <textarea
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              rows={4}
              placeholder="Type or paste test text here — matches highlight in real-time"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3 text-sm font-mono resize-y outline-none focus:border-[var(--accent-cyan)]/40 placeholder:text-[var(--text-muted)]"
            />
            {testString && tested && (
              <div className="mt-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3 text-sm font-mono whitespace-pre-wrap break-words">
                {tested.ok ? (
                  tested.nodes
                ) : (
                  <span className="text-[var(--critical)]">
                    Invalid regex — cannot run in JS RegExp.
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </main>
  );
}
