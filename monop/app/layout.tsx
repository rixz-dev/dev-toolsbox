import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Monop v0.5 (beta) — by reiz_riz',
  description: 'Taktik. Perdagangan. Dominasi. Permainan Monopoli berbasis browser dengan AI bot.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Press+Start+2P&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
