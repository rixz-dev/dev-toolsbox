'use client';

import { useState } from 'react';
import { Play, Download, Search, Loader2, Music } from 'lucide-react';

interface YTResult {
  id: string;
  title: string;
  thumbnail: string;
}

export default function YTPlayerPage() {
  const [query, setQuery] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [results, setResults] = useState<YTResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState<YTResult | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');

  const searchYouTube = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(''); setResults([]);
    try {
      const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`)}`);
      const html = await res.text();
      const videoIds: string[] = []; const titles: string[] = [];
      const idRegex = /"videoId":"([a-zA-Z0-9_-]{11})"/g; const titleRegex = /"title":{"runs":\[{"text":"([^"]+)"/g;
      let match; while ((match = idRegex.exec(html)) !== null && videoIds.length < 6) videoIds.push(match[1]);
      let tMatch; while ((tMatch = titleRegex.exec(html)) !== null && titles.length < 6) titles.push(tMatch[1]);
      const newResults = videoIds.slice(0,6).map((id,i) => ({ id, title: titles[i] || `Video ${i+1}`, thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` }));
      setResults(newResults);
    } catch { setError('Search failed. Try manual URL.'); } finally { setLoading(false); }
  };

  const playAudio = async (video: YTResult | null = null, url?: string) => {
    setError(''); let targetId = video?.id;
    if (!targetId && url) { const match = url.match(/(?:v=|youtu.be\/)([a-zA-Z0-9_-]{11})/); targetId = match ? match[1] : ''; }
    if (!targetId) { setError('Invalid YouTube URL'); return; }
    setLoading(true); setPlaying(video || {id: targetId, title: 'Manual', thumbnail: ''});
    try {
      const audioProxy = `https://api.vevioz.com/@api/json/mp3/${targetId}`;
      const res = await fetch(audioProxy); const data = await res.json();
      if (data.status === 'ok' && data.url) setAudioUrl(data.url);
      else setAudioUrl(`https://ytmp3.cc/api/button/mp3/${targetId}`);
    } catch { setError('Failed to load audio. Try download.'); setAudioUrl(`https://ytmp3.cc/api/button/mp3/${targetId}`); } finally { setLoading(false); }
  };

  const downloadAudio = (id: string, title: string) => {
    const link = document.createElement('a'); link.href = `https://api.vevioz.com/@api/button/mp3/${id}`; link.download = `${title}.mp3`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleManualPlay = () => { if (manualUrl.trim()) playAudio(null, manualUrl.trim()); };

  return (
    <main className="flex-1 max-w-[1050px] mx-auto w-full p-4 md:p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-3"><Music className="text-[var(--accent-orange)]" /> YouTube MP3 Player</h1>
        <p className="text-sm text-[var(--text-muted)]">Search, play, or download audio from YouTube. 6 suggestions shown.</p>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-6">
        <div className="flex gap-2 mb-3">
          <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchYouTube()} placeholder="Search song..." className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm" />
          <button onClick={searchYouTube} disabled={loading} className="px-6 rounded-xl bg-[var(--accent-orange)] text-white flex items-center gap-2">{loading ? <Loader2 className="animate-spin" size={16}/> : <Search size={16}/>} Search</button>
        </div>
        <div className="flex gap-2 mt-1">
          <input value={manualUrl} onChange={e=>setManualUrl(e.target.value)} placeholder="Or paste full YouTube URL" className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm font-mono" />
          <button onClick={handleManualPlay} className="px-5 text-sm rounded-xl border border-[var(--border)]">Play</button>
        </div>
      </div>

      {error && <div className="text-sm text-[var(--critical)] mb-4">{error}</div>}

      {results.length > 0 && (
        <div className="mb-8">
          <div className="text-sm mb-3 font-bold text-[var(--text-muted)]">Search Results (6 suggestions)</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((r, idx) => (
              <div key={idx} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden group">
                <div className="relative">
                  <img src={r.thumbnail} alt="" className="w-full aspect-video object-cover" />
                  <button onClick={() => playAudio(r)} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition"><div className="bg-white/90 text-black rounded-full p-3"><Play size={22} /></div></button>
                </div>
                <div className="p-3">
                  <div className="text-sm line-clamp-2 font-medium">{r.title}</div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => playAudio(r)} className="flex-1 text-xs py-1.5 flex justify-center items-center gap-1 rounded-xl bg-[var(--accent-orange)] text-white"><Play size={13} /> Play</button>
                    <button onClick={() => downloadAudio(r.id, r.title)} className="flex-1 text-xs py-1.5 flex justify-center items-center gap-1 rounded-xl border border-[var(--border)]"><Download size={13} /> MP3</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {playing && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-4">
            {playing.thumbnail && <img src={playing.thumbnail} className="w-20 h-12 object-cover rounded" />}
            <div className="flex-1"><div className="font-medium">{playing.title}</div><div className="text-xs text-[var(--text-muted)]">Now playing from YouTube</div></div>
            <button onClick={() => {setPlaying(null); setAudioUrl('');}} className="text-xs px-4 py-1 rounded-full border">Stop</button>
          </div>
          {audioUrl && (
            <div className="mt-4">
              <audio controls autoPlay className="w-full" src={audioUrl}>Your browser does not support audio.</audio>
              <div className="flex gap-2 mt-3">
                <a href={audioUrl} download className="flex-1 text-center py-2 bg-[var(--accent-cyan)] text-black rounded-xl text-sm font-bold">Download MP3</a>
                <button onClick={() => downloadAudio(playing.id, playing.title)} className="flex-1 text-center py-2 border border-[var(--border)] rounded-xl text-sm">Alternative Download</button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
