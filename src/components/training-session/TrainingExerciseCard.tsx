import { Fragment } from 'react';
import { CornerDownRight } from 'lucide-react';
import type { TrainingExercise, TrainingSet, Phase } from './TrainingSessionContext';
import { MediaCarousel } from '../MediaCarousel';
import { TrainingSetRow } from './TrainingSetRow';
import { useTrainingSession } from './TrainingSessionContext';

export interface TrainingExerciseCardProps {
  exercise: TrainingExercise;
  exerciseIndex: number;
}

/**
 * Exercise card displayed in the list view during execution.
 * Shows media carousel, set table, and notes.
 */
export function TrainingExerciseCard({ exercise, exerciseIndex }: TrainingExerciseCardProps) {
  const {
    currentStep,
    phase,
    countdown,
    toggleSetComplete,
    updateSetField,
  } = useTrainingSession();

  const isCurrent = currentStep?.exerciseIndex === exerciseIndex;
  const currentSetIndex = isCurrent ? (currentStep?.setIndex ?? -1) : -1;
  const hasWeight = exercise.type === 'duration' && exercise.sets.some((s) => (s.weight ?? 0) > 0);

  const colHeaders = (() => {
    switch (exercise.type) {
      case 'weight_reps': return ['Carga (kg)', 'Reps', 'PSE', 'Inter', ''];
      case 'duration': return hasWeight ? ['Carga (kg)', 'Duração', 'PSE', 'Inter', ''] : ['Duração', 'PSE', 'Inter', ''];
      case 'distance': return ['Distância (km)', 'PSE', 'Inter', ''];
      default: return ['#', 'Carga', 'Reps', 'PSE', 'Inter', ''];
    }
  })();

  const corStyle =
    !exercise.supersetId && exercise.cor && exercise.cor !== '#f1f1f1'
      ? { borderLeft: `4px solid ${exercise.cor}` }
      : undefined;

  return (
    <div
      className={`bg-gray-900 rounded-2xl overflow-hidden transition-all ${
        isCurrent ? 'ring-2 ring-yellow-400/50' : ''
      }`}
      style={corStyle}
    >
      {(exercise.media1 || exercise.media2) && (
        <MediaCarousel items={[exercise.media1, exercise.media2]} alt={exercise.name} playable />
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-white font-bold text-lg truncate flex-1">{exercise.name}</h3>
        </div>

        {exercise.orientacoes && (
          <p className="text-gray-400 text-sm mb-3">{exercise.orientacoes}</p>
        )}

        <table className="w-full">
          <thead>
            <tr className="text-gray-500 text-xs uppercase">
              {colHeaders.map((h, i) => (
                <th
                  key={i}
                  className={`py-1.5 font-semibold text-left ${
                    i === 0 ? 'pl-3 px-2' : i === colHeaders.length - 1 ? 'pl-2 pr-3 w-10' : 'px-2'
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exercise.sets.map((set, si) => (
              <Fragment key={set.id}>
                <TrainingSetRow
                  set={set}
                  setIndex={si}
                  exerciseType={exercise.type}
                  repsMode={exercise.repsMode}
                  isCurrent={isCurrent && si === currentSetIndex}
                  showWeight={exercise.type !== 'duration' || hasWeight}
                  phase={phase}
                  countdown={isCurrent && si === currentSetIndex ? countdown : null}
                  onToggle={() => toggleSetComplete(exerciseIndex, si)}
                  onUpdateField={(field, value) => updateSetField(exerciseIndex, si, field, value)}
                />
                {set.type === 'dropset' &&
                  (set.dropsets ?? []).map((drop) => (
                    <tr key={drop.id} className="border-b border-gray-800/30">
                      {exercise.type === 'weight_reps' && (
                        <>
                          <td className="py-1.5 px-2">
                            <span className="block w-16 text-center text-sm font-semibold text-gray-400">
                              {drop.weight ?? 0}
                            </span>
                          </td>
                          <td className="py-1.5 px-2">
                            <span className="block w-14 text-center text-sm font-semibold text-gray-400">
                              {exercise.repsMode === 'range' && drop.repsRange
                                ? `${drop.repsRange[0]}-${drop.repsRange[1]}`
                                : String(drop.reps ?? 0)}
                            </span>
                          </td>
                        </>
                      )}
                      {exercise.type === 'duration' && (
                        <>
                          {hasWeight && (
                            <td className="py-1.5 px-2">
                              <span className="block w-16 text-center text-sm font-semibold text-gray-400">
                                {drop.weight ?? 0}
                              </span>
                            </td>
                          )}
                          <td className="py-1.5 px-2">
                            <span className="block text-center text-sm font-semibold text-gray-400">
                              {drop.duration || '00:00'}
                            </span>
                          </td>
                        </>
                      )}
                      {exercise.type === 'distance' && (
                        <td className="py-1.5 px-2">
                          <span className="block w-16 text-center text-sm font-semibold text-gray-400">
                            {drop.distance ?? 0}
                          </span>
                        </td>
                      )}
                      <td className="py-1.5 px-2">
                        <span className="text-gray-700 text-xs">—</span>
                      </td>
                      <td className="py-1.5 pl-2 pr-3">
                        <span className="w-7 h-7 flex items-center justify-center text-orange-700">
                          <CornerDownRight size={13} />
                        </span>
                      </td>
                    </tr>
                  ))}
              </Fragment>
            ))}
          </tbody>
        </table>

        {exercise.notes && (
          <p className="mt-3 text-sm text-gray-400">
            <span className="text-gray-500 font-medium">Nota: </span>
            {exercise.notes}
          </p>
        )}
      </div>
    </div>
  );
}
