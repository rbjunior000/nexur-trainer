import { WorkoutHeader } from './WorkoutHeader';
import { AerobicWorkout } from './AerobicWorkout';

export function AerobicEditor() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
      <WorkoutHeader />

      <div className="mb-8">
        <AerobicWorkout />
      </div>
    </div>
  );
}
