'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ScanSearch,
  MessagesSquare,
  Bug,
  GitCommitHorizontal,
  Wand2,
  FileText,
  ArrowRight,
  Github,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';

const TOOLS = [
  {
    href: '/reviewer',
    icon: ScanSearch,
    name: 'AI Code Reviewer',
    description:
      'Structured AI review with severity-tiered issues, score, and fixed code.',
    status: 'Live',
  },
  {
    href: '/chat',
    icon: MessagesSquare,
    name: 'AI Chat + Web Search',
    description:
      'Conversational AI with Tavily-powered web search for research and dev talk.',
    status: 'Live',
  },
  {
    href: '/error-decoder',
    icon: Bug,
    name: 'Error Decoder',
    description:
      'Paste any error or stack trace and get root cause, fix, and prevention.',
    status: 'Live',
  },
  {
    href: '/commit-gen',
    icon: GitCommitHorizontal,
    name: 'Git Commit Generator',
    description:
      'Turn a diff or change description into clean conventional commit messages.',
    status: 'Live',
  },
  {
    href: '/regex-wizard',
    icon: Wand2,
    name: 'Regex Wizard',
    description:
      'Describe a pattern in plain language and get regex with live testing.',
    status: 'Live',
  },
  {
    href: '/doc-gen',
    icon: FileText,
    name: 'Doc Generator',
    description:
      'Generate JSDoc, Python docstrings, or inline comments for any code.',
    status: 'Live',
  },
  // NEW FEATURES from UPDATE 6
  { href: '/view-source', icon: ScanSearch, name: 'View Source + Download', description: 'Fetch any website source code and download as ZIP or individual files.', status: 'Live' },
  { href: '/code-editor', icon: FileText, name: 'Code Editor + AI Partner', description: 'Full-featured editor for all languages + AI chat partner (talks only). Save, ZIP, 15+ tools.', status: 'Live' },
  { href: '/encryptor', icon: Wand2, name: 'Encryption Generator', description: 'AES-256 + PBKDF2 encrypt/decrypt for HTML, JS, CSS, Python, TS and more. Download results.', status: 'Live' },
  { href: '/yt-player', icon: MessagesSquare, name: 'YouTube MP3 Player', description: 'Search YouTube, play audio, download MP3. 6 search suggestions + manual URL support.', status: 'Live' },
  { href: '/api-rest', icon: FileText, name: 'Free REST APIs Info', description: 'Curated list of free public REST APIs (downloader, AI, utilities).', status: 'Live' },
  { href: '/oauth-flow', icon: GitCommitHorizontal, name: 'OAuth 2.0 Flow Diagrammer', description: 'Interactive visual builder for Authorization Code flow (token exchange etc).', status: 'Live' },
] as const;

export default function Home() {
  return (
    <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 md:px-6 py-10 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 md:mb-14"
      >
        <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
          Dev - Tools Box{' '}
          <span className="text-[var(--accent-orange)]">v2.0</span>
        </h1>
        <p className="text-[var(--text-muted)] mt-3 max-w-xl text-sm md:text-base">
          A suite of AI-powered developer tools. Pick a tool to get started.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href="https://whatsapp.com/channel/0029VbC13UP1CYoODnULpp3E" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-xs hover:border-[var(--accent-cyan)]"><MessageCircle size={14}/> WhatsApp Channel</a>
          <a href="https://riz-dev-murex.vercel.app" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-xs hover:border-[var(--accent-orange)]"><ExternalLink size={14}/> Portfolio</a>
          <a href="https://github.com/rixz-dev" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-xs hover:border-[var(--accent-cyan)]"><Github size={14}/> GitHub rixz-dev</a>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {TOOLS.map((tool, i) => {
          const Icon = tool.icon;
          return (
            <motion.div
              key={tool.href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={tool.href}
                className="shimmer group flex flex-col h-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 md:p-6 hover:border-[var(--accent-orange)]/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center">
                    <Icon size={18} className="text-[var(--accent-orange)]" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      tool.status === 'Live'
                        ? 'text-[var(--success)] border-[var(--success)]/30 bg-[var(--success)]/5'
                        : 'text-[var(--text-muted)] border-[var(--border)]'
                    }`}
                  >
                    {tool.status}
                  </span>
                </div>
                <h2 className="font-display font-bold text-base md:text-lg mb-1.5">
                  {tool.name}
                </h2>
                <p className="text-xs md:text-sm text-[var(--text-muted)] flex-1">
                  {tool.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs text-[var(--accent-cyan)] opacity-0 group-hover:opacity-100 transition-opacity">
                  Open tool <ArrowRight size={12} />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </main>
  );
}
