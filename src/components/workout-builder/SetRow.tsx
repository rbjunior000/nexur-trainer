import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import IMask from 'imask';
import { IMaskInput } from 'react-imask';
import { AnimatePresence, motion } from 'framer-motion';
import type { StrictSet, SetType, DropSet, ExerciseType, RepsMode } from '../../types/workout';
import { SetTypeBadge } from '../shared/SetTypeBadge';
import { NumberInput } from '../shared/NumberInput';
import { PseBadgeWithPicker } from '../PsePicker';
import { DropsetRow } from './DropsetRow';

const REST_PRESETS = [
  { label: 'OFF', value: 0 },
  { label: '10s', value: 10 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '2min', value: 120 },
  { label: '3min', value: 180 },
];
const REST_PRESET_VALUES = new Set(REST_PRESETS.map((p) => p.value));

export interface SetRowProps {
  set: StrictSet;
  index: number;
  exerciseType: ExerciseType;
  repsMode: RepsMode;
  onUpdate: (field: keyof StrictSet, value: unknown) => void;
  onUpdateType: (type: SetType) => void;
  onRemove: () => void;
  onAddDropset: () => void;
  onRemoveDropset: (dropId: string) => void;
  onUpdateDropset: (dropId: string, field: keyof DropSet, value: unknown) => void;
}

/**
 * A single editable set row in the workout editor.
 * Handles weight/reps/duration/distance inputs, PSE, rest, and dropsets.
 */
export function SetRow({
  set,
  index,
  exerciseType,
  repsMode,
  onUpdate,
  onUpdateType,
  onRemove,
  onAddDropset,
  onRemoveDropset,
  onUpdateDropset,
}: SetRowProps) {
  const [customRest, setCustomRest] = useState(!REST_PRESET_VALUES.has(set.rest));
  const isRange = repsMode === 'range';
  const hasReps = exerciseType === 'weight_reps';

  const rowBg =
    set.type === 'dropset'
      ? 'bg-orange-50 hover:bg-orange-100'
      : set.type === 'warmup'
        ? 'bg-amber-50 hover:bg-amber-100'
        : 'bg-gray-50 hover:bg-gray-100';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10, height: 0 }}
      className="flex flex-col gap-1"
    >
      {/* Main row */}
      <div className={`flex items-center gap-2 p-2 rounded-lg group transition-colors px-1 ${rowBg}`}>
        <SetTypeBadge type={set.type} index={index} onChangeType={onUpdateType} />

        {/* Weight (weight_reps and duration) */}
        {(exerciseType === 'weight_reps' || exerciseType === 'duration') && (
          <NumberInput
            value={set.weight}
            onChange={(v) => onUpdate('weight', v)}
            suffix="kg"
            className="flex-1"
            inputMode="decimal"
          />
        )}

        {/* Distance */}
        {exerciseType === 'distance' && (
          <NumberInput
            value={set.distance}
            onChange={(v) => onUpdate('distance', v)}
            suffix="km"
            className="flex-1"
            inputMode="decimal"
          />
        )}

        {/* Duration */}
        {exerciseType === 'duration' && (
          <IMaskInput
            mask="MM:SS"
            blocks={{
              MM: { mask: IMask.MaskedRange, from: 0, to: 99, maxLength: 2, placeholderChar: '0' },
              SS: { mask: IMask.MaskedRange, from: 0, to: 59, maxLength: 2, placeholderChar: '0' },
            }}
            lazy={false}
            overwrite
            value={set.duration || '00:00'}
            onAccept={(val: string) => onUpdate('duration', val)}
            inputMode="numeric"
            className="flex-1 text-center bg-white border border-gray-200 rounded-lg py-2 text-sm font-medium focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all tabular-nums"
          />
        )}

        {/* Reps */}
        {hasReps && (
          isRange ? (
            <div className="flex-1 flex items-center gap-1">
              <input
                type="number"
                inputMode="numeric"
                value={set.repsRange?.[0] ?? ''}
                onChange={(e) =>
                  onUpdate('repsRange', [Number(e.target.value) || 0, set.repsRange?.[1] ?? 0])
                }
                placeholder="0"
                className="w-full text-center bg-white border border-gray-200 rounded-lg py-2 text-sm font-medium focus:outline-none focus:border-yellow-400"
              />
              <span className="text-gray-300 text-sm flex-shrink-0">-</span>
              <input
                type="number"
                inputMode="numeric"
                value={set.repsRange?.[1] ?? ''}
                onChange={(e) =>
                  onUpdate('repsRange', [set.repsRange?.[0] ?? 0, Number(e.target.value) || 0])
                }
                placeholder="0"
                className="w-full text-center bg-white border border-gray-200 rounded-lg py-2 text-sm font-medium focus:outline-none focus:border-yellow-400"
              />
            </div>
          ) : (
            <NumberInput
              value={set.reps}
              onChange={(v) => onUpdate('reps', v)}
              placeholder="0"
              className="flex-1"
            />
          )
        )}

        {/* PSE */}
        <div className="flex-shrink-0">
          <PseBadgeWithPicker value={set.pse} onChange={(v) => onUpdate('pse', v)} />
        </div>

        {/* Rest */}
        <div className="w-20 flex-shrink-0">
          {customRest ? (
            <div className="relative">
              <input
                autoFocus
                type="number"
                min={0}
                value={set.rest || ''}
                onChange={(e) => onUpdate('rest', Number(e.target.value) || 0)}
                onBlur={() => setCustomRest(false)}
                placeholder="45"
                className="w-full text-center bg-white border border-yellow-400 rounded-lg py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-yellow-400 pr-7"
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 pointer-events-none">
                seg
              </span>
            </div>
          ) : (
            <select
              value={REST_PRESET_VALUES.has(set.rest) ? set.rest : 'custom'}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setCustomRest(true);
                } else {
                  onUpdate('rest', Number(e.target.value));
                }
              }}
              className="w-full text-center bg-white border border-gray-200 rounded-lg py-2 text-xs font-medium focus:outline-none focus:border-yellow-400 transition-all appearance-none cursor-pointer"
            >
              {REST_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
              <option value="custom">Outro</option>
            </select>
          )}
        </div>

        {/* Actions */}
        <div className="w-14 flex items-center justify-center gap-0.5 flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-gray-300 hover:text-red-500 transition-colors"
            title="Remover série"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Dropset sub-rows */}
      <AnimatePresence>
        {set.type === 'dropset' &&
          (set.dropsets ?? []).map((drop, di) => (
            <DropsetRow
              key={drop.id}
              drop={drop}
              isLast={di === (set.dropsets?.length ?? 0) - 1}
              exerciseType={exerciseType}
              hasReps={hasReps}
              isRange={isRange}
              onUpdate={(field, val) => onUpdateDropset(drop.id, field, val)}
              onRemove={() => onRemoveDropset(drop.id)}
              onAdd={onAddDropset}
            />
          ))}
      </AnimatePresence>
    </motion.div>
  );
}
