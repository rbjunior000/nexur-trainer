import { useRef, useCallback, useState } from 'react';
import { WorkoutHeader } from './WorkoutHeader';
import { StrictWorkout } from './StrictWorkout';
import { LoadPreviewModal } from './LoadPreviewModal';
import { Edit2, Dumbbell, Timer, BarChart2, X } from 'lucide-react';
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
  const bulkToggleFnRef = useRef<(() => void) | null>(null);
  const bulkClearFnRef = useRef<(() => void) | null>(null);
  const bulkRemoveFnRef = useRef<(() => void) | null>(null);
  const bulkFillFnRef = useRef<(() => void) | null>(null);
  const toggleSelectAllFnRef = useRef<(() => void) | null>(null);
  const [showLoadPreview, setShowLoadPreview] = useState(false);
  const [bulkState, setBulkState] = useState({ active: false, count: 0, allSelected: false });

  const handleExercisesChange = useCallback((exercises: StrictExercise[]) => {
    exercisesRef.current = exercises;
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
      <WorkoutHeader />

      <div className="mb-8">
        {/* Header row */}
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Exercicios</h2>
          <div className="flex gap-3">
            {bulkState.active ? (
              <>
                <button
                  onClick={() => bulkToggleFnRef.current?.()}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <X size={16} />
                  Cancelar ({bulkState.count})
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
              </>
            ) : (
              <>
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
                <button
                  onClick={() => bulkToggleFnRef.current?.()}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
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
              </>
            )}
          </div>
        </div>

        {/* Bulk action row */}
        {bulkState.active && (
          <div className="flex items-center gap-5 mb-4 pb-3 border-b border-gray-100">
            <input
              type="checkbox"
              checked={bulkState.allSelected}
              onChange={() => toggleSelectAllFnRef.current?.()}
              className="w-4 h-4 accent-yellow-400 cursor-pointer flex-shrink-0"
            />
            <button
              onClick={() => { if (bulkState.count > 0) bulkFillFnRef.current?.(); }}
              disabled={bulkState.count === 0}
              className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Preencher
            </button>
            <button
              onClick={() => { if (bulkState.count > 0) bulkClearFnRef.current?.(); }}
              disabled={bulkState.count === 0}
              className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Limpar
            </button>
            <button
              onClick={() => { if (bulkState.count > 0) bulkRemoveFnRef.current?.(); }}
              disabled={bulkState.count === 0}
              className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Remover
            </button>
          </div>
        )}

        <StrictWorkout
          onRegisterAdd={onRegisterAdd}
          onRegisterAddRest={(fn) => { addRestFnRef.current = fn; }}
          onRegisterToggleBulk={(fn) => { bulkToggleFnRef.current = fn; }}
          onRegisterBulkClear={(fn) => { bulkClearFnRef.current = fn; }}
          onRegisterBulkRemove={(fn) => { bulkRemoveFnRef.current = fn; }}
          onRegisterBulkFill={(fn) => { bulkFillFnRef.current = fn; }}
          onRegisterToggleSelectAll={(fn) => { toggleSelectAllFnRef.current = fn; }}
          onBulkStateChange={setBulkState}
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
