import { Fragment } from 'react';
import { Check, Clock, Flame, CornerDownRight } from 'lucide-react';
import type { TrainingSet, TrainingExercise, Phase } from './TrainingSessionContext';
import { PseBadgeWithPicker } from '../PsePicker';
import { formatTime } from '../../utils/formatTime';

function formatRest(seconds: number): string {
  if (seconds <= 0) return 'OFF';
  if (seconds >= 60) return `${Math.floor(seconds / 60)}min`;
  return `${seconds}s`;
}

export interface TrainingSetRowProps {
  set: TrainingSet;
  setIndex: number;
  exerciseType: string;
  repsMode?: string;
  isCurrent: boolean;
  showWeight: boolean;
  phase: Phase;
  countdown: number | null;
  onToggle: () => void;
  onUpdateField: (field: keyof TrainingSet, value: number | string | null) => void;
}

/** Table row for a single set during execution. Editable inputs + completion toggle. */
export function TrainingSetRow({
  set,
  setIndex,
  exerciseType,
  repsMode,
  isCurrent,
  showWeight,
  phase,
  countdown,
  onToggle,
  onUpdateField,
}: TrainingSetRowProps) {
  const isCountingRest =
    isCurrent && set.completed && phase === 'rest' && countdown !== null && countdown > 0;

  const inputCls =
    'bg-gray-800 text-white text-sm font-semibold rounded-lg px-2 py-1 text-center border border-gray-700 focus:border-yellow-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

  return (
    <Fragment>
      <tr
        className={`border-b border-gray-800/50 transition-colors ${isCurrent ? 'bg-gray-800/60' : ''}`}
      >
        {exerciseType === 'weight_reps' && (
          <>
            <td className="py-2.5 px-2">
              <input
                type="number"
                value={set.weight ?? 0}
                onChange={(e) => onUpdateField('weight', Number(e.target.value) || 0)}
                className={`w-16 ${inputCls}`}
              />
            </td>
            <td className="py-2.5 px-2">
              {repsMode === 'range' ? (
                <input
                  type="number"
                  value={set.reps ?? ''}
                  placeholder={set.repsRange ? `${set.repsRange[0]}-${set.repsRange[1]}` : 'reps'}
                  onChange={(e) => onUpdateField('reps', Number(e.target.value) || 0)}
                  className={`w-14 ${inputCls} placeholder:text-gray-500`}
                />
              ) : (
                <input
                  type="number"
                  value={set.reps ?? 0}
                  onChange={(e) => onUpdateField('reps', Number(e.target.value) || 0)}
                  className={`w-14 ${inputCls}`}
                />
              )}
            </td>
          </>
        )}

        {exerciseType === 'duration' && (
          <>
            {showWeight && (
              <td className="py-2.5 px-2">
                <input
                  type="number"
                  value={set.weight ?? 0}
                  onChange={(e) => onUpdateField('weight', Number(e.target.value) || 0)}
                  className={`w-16 ${inputCls}`}
                />
              </td>
            )}
            <td className="py-2.5 px-2">
              {isCurrent && phase === 'work' && countdown !== null ? (
                <span className="text-yellow-400 text-sm font-bold animate-pulse tabular-nums">
                  {formatTime(countdown)}
                </span>
              ) : (
                <span className="text-white text-sm font-semibold">{set.duration || '00:00'}</span>
              )}
            </td>
          </>
        )}

        {exerciseType === 'distance' && (
          <td className="py-2.5 px-2">
            <input
              type="number"
              value={set.distance ?? 0}
              onChange={(e) => onUpdateField('distance', Number(e.target.value) || 0)}
              className={`w-16 ${inputCls}`}
            />
          </td>
        )}

        <td className="py-2.5 px-1">
          <PseBadgeWithPicker value={set.pse} onChange={(v) => onUpdateField('pse', v)} />
        </td>

        <td className="py-2.5 px-2">
          <span
            className={`flex items-center gap-1 text-sm ${
              isCountingRest ? 'text-yellow-400 animate-pulse font-bold' : 'text-gray-400'
            }`}
          >
            <Clock size={12} />
            {isCountingRest ? formatTime(countdown!) : formatRest(set.rest)}
          </span>
        </td>

        <td className="py-2.5 pl-2 pr-3">
          <button
            type="button"
            onClick={onToggle}
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
              set.completed
                ? 'bg-green-500 border-green-500 text-white'
                : set.type === 'warmup'
                  ? 'border-amber-500 text-amber-500 hover:border-amber-400'
                  : set.type === 'dropset'
                    ? 'border-orange-500 text-orange-500 hover:border-orange-400'
                    : 'border-gray-600 text-gray-500 hover:border-gray-400'
            }`}
          >
            {set.completed ? (
              <Check size={14} strokeWidth={3} />
            ) : set.type === 'warmup' ? (
              <Flame size={12} />
            ) : set.type === 'dropset' ? (
              <CornerDownRight size={12} />
            ) : (
              <span className="text-[11px] font-bold tabular-nums">{setIndex + 1}</span>
            )}
          </button>
        </td>
      </tr>
    </Fragment>
  );
}
