'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, FileCode, Settings } from 'lucide-react';

const LANGUAGES = [
  'Auto-detect',
  'TypeScript',
  'JavaScript',
  'Python',
  'Java',
  'C++',
  'Go',
  'Rust',
  'Ruby',
  'PHP',
];

const SCOPES = [
  'Security',
  'Performance',
  'Readability',
  'Bugs',
  'Best Practices',
] as const;

interface CodeInputProps {
  onSubmit: (data: {
    code: string;
    language: string;
    scope: string[];
  }) => void;
  loading: boolean;
}

export function CodeInput({ onSubmit, loading }: CodeInputProps) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('Auto-detect');
  const [scope, setScope] = useState<string[]>([
    'Security',
    'Performance',
    'Bugs',
    'Best Practices',
  ]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!code.trim()) {
      setError('Paste your code first.');
      return;
    }
    if (code.length > 20000) {
      setError('Code too long. Max ~500 lines recommended.');
      return;
    }
    setError(null);
    onSubmit({ code, language, scope });
  };

  const toggleScope = (key: string) => {
    setScope((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 md:p-6 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)]">
      <div className="flex items-center gap-2 text-[var(--accent-orange)]">
        <FileCode size={18} />
        <h2 className="text-sm font-bold uppercase tracking-wider">
          Code Input
        </h2>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Settings size={14} className="text-[var(--text-muted)]" />
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
            Language
          </span>
        </div>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-orange)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Settings size={14} className="text-[var(--text-muted)]" />
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
            Review Scope
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SCOPES.map((key) => (
            <button
              key={key}
              onClick={() => toggleScope(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                scope.includes(key)
                  ? 'bg-[var(--accent-orange)]/10 border-[var(--accent-orange)] text-[var(--accent-orange)]'
                  : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)]'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 relative min-h-[200px]">
        <textarea
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          placeholder="Paste your code here..."
          className="w-full h-full min-h-[200px] bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-orange)] resize-none"
          style={{ fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}
          spellCheck={false}
        />
        <div
          className="absolute bottom-2 right-2 text-xs text-[var(--text-muted)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {code.length} chars
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-3 py-2 rounded-lg bg-[var(--critical)]/10 border border-[var(--critical)]/20 text-[var(--critical)] text-sm"
        >
          {error}
        </motion.div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[var(--accent-orange)] text-white font-bold text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {loading ? (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            Analyzing...
          </motion.div>
        ) : (
          <>
            <Send size={16} />
            Analyze Code
          </>
        )}
      </button>
    </div>
  );
}
