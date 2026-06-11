'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ThumbsUp,
  Code2,
  FileSearch,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import type { ReviewResult } from '@/lib/parser';
import { ScoreGauge } from './ScoreGauge';
import { IssueCard } from './IssueCard';

type Tab = 'issues' | 'positives' | 'fixed';
type Filter = 'all' | 'critical' | 'warning' | 'suggestion';

interface ReviewOutputProps {
  result: ReviewResult | null;
  loading: boolean;
  error: string | null;
}

const TABS = [
  { key: 'issues' as Tab, label: 'Issues', icon: AlertTriangle },
  { key: 'positives' as Tab, label: 'Positives', icon: ThumbsUp },
  { key: 'fixed' as Tab, label: 'Fixed Code', icon: Code2 },
];

const FILTERS = [
  { key: 'all' as Filter, label: 'All' },
  { key: 'critical' as Filter, label: 'Critical' },
  { key: 'warning' as Filter, label: 'Warning' },
  { key: 'suggestion' as Filter, label: 'Suggestion' },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

export function ReviewOutput({
  result,
  loading,
  error,
}: ReviewOutputProps) {
  const [tab, setTab] = useState<Tab>('issues');
  const [filter, setFilter] = useState<Filter>('all');

  const filteredIssues =
    result?.issues.filter(
      (issue) => filter === 'all' || issue.severity === filter
    ) || [];

  if (error && !result) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)]"
      >
        <div className="w-16 h-16 rounded-full bg-[var(--critical)]/10 flex items-center justify-center">
          <FileSearch size={32} className="text-[var(--critical)]" />
        </div>
        <p className="text-sm text-[var(--text-primary)]">{error}</p>
      </motion.div>
    );
  }

  if (!result && !loading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)]"
      >
        <div className="w-16 h-16 rounded-full bg-[var(--accent-orange)]/10 flex items-center justify-center animate-pulse">
          <Zap size={32} className="text-[var(--accent-orange)]" />
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Paste code and click Analyze to start.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col h-full bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden relative"
    >
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-64 h-64 bg-[var(--accent-cyan)]/5 rounded-full blur-3xl" />

      <div className="relative p-5 md:p-6 border-b border-[var(--border)] flex flex-col md:flex-row md:items-center gap-5">
        {result && (
          <>
            <ScoreGauge score={result.overall_score} grade={result.grade} />
            <div className="flex-1">
              <h2
                className="text-xl font-bold bg-gradient-to-r from-[var(--accent-orange)] to-[var(--accent-cyan)] bg-clip-text text-transparent"
                style={{ fontFamily: 'var(--font-syne)' }}
              >
                Review Result
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1 leading-relaxed">
                {result.summary}
              </p>
            </div>
          </>
        )}
        {loading && !result && (
          <div className="flex items-center gap-4 w-full">
            <div className="w-20 h-20 rounded-full bg-[var(--bg-elevated)] animate-pulse border border-[var(--border)]" />
            <div className="flex-1 flex flex-col gap-3">
              <div className="h-5 w-32 bg-[var(--bg-elevated)] rounded-lg animate-pulse" />
              <div className="h-4 w-full bg-[var(--bg-elevated)] rounded-lg animate-pulse" />
            </div>
          </div>
        )}
      </div>

      <div className="relative flex border-b border-[var(--border)] bg-[var(--bg-elevated)]/40">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              tab === key
                ? 'text-[var(--accent-orange)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Icon size={14} />
            {label}
            {tab === key && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-orange)]"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 md:p-6">
        <AnimatePresence mode="wait">
          {loading && !result ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)] animate-pulse"
                />
              ))}
            </motion.div>
          ) : tab === 'issues' ? (
            <motion.div
              key="issues"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-wrap gap-2 mb-2">
                {FILTERS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      filter === key
                        ? 'bg-[var(--accent-orange)]/10 border-[var(--accent-orange)] text-[var(--accent-orange)]'
                        : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {filteredIssues.length === 0 ? (
                <div className="text-center py-10 text-[var(--text-muted)] text-sm">
                  No issues found.
                </div>
              ) : (
                filteredIssues.map((issue, i) => (
                  <IssueCard
                    key={`${issue.title}-${i}`}
                    issue={issue}
                    index={i}
                  />
                ))
              )}
            </motion.div>
          ) : tab === 'positives' ? (
            <motion.div
              key="positives"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              {result?.positives.length ? (
                result.positives.map((positive, i) => (
                  <motion.div
                    key={i}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.25, ease: 'easeOut' },
                      },
                    }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--success)]/30 transition-colors"
                  >
                    <ThumbsUp
                      size={16}
                      className="text-[var(--success)] mt-0.5 shrink-0"
                    />
                    <p className="text-sm text-[var(--text-primary)]">
                      {positive}
                    </p>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-10 text-[var(--text-muted)] text-sm">
                  No positives found.
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="fixed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <div className="absolute top-3 right-3 z-10">
                <CopyButton text={result?.fixed_code || ''} />
              </div>
              <pre
                className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-4 text-xs overflow-x-auto hover:border-[var(--accent-cyan)]/20 transition-colors"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                <code className="text-[var(--text-primary)]">
                  {result?.fixed_code}
                </code>
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.button
      onClick={handleCopy}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-cyan)]/40 transition-colors"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy All'}
    </motion.button>
  );
}
