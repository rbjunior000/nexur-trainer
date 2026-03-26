import { Plus, Trash2, CornerDownRight } from 'lucide-react';
import IMask from 'imask';
import { IMaskInput } from 'react-imask';
import type { DropSet, ExerciseType } from '../../types/workout';
import { NumberInput } from '../shared/NumberInput';

export interface DropsetRowProps {
  drop: DropSet;
  isLast: boolean;
  exerciseType: ExerciseType;
  hasReps: boolean;
  isRange: boolean;
  onUpdate: (field: keyof DropSet, value: unknown) => void;
  onRemove: () => void;
  onAdd: () => void;
}

/** Indented sub-row for drop sets inside a set. */
export function DropsetRow({
  drop,
  isLast,
  exerciseType,
  hasReps,
  isRange,
  onUpdate,
  onRemove,
  onAdd,
}: DropsetRowProps) {
  return (
    <div className="flex items-center gap-2 pl-4 py-1.5 bg-orange-50 rounded-lg border-l-2 border-orange-200 ml-1">
      <CornerDownRight size={12} className="text-orange-400 flex-shrink-0" />

      {exerciseType === 'weight_reps' && (
        <>
          <NumberInput
            value={drop.weight}
            onChange={(v) => onUpdate('weight', v)}
            className="flex-1"
            inputMode="decimal"
          />
          {isRange ? (
            <div className="flex-1 flex items-center gap-1">
              <input
                type="number"
                inputMode="numeric"
                value={drop.repsRange?.[0] ?? ''}
                onChange={(e) =>
                  onUpdate('repsRange', [Number(e.target.value) || 0, drop.repsRange?.[1] ?? 0])
                }
                placeholder="0"
                className="w-full text-center bg-white border border-gray-200 rounded-lg py-1.5 text-sm font-medium focus:outline-none focus:border-yellow-400"
              />
              <span className="text-gray-300 text-sm">-</span>
              <input
                type="number"
                inputMode="numeric"
                value={drop.repsRange?.[1] ?? ''}
                onChange={(e) =>
                  onUpdate('repsRange', [drop.repsRange?.[0] ?? 0, Number(e.target.value) || 0])
                }
                placeholder="0"
                className="w-full text-center bg-white border border-gray-200 rounded-lg py-1.5 text-sm font-medium focus:outline-none focus:border-yellow-400"
              />
            </div>
          ) : (
            <NumberInput
              value={drop.reps}
              onChange={(v) => onUpdate('reps', v)}
              placeholder="reps"
              className="flex-1"
            />
          )}
        </>
      )}

      {exerciseType === 'duration' && (
        <>
          <NumberInput
            value={drop.weight}
            onChange={(v) => onUpdate('weight', v)}
            className="flex-1"
            inputMode="decimal"
          />
          <IMaskInput
            mask="MM:SS"
            blocks={{
              MM: { mask: IMask.MaskedRange, from: 0, to: 99, maxLength: 2, placeholderChar: '0' },
              SS: { mask: IMask.MaskedRange, from: 0, to: 59, maxLength: 2, placeholderChar: '0' },
            }}
            lazy={false}
            overwrite
            value={drop.duration || '00:00'}
            onAccept={(val: string) => onUpdate('duration', val)}
            inputMode="numeric"
            className="flex-1 text-center bg-white border border-gray-200 rounded-lg py-1.5 text-sm font-medium focus:outline-none focus:border-yellow-400 tabular-nums"
          />
        </>
      )}

      {exerciseType === 'distance' && (
        <NumberInput
          value={drop.distance}
          onChange={(v) => onUpdate('distance', v)}
          className="flex-1"
          inputMode="decimal"
        />
      )}

      <div className="flex items-center gap-0.5 flex-shrink-0">
        {isLast && (
          <button
            type="button"
            onClick={onAdd}
            title="Adicionar drop"
            className="p-1 text-orange-400 hover:text-orange-600 transition-colors"
          >
            <Plus size={13} />
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          title="Remover drop"
          className="p-1 text-gray-300 hover:text-red-500 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
