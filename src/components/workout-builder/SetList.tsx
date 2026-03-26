import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown } from 'lucide-react';
import type { StrictExercise, SetType, DropSet } from '../../types/workout';
import { SetRow } from './SetRow';
import { useWorkoutBuilder } from './WorkoutBuilderContext';

export interface SetListProps {
  exercise: StrictExercise;
}

/**
 * Full set table for an exercise in the editor.
 * Includes column headers, set rows, dropset sub-rows, and Add Set button.
 */
export function SetList({ exercise }: SetListProps) {
  const { addSet, removeSet, updateSet, addDropset, removeDropset, updateDropset, updateExercise } =
    useWorkoutBuilder();
  const [isRepsMenuOpen, setIsRepsMenuOpen] = useState(false);

  const isRange = exercise.repsMode === 'range';
  const hasReps = exercise.type === 'weight_reps';

  const typeConfig = ({
    weight_reps: { columns: ['Peso (kg)'], hasReps: true },
    duration: { columns: ['Carga (kg)', 'Duração'], hasReps: false },
    distance: { columns: ['Distância (km)'], hasReps: false },
  } as Record<string, { columns: string[]; hasReps: boolean }>)[exercise.type] ?? { columns: [], hasReps: false };

  return (
    <div>
      {/* Header row */}
      <div className="flex items-end gap-2 mb-1.5 px-1">
        <div className="w-8 text-[10px] font-bold text-gray-400 uppercase text-center">#</div>

        {typeConfig.columns.map((col) => (
          <div key={col} className="flex-1 text-[10px] font-bold text-gray-400 uppercase text-center">
            {col}
          </div>
        ))}

        {hasReps && (
          <div className="flex-1 relative text-center">
            <button
              type="button"
              onClick={() => setIsRepsMenuOpen(!isRepsMenuOpen)}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase hover:text-gray-600 transition-colors"
            >
              {isRange ? 'Faixa de Reps' : 'Reps'}
              <ChevronDown size={10} />
            </button>
            <AnimatePresence>
              {isRepsMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsRepsMenuOpen(false)} />
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-700">Opções de Repetições</p>
                    {(['fixed', 'range'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          updateExercise(exercise.id, { repsMode: mode });
                          setIsRepsMenuOpen(false);
                        }}
                        className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          exercise.repsMode === mode
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {mode === 'fixed' ? 'Reps' : 'Faixa de Reps'}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="w-9 text-[10px] font-bold text-gray-400 uppercase text-center">PSE</div>
        <div className="w-20 text-[10px] font-bold text-gray-400 uppercase text-center">
          Descanso
        </div>
        <div className="w-14" />
      </div>

      {/* Set rows */}
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {exercise.sets.map((set, si) => (
            <SetRow
              key={set.id}
              set={set}
              index={si}
              exerciseType={exercise.type}
              repsMode={exercise.repsMode}
              onUpdate={(field, value) => updateSet(exercise.id, set.id, field, value)}
              onUpdateType={(type: SetType) =>
                updateSet(exercise.id, set.id, 'type', type)
              }
              onRemove={() => removeSet(exercise.id, set.id)}
              onAddDropset={() => addDropset(exercise.id, set.id)}
              onRemoveDropset={(dropId) => removeDropset(exercise.id, set.id, dropId)}
              onUpdateDropset={(dropId, field, value) =>
                updateDropset(exercise.id, set.id, dropId, field as keyof DropSet, value)
              }
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Add set button */}
      <button
        type="button"
        onClick={() => addSet(exercise.id)}
        className="mt-2.5 w-full py-1.5 flex items-center justify-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 border-dashed"
      >
        <Plus size={16} />
        Adicionar série
      </button>
    </div>
  );
}
