export const LEXCODE_CLAUDE_MODEL = 'lexcode/claude-4.5-haiku' as const;

export const AVAILABLE_MODELS = [
  { id: LEXCODE_CLAUDE_MODEL, label: 'Claude 4.5 Haiku (LexCode)' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', label: 'Nemotron Ultra' },
  { id: 'openrouter/free', label: 'OpenRouter Free' },
] as const;

export type ModelId = (typeof AVAILABLE_MODELS)[number]['id'];

export const MODEL_CHAIN: ModelId[] = AVAILABLE_MODELS.map((m) => m.id);

export const DEFAULT_MODEL: ModelId = LEXCODE_CLAUDE_MODEL;

export function isValidModel(id: unknown): id is ModelId {
  return (
    typeof id === 'string' &&
    (MODEL_CHAIN as readonly string[]).includes(id)
  );
}

export function isLexcodeClaudeModel(id: unknown): id is typeof LEXCODE_CLAUDE_MODEL {
  return id === LEXCODE_CLAUDE_MODEL;
}
