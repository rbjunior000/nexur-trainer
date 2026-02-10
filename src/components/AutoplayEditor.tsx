import { useRef } from 'react';
import { WorkoutHeader } from './WorkoutHeader';
import { AutoplayWorkout } from './AutoplayWorkout';
import { Edit2, Timer, Clock } from 'lucide-react';
import type { LibraryExercise } from '../App';

export function AutoplayEditor({
  onRegisterAdd,
}: {
  onRegisterAdd?: (fn: (ex: LibraryExercise) => void) => void;
}) {
  const addRestFnRef = useRef<(() => void) | null>(null);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
      <WorkoutHeader />

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Exercícios</h2>
          <div className="flex gap-3">
            <button
              onClick={() => addRestFnRef.current?.()}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Clock size={16} />
              Adicionar descanso
            </button>
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <Edit2 size={16} />
              Editar
            </button>
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <Timer size={16} />
              Autoplay
            </button>
          </div>
        </div>

        <AutoplayWorkout
          onRegisterAdd={onRegisterAdd}
          onRegisterAddRest={(fn) => { addRestFnRef.current = fn; }}
        />
      </div>
    </div>
  );
}
