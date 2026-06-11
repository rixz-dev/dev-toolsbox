export function buildPrompt(code: string, scope: string): string {
  return `You are an expert code reviewer. Analyze the following code and return a JSON object ONLY — no markdown, no explanation, no backticks.

JSON schema (strict):

{
  "language": string,
  "overall_score": number (0–100),
  "grade": "A" | "B" | "C" | "D" | "F",
  "summary": string (max 2 sentences),
  "issues": [
    {
      "severity": "critical" | "warning" | "suggestion",
      "category": "security" | "performance" | "readability" | "bugs" | "best_practices",
      "title": string,
      "description": string,
      "line_hint": string (relevant snippet),
      "fix": string (corrected code)
    }
  ],
  "positives": string[],
  "fixed_code": string
}

Review scope: ${scope}

Code to review:

${code}`;
}
