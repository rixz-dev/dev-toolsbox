'use client';

import { Cpu } from 'lucide-react';
import { AVAILABLE_MODELS, type ModelId } from '@/lib/models';

interface ModelSelectorProps {
  value: ModelId;
  onChange: (id: ModelId) => void;
  models?: ReadonlyArray<{ id: ModelId; label: string }>;
}

export function ModelSelector({
  value,
  onChange,
  models = AVAILABLE_MODELS,
}: ModelSelectorProps) {
  return (
    <div className="flex items-center gap-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-2 py-1">
      <Cpu size={13} className="text-[var(--accent-cyan)] shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ModelId)}
        className="bg-transparent text-xs text-[var(--text-primary)] outline-none cursor-pointer py-0.5 max-w-[160px]"
        aria-label="Select AI model"
      >
        {models.map((m) => (
          <option
            key={m.id}
            value={m.id}
            className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
          >
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
}
