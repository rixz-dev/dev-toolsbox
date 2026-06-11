'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  FileCode,
  Settings,
  Upload,
  X,
  FileText,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

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
  'HTML',
  'CSS',
  'JSON',
  'SQL',
  'Shell',
];

const SCOPES = [
  'Security',
  'Performance',
  'Readability',
  'Bugs',
  'Best Practices',
] as const;

const BLOCKED_EXTENSIONS = [
  '.zip',
  '.rar',
  '.7z',
  '.tar',
  '.gz',
  '.bz2',
  '.xz',
  '.jar',
  '.war',
  '.ear',
];

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
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isBlocked = (name: string) => {
    const lower = name.toLowerCase();
    return BLOCKED_EXTENSIONS.some((ext) => lower.endsWith(ext));
  };

  const readFile = (file: File) => {
    if (isBlocked(file.name)) {
      setError(
        'Compressed / archive files are not supported. Upload plain text files only.'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCode(text);
      setFileName(file.name);
      setError(null);

      const ext = file.name.split('.').pop()?.toLowerCase();
      const map: Record<string, string> = {
        ts: 'TypeScript',
        tsx: 'TypeScript',
        js: 'JavaScript',
        jsx: 'JavaScript',
        py: 'Python',
        java: 'Java',
        cpp: 'C++',
        c: 'C++',
        h: 'C++',
        go: 'Go',
        rs: 'Rust',
        rb: 'Ruby',
        php: 'PHP',
        html: 'HTML',
        htm: 'HTML',
        css: 'CSS',
        json: 'JSON',
        sql: 'SQL',
        sh: 'Shell',
        bash: 'Shell',
        zsh: 'Shell',
        md: 'Markdown',
        txt: 'Auto-detect',
      };
      if (ext && map[ext]) setLanguage(map[ext]);
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      readFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleSubmit = () => {
    if (!code.trim()) {
      setError('Paste your code first.');
      return;
    }
    if (code.length > 500000) {
      setError('Code too long. Max ~5000 lines recommended.');
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

  const clearFile = () => {
    setFileName(null);
    setCode('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col h-full gap-5 p-5 md:p-6 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] relative overflow-hidden"
    >
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-48 h-48 bg-[var(--accent-orange)]/5 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-48 h-48 bg-[var(--accent-cyan)]/5 rounded-full blur-3xl" />

      <div className="relative flex items-center gap-2 text-[var(--accent-orange)]">
        <FileCode size={20} />
        <h2 className="text-sm font-bold uppercase tracking-widest">
          Code Input
        </h2>
      </div>

      {/* Language */}
      <div className="relative flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Settings size={14} className="text-[var(--text-muted)]" />
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
            Language
          </span>
        </div>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-orange)]/50 transition-shadow"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* Scope */}
      <div className="relative flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Settings size={14} className="text-[var(--text-muted)]" />
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
            Review Scope
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SCOPES.map((key) => (
            <motion.button
              key={key}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleScope(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                scope.includes(key)
                  ? 'bg-[var(--accent-orange)]/10 border-[var(--accent-orange)] text-[var(--accent-orange)]'
                  : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)]'
              }`}
            >
              {key}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Upload / Drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 ${
          dragActive
            ? 'border-[var(--accent-orange)] bg-[var(--accent-orange)]/5 scale-[1.02]'
            : 'border-[var(--border)] hover:border-[var(--text-muted)]/40 bg-[var(--bg-elevated)]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".js,.ts,.tsx,.jsx,.py,.java,.cpp,.c,.h,.go,.rs,.rb,.php,.html,.htm,.css,.json,.txt,.md,.sql,.sh,.bash,.zsh"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              readFile(e.target.files[0]);
            }
          }}
        />
        <div className="flex flex-col items-center justify-center py-4 gap-2">
          <AnimatePresence mode="wait">
            {fileName ? (
              <motion.div
                key="file"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2"
              >
                <FileText
                  size={16}
                  className="text-[var(--accent-cyan)]"
                />
                <span className="text-xs text-[var(--text-primary)] font-mono">
                  {fileName}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="ml-1 text-[var(--text-muted)] hover:text-[var(--critical)] transition-colors"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex flex-col items-center gap-1"
              >
                <Upload size={20} className="text-[var(--text-muted)]" />
                <span className="text-xs text-[var(--text-muted)]">
                  Drop file or click to upload
                </span>
                <span className="text-[10px] text-[var(--text-muted)]/60">
                  No zip / compressed files
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Textarea */}
      <div className="flex-1 relative min-h-[180px]">
        <textarea
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          placeholder="Paste your code here..."
          className="w-full h-full min-h-[180px] bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-orange)]/40 focus:border-[var(--accent-orange)]/30 transition-all resize-none"
          style={{ fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}
          spellCheck={false}
        />
        <div
          className="absolute bottom-2 right-2 text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded-md border border-[var(--border)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {code.length.toLocaleString()}
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            className="px-3 py-2.5 rounded-xl bg-[var(--critical)]/10 border border-[var(--critical)]/20 text-[var(--critical)] text-sm flex items-center gap-2"
          >
            <AlertCircle size={14} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleSubmit}
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[var(--accent-orange)] text-white font-bold text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        {loading ? (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="flex items-center gap-2"
          >
            <Loader2 size={16} className="animate-spin" />
            Analyzing...
          </motion.div>
        ) : (
          <>
            <Sparkles size={16} />
            Analyze Code
          </>
        )}
      </motion.button>
    </motion.div>
  );
}
