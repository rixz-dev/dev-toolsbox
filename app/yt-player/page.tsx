'use client';
import { useState } from 'react';
import { Play, Download, Search, Loader2, Music, ShieldCheck } from 'lucide-react';
import { LoadingWithGames } from '@/components/LoadingWithGames';

interface R { id: string; title: string; thumbnail: string; url: string; channel?: string; duration?: string; }

export default function YTPlayer() {
  const [q, setQ] = useState('');
  const [mu, setMu] = useState('');
  const [rs, setRs] = useState<R[]>([]);
  const [ld, setLd] = useState(false);
  const [pl, setPl] = useState<R | null>(null);
  const [au, setAu] = useState('');
  const [er, setEr] = useState('');

  const srch = async () => {
    if (!q.trim()) return;
    setLd(true); setEr(''); setRs([]);
    try {
      const r = await fetch(`/api/yt/search?q=${encodeURIComponent(q.trim())}`);
      const d = await r.json();
      if (!d.success) throw new Error(d.error || 'search_failed');
      setRs((d.results || []).slice(0, 6));
    } catch {
      setEr('Search gagal. Coba keyword lain atau paste URL manual.');
    } finally { setLd(false); }
  };

  const getId = (u: string) => u.match(/[?&]v=([a-zA-Z0-9_-]{11})/)?.[1] || u.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)?.[1] || (/^[a-zA-Z0-9_-]{11}$/.test(u) ? u : '');

  const play = async (v: R | null, u?: string) => {
    setEr(''); setAu('');
    const id = v?.id || (u ? getId(u) : '');
    if (!id) { setEr('URL YouTube tidak valid.'); return; }
    const item = v || { id, title: 'Manual URL', thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, url: `https://www.youtube.com/watch?v=${id}` };
    setPl(item); setLd(true);
    try {
      const r = await fetch(`/api/yt/audio?id=${encodeURIComponent(id)}`);
      const d = await r.json();
      if (!d.success || !d.audioUrl) throw new Error(d.error || 'audio_failed');
      setAu(d.audioUrl);
    } catch {
      setEr('Gagal mengambil audio dari REST API. Coba hasil pencarian lain.');
      setPl(null);
    } finally { setLd(false); }
  };

  const dl = async (id: string) => {
    setLd(true); setEr('');
    try {
      const r = await fetch(`/api/yt/audio?id=${encodeURIComponent(id)}`);
      const d = await r.json();
      if (!d.success || !d.audioUrl) throw new Error('download_failed');
      const a = document.createElement('a');
      a.href = d.audioUrl;
      a.download = `${d.title || id}.mp3`;
      a.target = '_blank';
      document.body.appendChild(a); a.click(); a.remove();
    } catch { setEr('Gagal membuat link download MP3 dari REST API.'); }
    finally { setLd(false); }
  };
  const man = () => { if (mu.trim()) void play(null, mu.trim()); };

  return (
    <main className="flex-1 max-w-[1050px] mx-auto w-full p-4 md:p-6">
      <LoadingWithGames isOpen={ld} onClose={() => undefined} message="Fetching YouTube audio via REST API..." />
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-3"><Music className="text-[var(--accent-orange)]"/> YT MP3 Player</h1>
        <p className="text-sm text-[var(--text-muted)]">Search, play, download. 6 suggestions + manual URL. Powered by provided REST APIs.</p>
      </div>
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-6">
        <div className="flex gap-2 mb-3"><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&srch()} placeholder="Search song..." className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm"/><button onClick={srch} disabled={ld} className="px-6 rounded-xl bg-[var(--accent-orange)] text-white flex items-center gap-2 disabled:opacity-50">{ld?<Loader2 className="animate-spin" size={16}/>:<Search size={16}/>} Search</button></div>
        <div className="flex gap-2 mt-1"><input value={mu} onChange={e=>setMu(e.target.value)} placeholder="Or paste YT URL" className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm font-mono"/><button onClick={man} className="px-5 text-sm rounded-xl border border-[var(--border)]">Play</button></div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-[var(--text-muted)]"><ShieldCheck size={12}/> Download/play only content you have rights or permission to use.</div>
      </div>
      {er&&<div className="text-sm text-[var(--critical)] mb-4 bg-[var(--critical)]/5 border border-[var(--critical)]/20 rounded-xl p-3">{er}</div>}
      {rs.length>0&&<div className="mb-8"><div className="text-sm mb-3 font-bold text-[var(--text-muted)]">Suggestions ({rs.length}/6)</div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{rs.map((r,i)=><div key={i} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden group"><div className="relative"><img src={r.thumbnail} className="w-full aspect-video object-cover" alt={r.title}/><button onClick={()=>play(r)} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100"><div className="bg-white/90 text-black rounded-full p-3"><Play size={22}/></div></button></div><div className="p-3"><div className="text-sm line-clamp-2 font-medium">{r.title}</div><div className="text-[10px] text-[var(--text-muted)] mt-1">{r.channel || 'YouTube'} {r.duration ? `• ${r.duration}` : ''}</div><div className="flex gap-2 mt-3"><button onClick={()=>play(r)} className="flex-1 text-xs py-1.5 flex justify-center items-center gap-1 rounded-xl bg-[var(--accent-orange)] text-white"><Play size={13}/> Play</button><button onClick={()=>dl(r.id)} className="flex-1 text-xs py-1.5 flex justify-center items-center gap-1 rounded-xl border border-[var(--border)]"><Download size={13}/> API</button></div></div></div>)}</div></div>}
      {pl&&<div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-6"><div className="flex items-center gap-4"><img src={pl.thumbnail} className="w-20 h-12 object-cover rounded" alt="thumb"/><div className="flex-1"><div className="font-medium">{pl.title}</div><div className="text-xs text-[var(--text-muted)]">Playing from LexCode downloader endpoint</div></div><button onClick={()=>{setPl(null);setAu('');}} className="text-xs px-4 py-1 rounded-full border">Stop</button></div>{au&&<div className="mt-4"><audio controls autoPlay className="w-full" src={au}>no audio</audio><div className="flex gap-2 mt-3"><a href={au} download className="flex-1 text-center py-2 bg-[var(--accent-cyan)] text-black rounded-xl text-sm font-bold">Download MP3</a><button onClick={()=>dl(pl.id)} className="flex-1 text-center py-2 border border-[var(--border)] rounded-xl text-sm">Alt Download</button></div></div>}</div>}
    </main>
  );
}
