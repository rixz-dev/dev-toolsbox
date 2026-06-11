// HANYA model yang sudah di-define user — JANGAN tambah lain
export const AVAILABLE_MODELS = [
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', label: 'Nemotron Ultra' }, // primary — BARU
  { id: 'openrouter/free', label: 'OpenRouter Free' }, // model lama — last fallback
] as const;

export type ModelId = (typeof AVAILABLE_MODELS)[number]['id'];

// Fallback chain: primary dulu, model lama paling akhir
export const MODEL_CHAIN: ModelId[] = AVAILABLE_MODELS.map((m) => m.id);

export const DEFAULT_MODEL: ModelId = MODEL_CHAIN[0];

export function isValidModel(id: unknown): id is ModelId {
  return (
    typeof id === 'string' &&
    (MODEL_CHAIN as readonly string[]).includes(id)
  );
}
