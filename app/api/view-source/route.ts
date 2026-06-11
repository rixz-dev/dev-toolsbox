import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ success: false, error: 'URL required' }, { status: 400 });
  }

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only http/https allowed');
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DevToolsBox/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    return NextResponse.json({ success: true, html, url });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch' }, { status: 500 });
  }
}
