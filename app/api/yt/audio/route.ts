import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function getId(input: string): string {
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  return input.match(/[?&]v=([a-zA-Z0-9_-]{11})/)?.[1] || input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)?.[1] || '';
}

function findUrl(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return /^https?:\/\//.test(value) ? value : null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findUrl(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of ['download_url', 'audio', 'url', 'link', 'download', 'mp3']) {
      const found = findUrl(obj[key]);
      if (found) return found;
    }
    for (const v of Object.values(obj)) {
      const found = findUrl(v);
      if (found) return found;
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url') || req.nextUrl.searchParams.get('id') || '';
  const id = getId(raw.trim());
  if (!id) return NextResponse.json({ success: false, error: 'bad_youtube_url' }, { status: 400 });

  const ytUrl = `https://www.youtube.com/watch?v=${id}`;
  const endpoints = [
    `https://api.lexcode.biz.id/api/dwn/ytdl?url=${encodeURIComponent(ytUrl)}&format=mp3`,
    `https://api.lexcode.biz.id/api/dwn/ytplay?q=${encodeURIComponent(ytUrl)}`,
    `https://api.lexcode.biz.id/api/dwn/y4mate?url=${encodeURIComponent(ytUrl)}&format=mp3`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, { cache: 'no-store' });
      if (!res.ok) continue;
      const json = (await res.json()) as Record<string, unknown>;
      const url = findUrl(json.result) || findUrl(json);
      if (url) {
        const result = (json.result ?? {}) as Record<string, unknown>;
        return NextResponse.json({
          success: true,
          provider: 'LexCode',
          id,
          title: String(result.title || 'YouTube Audio'),
          audioUrl: url,
          sourceUrl: ytUrl,
        });
      }
    } catch {
      // try next endpoint
    }
  }

  return NextResponse.json({ success: false, error: 'audio_failed' }, { status: 502 });
}
