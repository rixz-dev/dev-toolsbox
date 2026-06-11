'use client';

import { useState } from 'react';
import { Globe, Download, Code2, Loader2, AlertCircle } from 'lucide-react';
import JSZip from 'jszip';

interface SourceFile {
  name: string;
  content: string;
  type: string;
}

export default function ViewSourcePage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>('');
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');

  const extractResources = (html: string): SourceFile[] => {
    const extracted: SourceFile[] = [];
    let htmlContent = html;

    const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (styleMatch) {
      styleMatch.forEach((s, i) => {
        const content = s.replace(/<\/?style[^>]*>/gi, '');
        extracted.push({ name: `inline-style-${i + 1}.css`, content, type: 'css' });
        htmlContent = htmlContent.replace(s, `<!-- inline-style-${i+1} -->`);
      });
    }

    const scriptMatch = html.match(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi);
    if (scriptMatch) {
      scriptMatch.forEach((s, i) => {
        const content = s.replace(/<\/?script[^>]*>/gi, '');
        extracted.push({ name: `inline-script-${i + 1}.js`, content, type: 'js' });
        htmlContent = htmlContent.replace(s, `<!-- inline-script-${i+1} -->`);
      });
    }

    extracted.unshift({ name: 'index.html', content: htmlContent, type: 'html' });
    return extracted;
  };

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setSource('');
    setFiles([]);

    try {
      const res = await fetch(`/api/view-source?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch');

      const fetchedSource = data.html;
      setSource(fetchedSource);
      const extracted = extractResources(fetchedSource);
      setFiles(extracted);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch website source.');
    } finally {
      setLoading(false);
    }
  };

  const downloadAsZip = async () => {
    if (files.length === 0) return;
    const zip = new JSZip();
    files.forEach(f => zip.file(f.name, f.content));
    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `source-${new URL(url).hostname.replace(/\./g, '-')}.zip`;
    link.click();
  };

  const downloadSingle = (file: SourceFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = file.name;
    link.click();
  };

  const currentFile = files.find(f => f.type === activeTab) || files[0];

  return (
    <main className="flex-1 max-w-[1100px] mx-auto w-full p-4 md:p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-3">
          <Globe className="text-[var(--accent-orange)]" /> View Source + Download
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Fetch any public website source code, extract resources, and download as ZIP or individual files.
        </p>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-5">
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent-orange)]"
          />
          <button
            onClick={handleFetch}
            disabled={loading || !url.trim()}
            className="shimmer flex items-center gap-2 px-6 py-3 bg-[var(--accent-orange)] text-white rounded-xl text-sm font-bold disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Code2 size={16} />}
            {loading ? 'Fetching...' : 'Fetch Source'}
          </button>
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-[var(--critical)] bg-[var(--critical)]/5 p-2 rounded-lg">
            <AlertCircle size={15} /> {error}
          </div>
        )}
      </div>

      {source && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[var(--text-muted)]">Source fetched from: <span className="font-mono text-[var(--accent-cyan)]">{url}</span></div>
            <button onClick={downloadAsZip} className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm hover:border-[var(--accent-orange)]">
              <Download size={15} /> Download All as ZIP
            </button>
          </div>

          <div className="flex border-b border-[var(--border)]">
            {['html', 'css', 'js'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-5 py-2 text-sm font-semibold capitalize ${activeTab === tab ? 'border-b-2 border-[var(--accent-orange)] text-[var(--accent-orange)]' : 'text-[var(--text-muted)]'}`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-surface)]">
              <div className="font-mono text-sm text-[var(--accent-cyan)]">{currentFile?.name || 'source'}</div>
              {currentFile && (
                <button onClick={() => downloadSingle(currentFile)} className="text-xs flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] hover:border-[var(--accent-orange)]">
                  <Download size={13} /> Download
                </button>
              )}
            </div>
            <pre className="p-4 overflow-auto text-xs font-mono max-h-[520px] whitespace-pre-wrap bg-[var(--bg-primary)]">
              {currentFile?.content || source}
            </pre>
          </div>
        </div>
      )}
    </main>
  );
}
