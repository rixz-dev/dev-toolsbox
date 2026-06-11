'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/reviewer', label: 'Reviewer' },
  { href: '/chat', label: 'Chat' },
  { href: '/error-decoder', label: 'Error Decoder' },
  { href: '/commit-gen', label: 'Commit Gen' },
  { href: '/regex-wizard', label: 'Regex Wizard' },
  { href: '/doc-gen', label: 'Doc Gen' },
  { href: '/view-source', label: 'View Source' },
  { href: '/code-editor', label: 'Code Editor' },
  { href: '/encryptor', label: 'Encryptor' },
  { href: '/yt-player', label: 'YT MP3' },
  { href: '/api-rest', label: 'Free APIs' },
  { href: '/oauth-flow', label: 'OAuth Flow' },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-[var(--border)] bg-[var(--bg-surface)]/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-[var(--text-primary)] tracking-tight">Dev - Tools Box</span>
              <span className="text-[10px] text-[var(--text-muted)]">v2.0</span>
            </div>
          </Link>
        </motion.div>

        <nav className="hidden lg:flex items-center gap-1 flex-wrap">
          {NAV_LINKS.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${active ? 'bg-[var(--bg-elevated)] text-[var(--accent-orange)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <a href="https://riz-dev-murex.vercel.app" target="_blank" rel="noopener noreferrer" className="hidden md:block text-xs text-[var(--text-muted)] hover:text-[var(--accent-orange)] transition-colors">by reiz_riz</a>
          <button onClick={() => setOpen((v) => !v)} className="lg:hidden p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors" aria-label="Toggle menu">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 flex flex-col gap-1">
          {NAV_LINKS.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={`px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-[var(--bg-elevated)] text-[var(--accent-orange)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
