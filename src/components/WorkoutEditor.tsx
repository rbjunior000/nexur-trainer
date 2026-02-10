import { WorkoutHeader } from './WorkoutHeader';
import { StrictWorkout } from './StrictWorkout';
import { Edit2, Dumbbell } from 'lucide-react';
import type { LibraryExercise } from '../App';

export function WorkoutEditor({
  onRegisterAdd,
}: {
  onRegisterAdd?: (fn: (ex: LibraryExercise) => void) => void;
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
      <WorkoutHeader />

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Exercícios</h2>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <Edit2 size={16} />
              Editar
            </button>
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <Dumbbell size={16} />
              Treinar
            </button>
          </div>
        </div>

        <StrictWorkout onRegisterAdd={onRegisterAdd} />
      </div>
    </div>
  );
}
