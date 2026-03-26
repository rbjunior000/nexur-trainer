import { useEffect } from 'react';
import { Play, Pencil } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { AerobicWorkout } from '../../types/aerobic';
import { DEFAULT_BLOCKS } from '../../types/aerobic';
import { AerobicBuilderProvider, useAerobicBuilder } from './AerobicBuilderContext';
import { SportSelector } from './SportSelector';
import { BlockList } from './BlockList';

export interface AerobicBuilderPageProps {
  /** Called when the user clicks "Iniciar Treino". */
  onStartTraining?: () => void;
  /** Called every time the workout changes (for parent to persist or pass to execution). */
  onWorkoutChange?: (workout: AerobicWorkout) => void;
}

// ─── Inner (consumes context) ──────────────────────────────────────────────────

function AerobicBuilderInner({
  onStartTraining,
  onWorkoutChange,
  onSave,
}: AerobicBuilderPageProps & { onSave: (w: AerobicWorkout) => void }) {
  const { workout, updateMeta } = useAerobicBuilder();
  const hasSteps = workout.blocks.some((b) => b.steps.length > 0);

  useEffect(() => {
    onWorkoutChange?.(workout);
    onSave(workout);
  }, [workout, onWorkoutChange, onSave]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 min-w-0">
          <Pencil size={16} className="text-yellow-500 flex-shrink-0" />
          <input
            type="text"
            value={workout.workoutName}
            onChange={(e) => updateMeta({ workoutName: e.target.value })}
            aria-label="Nome do treino"
            className="text-lg font-bold text-gray-900 bg-transparent focus:outline-none focus:border-b-2 focus:border-yellow-400 min-w-0 truncate"
          />
        </div>
        <button
          type="button"
          disabled={!hasSteps}
          onClick={() => hasSteps && onStartTraining?.()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 ml-4"
        >
          <Play size={15} />
          Iniciar
        </button>
      </div>

      {/* Sport selector */}
      <div className="mb-6">
        <SportSelector
          value={workout.sport}
          onChange={(sport) => updateMeta({ sport })}
        />
      </div>

      {/* Block list */}
      <BlockList />
    </div>
  );
}

// ─── Page (owns Provider + localStorage) ──────────────────────────────────────

const DEFAULT_WORKOUT: AerobicWorkout = {
  workoutName: 'Novo Treino Aeróbico',
  workoutStartDate: '',
  workoutEndDate: '',
  workoutDescription: '',
  sport: 'running',
  blocks: DEFAULT_BLOCKS,
};

/**
 * Top-level aerobic workout editor page.
 * Wraps everything in <AerobicBuilderProvider> and persists to localStorage.
 */
export function AerobicBuilderPage({ onStartTraining, onWorkoutChange }: AerobicBuilderPageProps) {
  const [savedWorkout, setSavedWorkout] = useLocalStorage<AerobicWorkout>(
    'nexur-aerobic-workout',
    DEFAULT_WORKOUT,
  );

  return (
    <AerobicBuilderProvider initialWorkout={savedWorkout}>
      <AerobicBuilderInner
        onStartTraining={onStartTraining}
        onWorkoutChange={onWorkoutChange}
        onSave={setSavedWorkout}
      />
    </AerobicBuilderProvider>
  );
}
