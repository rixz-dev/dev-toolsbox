import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function normalize(items: unknown[]): Array<{ id: string; title: string; thumbnail: string; url: string; channel?: string; duration?: string }> {
  return items
    .map((it) => {
      const o = (it ?? {}) as Record<string, unknown>;
      const url = String(o.url || o.link || '');
      const id = String(o.id || url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)?.[1] || url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)?.[1] || '');
      if (!id) return null;
      return {
        id,
        title: String(o.title || 'YouTube Audio'),
        thumbnail: String(o.thumbnail || o.image_url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`),
        url: url || `https://www.youtube.com/watch?v=${id}`,
        channel: typeof o.channel === 'string' ? o.channel : undefined,
        duration: typeof o.duration === 'string' ? o.duration : undefined,
      };
    })
    .filter(Boolean)
    .filter((v, i, a) => a.findIndex((x) => x!.id === v!.id) === i)
    .slice(0, 6) as Array<{ id: string; title: string; thumbnail: string; url: string; channel?: string; duration?: string }>;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q) return NextResponse.json({ success: false, error: 'empty_query' }, { status: 400 });

  const endpoints = [
    `https://api.nexray.web.id/api/search/youtube?q=${encodeURIComponent(q)}`,
    `https://api.lexcode.biz.id/api/search/youtube?q=${encodeURIComponent(q)}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { next: { revalidate: 60 } });
      if (!res.ok) continue;
      const json = (await res.json()) as Record<string, unknown>;
      const raw = Array.isArray(json.result) ? json.result : Array.isArray(json.results) ? json.results : [];
      const results = normalize(raw);
      if (results.length) return NextResponse.json({ success: true, provider: url.includes('nexray') ? 'Nexray' : 'LexCode', results });
    } catch {
      // try next provider
    }
  }

  return NextResponse.json({ success: false, error: 'search_failed' }, { status: 502 });
}
