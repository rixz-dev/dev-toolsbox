const TAVILY_API = 'https://api.tavily.com/search';

export interface TavilyResult {
  url: string;
  title: string;
  content: string;
}

export async function searchTavily(query: string): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error('Tavily API key not configured');
  }

  const res = await fetch(TAVILY_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      search_depth: 'basic',
      max_results: 5,
      include_answer: true,
      include_raw_content: false,
    }),
  });

  if (!res.ok) {
    return [];
  }

  const data = (await res.json()) as Record<string, unknown>;
  const results = data.results;
  if (!Array.isArray(results)) return [];

  return results
    .filter(
      (r): r is Record<string, unknown> =>
        typeof r === 'object' && r !== null
    )
    .map((r) => ({
      url: typeof r.url === 'string' ? r.url : '',
      title: typeof r.title === 'string' ? r.title : '',
      content: typeof r.content === 'string' ? r.content : '',
    }));
}

export function buildSearchContext(results: TavilyResult[]): string {
  return results
    .map((r) => `Source: ${r.url}\nTitle: ${r.title}\nSnippet: ${r.content}`)
    .join('\n\n---\n\n');
}
