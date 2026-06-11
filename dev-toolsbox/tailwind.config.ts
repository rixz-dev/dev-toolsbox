import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-surface': 'var(--bg-surface)',
        'bg-elevated': 'var(--bg-elevated)',
        border: 'var(--border)',
        'accent-orange': 'var(--accent-orange)',
        'accent-cyan': 'var(--accent-cyan)',
        'text-primary': 'var(--text-primary)',
        'text-muted': 'var(--text-muted)',
        critical: 'var(--critical)',
        warning: 'var(--warning)',
        suggestion: 'var(--suggestion)',
        success: 'var(--success)',
      },
      fontFamily: {
        display: ['var(--font-syne)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
