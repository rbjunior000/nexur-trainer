import { useState } from 'react';
import { Clock, Pencil, Image } from 'lucide-react';
import { MediaPreview } from '../MediaPreview';
import { CompactEditSheet } from './CompactEditSheet';
import { useTrainingSession } from './TrainingSessionContext';
import type { TrainingExercise } from './TrainingSessionContext';

function formatRest(seconds: number): string {
  if (seconds <= 0) return 'OFF';
  if (seconds >= 60) return `${Math.floor(seconds / 60)}min`;
  return `${seconds}s`;
}

function setLabel(
  set: { reps?: number; repsRange?: [number, number]; weight?: number; duration?: string; distance?: number; completed: boolean },
  type: string,
  repsMode?: string,
): string {
  if (type === 'weight_reps') {
    const repsLabel =
      repsMode === 'range' && set.repsRange
        ? `${set.repsRange[0]}-${set.repsRange[1]}`
        : String(set.reps ?? 0);
    const weight = set.weight ?? 0;
    return weight > 0 ? `${repsLabel} reps — ${weight}kg` : `${repsLabel} reps`;
  }
  if (type === 'duration') return set.duration || '00:00';
  if (type === 'distance') return `${set.distance ?? 0}m`;
  return '';
}

function CompactExerciseRow({
  exercise,
  exerciseIndex,
  isCurrent,
  onEdit,
}: {
  exercise: TrainingExercise;
  exerciseIndex: number;
  isCurrent: boolean;
  onEdit: () => void;
}) {
  return (
    <div
      className={`flex items-center bg-gray-900 rounded-xl overflow-hidden transition-all ${
        isCurrent ? 'ring-1 ring-yellow-400/50' : ''
      }`}
    >
      <button
        type="button"
        className="flex-shrink-0 w-12 h-12 overflow-hidden bg-gray-800"
        onClick={onEdit}
      >
        {exercise.media1 ? (
          <MediaPreview media={exercise.media1} alt={exercise.name} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image size={18} className="text-gray-600" />
          </div>
        )}
      </button>
      <button
        type="button"
        className="flex-1 px-3 py-2 min-w-0 text-left"
        onClick={onEdit}
      >
        <p className="text-white text-sm font-semibold truncate mb-1">{exercise.name}</p>
        <div className="space-y-0">
          {exercise.sets.map((set) => (
            <div key={set.id}>
              <span className={`text-xs ${set.completed ? 'text-green-400' : 'text-gray-300'}`}>
                {setLabel(set, exercise.type, exercise.repsMode)}
              </span>
            </div>
          ))}
        </div>
      </button>
      <button
        type="button"
        className="flex-shrink-0 px-3 flex items-center justify-center text-gray-500 hover:text-yellow-400 transition-colors"
        onClick={onEdit}
      >
        <Pencil size={14} />
      </button>
    </div>
  );
}

/**
 * Compact view of all exercises. Tap a row to open the edit sheet.
 */
export function CompactView() {
  const { exercises, displayGroups, currentStep } = useTrainingSession();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const editingExercise = editingIndex !== null ? exercises[editingIndex] : null;
  const currentExIdx = currentStep?.exerciseIndex ?? -1;

  return (
    <>
      <div className="pb-4 px-4 pt-4 space-y-2">
        {displayGroups.map((group, gi) => {
          if (group.type === 'rest') {
            const ex = exercises[group.exerciseIndex];
            return (
              <div
                key={ex.id}
                className="flex items-center gap-3 bg-gray-900 rounded-xl px-4 py-3"
              >
                <Clock size={14} className="text-gray-500 flex-shrink-0" />
                <span className="text-gray-400 text-sm">
                  Descanso — {formatRest(ex.restDuration ?? 0)}
                </span>
              </div>
            );
          }

          if (group.type === 'superset') {
            return (
              <div key={group.superset.id} className="relative flex">
                <div
                  className="w-0.5 rounded-full mr-3 flex-shrink-0"
                  style={{ backgroundColor: group.superset.color }}
                />
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 px-1 pb-0.5">
                    <span
                      className="px-2 py-0.5 text-gray-900 text-[10px] font-bold rounded-md"
                      style={{ backgroundColor: group.superset.color }}
                    >
                      Superset
                    </span>
                    <span className="text-gray-400 text-xs">{group.superset.rounds} ciclos</span>
                  </div>
                  {group.exerciseIndices.map((exIdx) => (
                    <CompactExerciseRow
                      key={exercises[exIdx].id}
                      exercise={exercises[exIdx]}
                      exerciseIndex={exIdx}
                      isCurrent={currentExIdx === exIdx}
                      onEdit={() => setEditingIndex(exIdx)}
                    />
                  ))}
                </div>
              </div>
            );
          }

          const exIdx = group.exerciseIndex;
          return (
            <CompactExerciseRow
              key={exercises[exIdx].id}
              exercise={exercises[exIdx]}
              exerciseIndex={exIdx}
              isCurrent={currentExIdx === exIdx}
              onEdit={() => setEditingIndex(exIdx)}
            />
          );
        })}
      </div>

      {editingExercise && editingIndex !== null && (
        <CompactEditSheet
          exercise={editingExercise}
          exerciseIndex={editingIndex}
          onClose={() => setEditingIndex(null)}
        />
      )}
    </>
  );
}
