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
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center bg-[var(--bg-surface)] rounded-xl border border-[var(--border)]">
        <FileSearch size={40} className="text-[var(--critical)]" />
        <p className="text-sm text-[var(--text-primary)]">{error}</p>
      </div>
    );
  }

  if (!result && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center bg-[var(--bg-surface)] rounded-xl border border-[var(--border)]">
        <FileSearch size={40} className="text-[var(--text-muted)]" />
        <p className="text-sm text-[var(--text-muted)]">
          Paste code and click Analyze to start.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="p-4 md:p-6 border-b border-[var(--border)] flex flex-col md:flex-row md:items-center gap-4">
        {result && (
          <>
            <ScoreGauge score={result.overall_score} grade={result.grade} />
            <div className="flex-1">
              <h2
                className="text-lg font-bold"
                style={{ fontFamily: 'var(--font-syne)' }}
              >
                Review Result
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {result.summary}
              </p>
            </div>
          </>
        )}
        {loading && !result && (
          <div className="flex items-center gap-4 w-full">
            <div className="w-20 h-20 rounded-full bg-[var(--bg-elevated)] animate-pulse" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-5 w-32 bg-[var(--bg-elevated)] rounded animate-pulse" />
              <div className="h-4 w-full bg-[var(--bg-elevated)] rounded animate-pulse" />
            </div>
          </div>
        )}
      </div>

      <div className="flex border-b border-[var(--border)]">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
              tab === key
                ? 'text-[var(--accent-orange)] border-b-2 border-[var(--accent-orange)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
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
                  className="h-24 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)] animate-pulse"
                />
              ))}
            </motion.div>
          ) : tab === 'issues' ? (
            <motion.div
              key="issues"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-wrap gap-2 mb-2">
                {FILTERS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
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
                <div className="text-center py-8 text-[var(--text-muted)] text-sm">
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              {result?.positives.length ? (
                result.positives.map((positive, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: i * 0.05,
                      ease: 'easeOut',
                    }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]"
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
                <div className="text-center py-8 text-[var(--text-muted)] text-sm">
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
              <div className="absolute top-2 right-2 z-10">
                <CopyButton text={result?.fixed_code || ''} />
              </div>
              <pre
                className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-4 text-xs overflow-x-auto"
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
    </div>
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
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border)] text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
