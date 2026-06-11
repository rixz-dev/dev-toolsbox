export async function fetchReview(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://riz-dev-murex.vercel.app',
        'X-Title': 'Dev - Tools Box',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert code reviewer. Return JSON only, no markdown, no explanation, no backticks.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenRouter error: ${res.status} ${text}`);
    }

    const json: unknown = await res.json();
    if (typeof json !== 'object' || json === null) {
      throw new Error('Invalid response from OpenRouter');
    }

    const obj = json as Record<string, unknown>;
    const choices = obj.choices as Array<Record<string, unknown>> | undefined;
    if (!choices || !choices[0]) {
      throw new Error('No choices in response');
    }

    const message = choices[0].message as Record<string, unknown> | undefined;
    const content = (message?.content || '') as string;
    return content;
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('timeout');
    }
    throw err;
  }
}
