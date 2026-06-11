'use client';

import ReactMarkdown from 'react-markdown';

interface StreamingTextProps {
  text: string;
  streaming?: boolean;
}

/** Render text yang datang token by token, markdown rendered. */
export function StreamingText({ text, streaming = false }: StreamingTextProps) {
  return (
    <div className="prose-chat text-sm leading-relaxed break-words">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-cyan)] underline underline-offset-2"
            >
              {children}
            </a>
          ),
          code: ({ className, children }) => {
            const isBlock = /language-/.test(className ?? '');
            if (isBlock) {
              return (
                <code className="block bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-3 my-2 overflow-x-auto font-mono text-xs">
                  {children}
                </code>
              );
            }
            return (
              <code className="bg-[var(--bg-primary)] px-1.5 py-0.5 rounded font-mono text-xs text-[var(--accent-orange)]">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="my-0">{children}</pre>,
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>
          ),
          h1: ({ children }) => (
            <h1 className="text-base font-bold mt-3 mb-1.5">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold mt-3 mb-1.5">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>
          ),
          p: ({ children }) => <p className="my-1.5">{children}</p>,
        }}
      >
        {text}
      </ReactMarkdown>
      {streaming && (
        <span className="inline-block w-2 h-4 bg-[var(--accent-orange)] align-text-bottom animate-pulse" />
      )}
    </div>
  );
}
