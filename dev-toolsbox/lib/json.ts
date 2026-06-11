/** Generic JSON extractor — ambil object pertama dari raw AI output. */
export function extractJSONObject(raw: string): Record<string, unknown> {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON found');
  const clean = raw.slice(start, end + 1);
  const parsed: unknown = JSON.parse(clean);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid schema');
  }
  return parsed as Record<string, unknown>;
}
