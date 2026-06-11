'use client';

import { useState } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';

const FREE_APIS = [
  { name: 'Nexray API', url: 'https://api.nexray.web.id/', desc: 'Unlimited free API — downloader, AI, utilities' },
  { name: 'LexCode API', url: 'https://api.lexcode.biz.id', desc: 'Downloader + 22+ AI models (Claude, GPT, Gemini etc)' },
  { name: 'Pixxxry API', url: 'https://api.pixxxry.eu.cc/', desc: 'Public REST API no login — AI, media downloader, image tools' },
  { name: 'XEMOZ API', url: 'https://api-xemoz-official.my.id', desc: 'Simple fast public API' },
  { name: 'Astralune API', url: 'https://myapi.astralune.cv/', desc: 'Free public REST endpoints' },
  { name: 'Nanzz API', url: 'https://api-nanzz.my.id', desc: 'Various free tools & downloaders' },
  { name: 'Axly API', url: 'https://axlyapi.qzz.io', desc: 'Lightweight free API' },
  { name: 'SilentKana API', url: 'https://api.silentkana.xyz/api/', desc: 'Free public APIs' },
  { name: 'DashX API', url: 'https://api.dashx.dpdns.org', desc: 'Free REST services' },
  { name: 'Zelapio API', url: 'https://zelapioffciall.dpdns.org', desc: 'Official free API' },
  { name: 'Aichixia', url: 'https://www.aichixia.xyz', desc: 'AI focused free endpoints' },
  { name: 'NeoSoft API', url: 'https://api.neosoft.best/', desc: 'Free developer APIs' },
  { name: 'Theresav API', url: 'https://api.theresav.biz.id', desc: 'Public free API collection' },
];

export default function FreeAPIInfoPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1400);
  };

  return (
    <main className="flex-1 max-w-[1100px] mx-auto w-full p-4 md:p-6">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Free REST API Information</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Curated list of free public REST APIs (no key required in most cases). Great for downloaders, AI, and utilities.</p>
        <div className="mt-2 text-xs bg-[var(--bg-surface)] inline-block px-3 py-1 rounded-full border border-[var(--border)]">Source: WhatsApp Channel • Updated 2026</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FREE_APIS.map((api, index) => (
          <div key={index} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent-orange)]/40 transition-colors group">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-lg">{api.name}</div>
                <div className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{api.desc}</div>
              </div>
              <a href={api.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent-orange)] opacity-70 group-hover:opacity-100"><ExternalLink size={18} /></a>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => copy(api.url, `url-${index}`)} className="flex-1 text-xs flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent-cyan)]">
                {copied === `url-${index}` ? <Check size={13} /> : <Copy size={13} />} Copy URL
              </button>
              <a href={api.url} target="_blank" className="flex-1 text-xs flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] hover:border-[var(--accent-orange)] text-center">Visit</a>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 text-xs text-[var(--text-muted)] border border-[var(--border)] rounded-2xl bg-[var(--bg-surface)]">
        Note: These are third-party free public APIs. Always check current status, rate limits, and terms of service.
      </div>
    </main>
  );
}
