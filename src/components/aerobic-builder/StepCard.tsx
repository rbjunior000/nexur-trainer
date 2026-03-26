import { useState } from 'react';
import { Copy, Trash2, Pencil } from 'lucide-react';
import type { BlockStep } from '../../types/aerobic';
import { useAerobicBuilder } from './AerobicBuilderContext';
import { ZoneBadge } from './ZoneBadge';
import { StepModal } from './StepModal';

export interface StepCardProps {
  blockId: string;
  step: BlockStep;
}

function formatDuration(durationType: BlockStep['durationType'], duration: string): string {
  if (durationType === 'DISTANCE') {
    const m = parseInt(duration) || 0;
    return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
  }
  // TIME — strip leading 00: if hours == 0
  const parts = duration.split(':');
  if (parts.length === 3 && parts[0] === '00') return `${parts[1]}:${parts[2]}`;
  return duration;
}

/**
 * Card displaying a single step inside a block, with edit/duplicate/delete actions.
 */
export function StepCard({ blockId, step }: StepCardProps) {
  const { removeStep, duplicateStep, updateStep } = useAerobicBuilder();
  const [editing, setEditing] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 group">
        <ZoneBadge zone={step.intensity} />

        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-800 truncate block">{step.name}</span>
          <span className="text-xs text-gray-400">{formatDuration(step.durationType, step.duration)}</span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            aria-label="Editar step"
            onClick={() => setEditing(true)}
            className="p-1 rounded text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            aria-label="Duplicar step"
            onClick={() => duplicateStep(blockId, step.id)}
            className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Copy size={13} />
          </button>
          <button
            type="button"
            aria-label="Remover step"
            onClick={() => removeStep(blockId, step.id)}
            className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <StepModal
        open={editing}
        step={step}
        onSave={(patch) => updateStep(blockId, step.id, patch)}
        onClose={() => setEditing(false)}
      />
    </>
  );
}
