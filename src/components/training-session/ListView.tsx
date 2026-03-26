import { useRef } from 'react';
import type { DisplayGroup } from './TrainingSessionContext';
import { useTrainingSession } from './TrainingSessionContext';
import { TrainingExerciseCard } from './TrainingExerciseCard';
import { TrainingRestCard } from './TrainingRestCard';

/**
 * Full list view of all exercises in the training session.
 * Scrolls to the current exercise automatically.
 */
export function ListView() {
  const { exercises, supersets, displayGroups, currentStep, phase, countdown } =
    useTrainingSession();

  const currentExIdx = currentStep?.exerciseIndex ?? -1;

  return (
    <div className="pb-8 px-4 pt-4 space-y-4">
      {displayGroups.map((group, gi) => {
        if (group.type === 'rest') {
          const ex = exercises[group.exerciseIndex];
          return (
            <TrainingRestCard
              key={ex.id}
              exercise={ex}
              isActive={currentExIdx === group.exerciseIndex && currentStep?.isRestStep === true}
              countdown={countdown}
            />
          );
        }

        if (group.type === 'superset') {
          const { superset, exerciseIndices } = group;
          return (
            <div key={superset.id} className="relative flex">
              <div
                className="flex flex-col items-center mr-3 pt-1"
              >
                <div
                  className="w-0.5 flex-1 rounded-full"
                  style={{ backgroundColor: superset.color }}
                />
              </div>
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2.5 py-1 text-gray-900 text-xs font-bold rounded-md"
                    style={{ backgroundColor: superset.color }}
                  >
                    Superset
                  </span>
                  <span className="text-gray-400 text-sm font-medium">
                    {superset.rounds} Ciclos
                  </span>
                </div>
                {exerciseIndices.map((exIdx) => (
                  <TrainingExerciseCard
                    key={exercises[exIdx].id}
                    exercise={exercises[exIdx]}
                    exerciseIndex={exIdx}
                  />
                ))}
              </div>
            </div>
          );
        }

        // single
        return (
          <TrainingExerciseCard
            key={exercises[group.exerciseIndex].id}
            exercise={exercises[group.exerciseIndex]}
            exerciseIndex={group.exerciseIndex}
          />
        );
      })}
    </div>
  );
}
