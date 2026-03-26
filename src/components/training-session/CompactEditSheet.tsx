import { X } from 'lucide-react';
import type { TrainingExercise } from './TrainingSessionContext';
import { useTrainingSession } from './TrainingSessionContext';

function setLabel(set: { reps?: number; repsRange?: [number, number]; weight?: number; duration?: string; distance?: number; completed: boolean }, type: string, repsMode?: string): string {
  if (type === 'weight_reps') {
    const repsLabel =
      repsMode === 'range' && set.repsRange
        ? `${set.repsRange[0]}-${set.repsRange[1]}`
        : String(set.reps ?? 0);
    return set.weight ? `${repsLabel} reps — ${set.weight}kg` : `${repsLabel} reps`;
  }
  if (type === 'duration') return set.duration || '00:00';
  if (type === 'distance') return `${set.distance ?? 0}m`;
  return '';
}

export interface CompactEditSheetProps {
  exercise: TrainingExercise;
  exerciseIndex: number;
  onClose: () => void;
}

/**
 * Bottom sheet for editing a single exercise's sets in the compact view.
 */
export function CompactEditSheet({ exercise, exerciseIndex, onClose }: CompactEditSheetProps) {
  const { toggleSetComplete, updateSetField } = useTrainingSession();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gray-900 rounded-t-2xl p-5 pb-8 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-base truncate pr-4">{exercise.name}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2">
          {exercise.sets.map((set, si) => (
            <div
              key={set.id}
              className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3"
            >
              <span className="text-gray-300 text-xs font-semibold w-12 shrink-0">
                Série {si + 1}
              </span>
              <span className={`flex-1 text-sm ${set.completed ? 'text-green-400' : 'text-white'}`}>
                {setLabel(set, exercise.type, exercise.repsMode)}
              </span>

              {exercise.type === 'weight_reps' && (
                <input
                  type="number"
                  value={set.weight ?? 0}
                  onChange={(e) => updateSetField(exerciseIndex, si, 'weight', Number(e.target.value) || 0)}
                  className="w-16 bg-gray-700 text-white text-sm text-center rounded-lg px-2 py-1 border border-gray-600 focus:border-yellow-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              )}

              <button
                type="button"
                onClick={() => toggleSetComplete(exerciseIndex, si)}
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                  set.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-600 text-gray-500 hover:border-gray-400'
                }`}
              >
                {set.completed ? '✓' : si + 1}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
