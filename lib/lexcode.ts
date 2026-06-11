export async function fetchLexcodeClaude(text: string, prompt?: string): Promise<string> {
  const base = 'https://api.lexcode.biz.id/api/ai/claude/4-5-haiku';
  const params = new URLSearchParams({ text });
  if (prompt) params.append('prompt', prompt);

  const res = await fetch(`${base}?${params.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) throw new Error('LexCode Claude API error');

  const json = await res.json();
  if (!json.success || !json.result?.answer) throw new Error(json.message || 'No response from LexCode');
  return json.result.answer;
}
