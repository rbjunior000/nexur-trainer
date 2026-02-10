import type { Dispatch, SetStateAction } from 'react';
import { WorkoutHeader } from './WorkoutHeader';
import { AerobicWorkout } from './AerobicWorkout';
import type { AerobicWorkout as AerobicWorkoutType } from '../types/aerobic';

export function AerobicEditor({
  workout,
  setWorkout,
}: {
  workout: AerobicWorkoutType;
  setWorkout: Dispatch<SetStateAction<AerobicWorkoutType>>;
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
      <WorkoutHeader />

      <div className="mb-8">
        <AerobicWorkout workout={workout} setWorkout={setWorkout} />
      </div>
    </div>
  );
}
