export async function fetchReview(prompt: string): Promise<string> {
  const chatRes = await fetch('https://deep-seek.ai/chat', {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8',
    },
    redirect: 'follow',
  });

  if (!chatRes.ok) {
    throw new Error('AI unavailable');
  }

  const chatHtml = await chatRes.text();

  const csrfMatch =
    chatHtml.match(
      /<meta[^>]+name=["']csrf-token["'][^>]+content=["']([^"']+)["']/
    ) ||
    chatHtml.match(/["']csrf[_-]token["']\s*[:=]\s*["']([^"']+)["']/) ||
    chatHtml.match(/csrfToken\s*=\s*["']([^"']+)["']/);
  const csrfToken = csrfMatch ? csrfMatch[1] : '';

  const cookieStr = extractCookieString(chatRes);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const apiRes = await fetch('https://deep-seek.ai/api/chat', {
      method: 'POST',
      headers: {
        'user-agent':
          'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36',
        'x-csrf-token': csrfToken,
        'content-type': 'application/json',
        accept: '*/*',
        origin: 'https://deep-seek.ai',
        referer: 'https://deep-seek.ai/chat',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8',
        cookie: cookieStr,
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-v3.2',
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!apiRes.ok) {
      throw new Error('AI unavailable');
    }

    const reader = apiRes.body?.getReader();
    if (!reader) throw new Error('AI unavailable');

    let result = '';
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed: unknown = JSON.parse(data);
          if (typeof parsed === 'object' && parsed !== null) {
            const p = parsed as Record<string, unknown>;
            const choices = p.choices;
            if (Array.isArray(choices)) {
              const choice = choices[0] as Record<string, unknown> | undefined;
              const delta = choice?.delta as
                | Record<string, unknown>
                | undefined;
              const message = choice?.message as
                | Record<string, unknown>
                | undefined;
              const content = (
                delta?.content ||
                message?.content ||
                p.content ||
                p.text ||
                ''
              ) as string;
              result += content;
            } else if (typeof p.content === 'string') {
              result += p.content;
            } else if (typeof p.text === 'string') {
              result += p.text;
            }
          }
        } catch {
          // ignore non-JSON lines
        }
      }
    }

    return result;
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('timeout');
    }
    throw err;
  }
}

function extractCookieString(res: Response): string {
  const headers = res.headers as unknown as {
    getSetCookie?: () => string[];
  };
  if (typeof headers.getSetCookie === 'function') {
    const cookies = headers.getSetCookie();
    return cookies.map((c) => c.split(';')[0]).join('; ');
  }

  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return '';
  return setCookie
    .split(/,(?=\s*[^\s=;]+=[^;]*)/)
    .map((c) => c.trim().split(';')[0])
    .join('; ');
}
