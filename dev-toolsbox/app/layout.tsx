import type { Metadata } from 'next';
import { Syne, JetBrains_Mono } from 'next/font/google';
import { Navbar } from '@/components/Navbar';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'Dev - Tools Box | AI Developer Tools',
  description:
    'AI-powered developer toolbox by reiz_riz — code review, chat with web search, error decoding, commit generation, regex wizard, and doc generation. Plus view source, code editor, encryptor, YT player, free APIs, OAuth diagrammer.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${syne.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen antialiased">
        <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
          <Navbar />
          <div className="flex-1 flex flex-col">{children}</div>
          <footer className="border-t border-[var(--border)] py-4">
            <div className="max-w-[1600px] mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
              <span>Dev - Tools Box v2.0 — AI Developer Tools (Updated with 6 new features)</span>
              <a
                href="https://riz-dev-murex.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--accent-orange)] transition-colors"
              >
                Creator: reiz_riz
              </a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
