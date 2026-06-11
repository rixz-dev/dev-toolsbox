export interface ReviewIssue {
  severity: 'critical' | 'warning' | 'suggestion';
  category: 'security' | 'performance' | 'readability' | 'bugs' | 'best_practices';
  title: string;
  description: string;
  line_hint: string;
  fix: string;
}

export interface ReviewResult {
  language: string;
  overall_score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  issues: ReviewIssue[];
  positives: string[];
  fixed_code: string;
}

export function extractJSON(raw: string): ReviewResult {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON found');
  const clean = raw.slice(start, end + 1);
  const parsed: unknown = JSON.parse(clean);

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid schema');
  }

  const obj = parsed as Record<string, unknown>;
  if (typeof obj.overall_score !== 'number') throw new Error('Invalid schema');
  if (!Array.isArray(obj.issues)) throw new Error('Invalid issues');

  return parsed as ReviewResult;
}
