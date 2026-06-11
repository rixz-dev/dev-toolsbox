'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Globe, Plus, Loader2 } from 'lucide-react';
import { ModelSelector } from '@/components/ModelSelector';
import { StreamingText } from '@/components/StreamingText';
import { SearchSources, type SearchSource } from '@/components/SearchSources';
import { DEFAULT_MODEL, type ModelId } from '@/lib/models';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  sources?: SearchSource[];
}

export default function ChatPage() {
  // In-memory session saja — TIDAK dipersist ke localStorage
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [enableSearch, setEnableSearch] = useState(false);
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, searching]);

  const handleNewChat = () => {
    setMessages([]);
    setError(null);
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    setInput('');
    const history = [...messages, { role: 'user' as const, content: text }];
    setMessages(history);
    setLoading(true);
    if (enableSearch) setSearching(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          enableSearch,
          query: text,
          model,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error('AI is busy. Try again in a moment.');
      }

      // Tambahkan placeholder assistant message untuk streaming
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let firstToken = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(trimmed.slice(6)) as Record<
              string,
              unknown
            >;
            if (evt.type === 'sources' && Array.isArray(evt.sources)) {
              const sources = evt.sources as SearchSource[];
              setSearching(false);
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === 'assistant') {
                  next[next.length - 1] = { ...last, sources };
                }
                return next;
              });
            } else if (evt.type === 'token' && typeof evt.token === 'string') {
              if (firstToken) {
                firstToken = false;
                setSearching(false);
              }
              const token = evt.token;
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === 'assistant') {
                  next[next.length - 1] = {
                    ...last,
                    content: last.content + token,
                  };
                }
                return next;
              });
            }
          } catch {
            // ignore malformed SSE lines
          }
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'AI is busy. Try again.'
      );
      // hapus placeholder kosong kalau gagal sebelum token pertama
      setMessages((prev) =>
        prev.length > 0 &&
        prev[prev.length - 1].role === 'assistant' &&
        prev[prev.length - 1].content === ''
          ? prev.slice(0, -1)
          : prev
      );
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [input, loading, messages, enableSearch, model]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <main className="flex-1 flex flex-col max-w-[900px] mx-auto w-full p-4 md:p-6 gap-3 min-h-[calc(100vh-3.5rem-4rem)]">
      {/* Top bar: model selector + search toggle + new chat */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold">
            AI Chat
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Dev research &amp; conversation, with optional web search.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ModelSelector value={model} onChange={setModel} />
          <button
            onClick={() => setEnableSearch((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
              enableSearch
                ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/5'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            aria-pressed={enableSearch}
          >
            <Globe size={13} />
            Search: {enableSearch ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Plus size={13} />
            New Chat
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 md:p-5 space-y-4 min-h-[40vh]">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-center text-sm text-[var(--text-muted)] py-16">
            Start a conversation. Toggle web search for research with live
            sources.
          </div>
        )}
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-[var(--accent-orange)]/10 border border-[var(--accent-orange)]/20'
                  : 'bg-[var(--bg-elevated)] border border-[var(--border)]'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="text-sm whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
              ) : (
                <>
                  <StreamingText
                    text={msg.content}
                    streaming={loading && i === messages.length - 1}
                  />
                  {msg.sources && msg.sources.length > 0 && (
                    <SearchSources sources={msg.sources} />
                  )}
                </>
              )}
            </div>
          </motion.div>
        ))}
        {searching && (
          <div className="flex items-center gap-2 text-xs text-[var(--accent-cyan)]">
            <Loader2 size={13} className="animate-spin" />
            Searching web...
          </div>
        )}
        {error && (
          <div className="text-xs text-[var(--critical)] border border-[var(--critical)]/30 bg-[var(--critical)]/5 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Ask anything... (Enter to send, Shift+Enter for newline)"
            className="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-[var(--text-muted)] font-sans"
            disabled={loading}
          />
          <button
            onClick={() => void handleSend()}
            disabled={loading || !input.trim()}
            className="shimmer shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent-orange)] text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            Send
          </button>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
          Web search: {enableSearch ? 'aktif' : 'nonaktif'} · history is
          in-memory only (resets on reload)
        </p>
      </div>
    </main>
  );
}
