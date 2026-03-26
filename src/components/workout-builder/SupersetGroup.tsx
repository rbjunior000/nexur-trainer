import { Link } from 'lucide-react';
import type { StrictExercise } from '../../types/workout';
import { ColorBar } from './ColorBar';
import { useWorkoutBuilder } from './WorkoutBuilderContext';

export interface SupersetGroupProps {
  /** First exercise in the superset (determines color, unlink action). */
  leadExercise: StrictExercise;
  children: React.ReactNode;
}

/**
 * Visual wrapper for a superset group.
 * Renders a colored left bar + badge + color picker.
 * The children should be the ExerciseCard components in the superset.
 */
export function SupersetGroup({ leadExercise, children }: SupersetGroupProps) {
  const { updateExercise, unlinkSuperset } = useWorkoutBuilder();
  const color = leadExercise.cor && leadExercise.cor !== '#f1f1f1' ? leadExercise.cor : '#FBBF24';

  return (
    <div className="relative flex gap-3">
      {/* Left accent bar */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-1 flex-1 rounded-full" style={{ background: color }} />
      </div>

      <div className="flex-1 flex flex-col gap-2">
        {/* Superset badge */}
        <div className="flex items-center gap-2">
          <ColorBar
            color={leadExercise.cor}
            onChange={(hex) => updateExercise(leadExercise.id, { cor: hex })}
          />
          <button
            type="button"
            onClick={() => unlinkSuperset(leadExercise.id)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-gray-700 transition-colors hover:opacity-80"
            style={{ background: color }}
            title="Remover superset"
          >
            <Link size={12} />
            Superset
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
