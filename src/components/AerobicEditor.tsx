import type { Dispatch, SetStateAction } from 'react';
import { Play } from 'lucide-react';
import { WorkoutHeader } from './WorkoutHeader';
import { AerobicWorkout } from './AerobicWorkout';
import type { AerobicWorkout as AerobicWorkoutType } from '../types/aerobic';

export function AerobicEditor({
  workout,
  setWorkout,
  onStartTraining,
}: {
  workout: AerobicWorkoutType;
  setWorkout: Dispatch<SetStateAction<AerobicWorkoutType>>;
  onStartTraining?: () => void;
}) {
  const hasSteps = workout.blocks.some((b) => b.steps.length > 0);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
      <WorkoutHeader />

      <div className="mb-4 flex items-center justify-end">
        <button
          onClick={() => {
            if (hasSteps) onStartTraining?.();
          }}
          className="flex items-center gap-2 text-sm text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
        >
          <Play size={16} />
          Iniciar Treino
        </button>
      </div>

      <div className="mb-8">
        <AerobicWorkout workout={workout} setWorkout={setWorkout} />
      </div>
    </div>
  );
}
