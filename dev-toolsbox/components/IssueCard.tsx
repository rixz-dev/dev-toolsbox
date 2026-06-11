'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Copy, Check } from 'lucide-react';
import type { ReviewIssue } from '@/lib/parser';

const SEVERITY_CONFIG = {
  critical: {
    color: 'var(--critical)',
    label: 'Critical',
    glow: 'rgba(255,59,59,0.15)',
  },
  warning: {
    color: 'var(--warning)',
    label: 'Warning',
    glow: 'rgba(255,184,0,0.15)',
  },
  suggestion: {
    color: 'var(--suggestion)',
    label: 'Suggestion',
    glow: 'rgba(0,212,255,0.15)',
  },
};

const CATEGORY_CONFIG = {
  security: { label: 'Security' },
  performance: { label: 'Performance' },
  readability: { label: 'Readability' },
  bugs: { label: 'Bugs' },
  best_practices: { label: 'Best Practices' },
};

interface IssueCardProps {
  issue: ReviewIssue;
  index: number;
}

export function IssueCard({ issue, index }: IssueCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const severity = SEVERITY_CONFIG[issue.severity];
  const category = CATEGORY_CONFIG[issue.category];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(issue.fix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.3, ease: 'easeOut' },
        },
      }}
      className="group rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden transition-all hover:-translate-y-0.5 hover:border-[var(--text-muted)]/20"
      style={{ transitionProperty: 'transform, border-color' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
              style={{
                color: severity.color,
                borderColor: severity.color,
                backgroundColor: severity.glow,
                boxShadow: `0 0 12px ${severity.glow}`,
              }}
            >
              {severity.label}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[var(--border)] text-[var(--text-muted)] bg-[var(--bg-elevated)]">
              {category.label}
            </span>
          </div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-orange)] transition-colors">
            {issue.title}
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {issue.description}
          </p>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="mt-1 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors"
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0.95 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ transformOrigin: 'top' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-3">
              {issue.line_hint && (
                <div className="rounded-xl bg-[var(--bg-elevated)] p-3 border border-[var(--border)]">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Relevant Snippet
                  </p>
                  <code
                    className="text-xs text-[var(--text-muted)] block"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {issue.line_hint}
                  </code>
                </div>
              )}

              <div className="relative rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] overflow-hidden group/code hover:border-[var(--accent-cyan)]/20 transition-colors">
                <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    Suggested Fix
                  </span>
                  <motion.button
                    onClick={handleCopy}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy'}
                  </motion.button>
                </div>
                <pre
                  className="p-3 text-xs overflow-x-auto"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  <code className="text-[var(--text-primary)]">
                    {issue.fix}
                  </code>
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
