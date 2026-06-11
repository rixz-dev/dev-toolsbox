'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Globe } from 'lucide-react';

export interface SearchSource {
  url: string;
  title: string;
  content: string;
}

interface SearchSourcesProps {
  sources: SearchSource[];
}

export function SearchSources({ sources }: SearchSourcesProps) {
  const [open, setOpen] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="mt-2 border border-[var(--border)] rounded-lg bg-[var(--bg-surface)] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <Globe size={13} className="text-[var(--accent-cyan)]" />
        <span>
          {sources.length} web source{sources.length > 1 ? 's' : ''}
        </span>
      </button>
      {open && (
        <ul className="px-3 pb-3 space-y-2">
          {sources.map((s, i) => (
            <li key={i} className="text-xs">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-cyan)] hover:underline break-all"
              >
                {s.title || s.url}
              </a>
              {s.content && (
                <p className="text-[var(--text-muted)] mt-0.5 line-clamp-2">
                  {s.content}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
