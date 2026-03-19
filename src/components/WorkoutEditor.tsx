import { useRef, useCallback, useState } from 'react';
import { WorkoutHeader } from './WorkoutHeader';
import { StrictWorkout } from './StrictWorkout';
import { LoadPreviewModal } from './LoadPreviewModal';
import { Edit2, Dumbbell, Timer, BarChart2 } from 'lucide-react';
import type { LibraryExercise } from '../App';
import type { StrictExercise, ExerciseType } from '../types/workout';

export function WorkoutEditor({
  onRegisterAdd,
  onStartTraining,
  defaultExerciseType,
}: {
  onRegisterAdd?: (fn: (ex: LibraryExercise) => void) => void;
  onStartTraining?: (exercises: StrictExercise[]) => void;
  defaultExerciseType?: ExerciseType;
}) {
  const exercisesRef = useRef<StrictExercise[]>([]);
  const addRestFnRef = useRef<(() => void) | null>(null);
  const [showLoadPreview, setShowLoadPreview] = useState(false);

  const handleExercisesChange = useCallback((exercises: StrictExercise[]) => {
    exercisesRef.current = exercises;
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
      <WorkoutHeader />

      <div className="mb-8">
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Exercicios</h2>
          <div className="flex gap-3">
            <button
              onClick={() => addRestFnRef.current?.()}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Timer size={16} />
              Descanso
            </button>
            <button
              onClick={() => setShowLoadPreview(true)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <BarChart2 size={16} />
              Carga
            </button>
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <Edit2 size={16} />
              Editar
            </button>
            <button
              onClick={() => {
                if (exercisesRef.current.length > 0) {
                  onStartTraining?.(exercisesRef.current);
                }
              }}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Dumbbell size={16} />
              Treinar
            </button>
          </div>
        </div>

        <StrictWorkout
          onRegisterAdd={onRegisterAdd}
          onRegisterAddRest={(fn) => { addRestFnRef.current = fn; }}
          onExercisesChange={handleExercisesChange}
          defaultExerciseType={defaultExerciseType}
        />
      </div>

      {showLoadPreview && (
        <LoadPreviewModal
          exercises={exercisesRef.current}
          onClose={() => setShowLoadPreview(false)}
        />
      )}
    </div>
  );
}
