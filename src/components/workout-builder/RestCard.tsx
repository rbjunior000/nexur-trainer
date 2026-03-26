import { Clock, Trash2 } from 'lucide-react';
import type { StrictExercise } from '../../types/workout';
import { useWorkoutBuilder } from './WorkoutBuilderContext';

export interface RestCardProps {
  exercise: StrictExercise;
}

const REST_PRESETS = [
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '2min', value: 120 },
  { label: '3min', value: 180 },
  { label: '5min', value: 300 },
];

/**
 * Editor card for a rest block (type='rest').
 * Shows duration selector and a delete button.
 */
export function RestCard({ exercise }: RestCardProps) {
  const { updateExercise, removeExercise } = useWorkoutBuilder();

  return (
    <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
      <Clock size={16} className="text-gray-400 flex-shrink-0" />
      <span className="text-sm font-medium text-gray-500 flex-shrink-0">Descanso</span>

      <select
        value={exercise.restDuration ?? 60}
        onChange={(e) =>
          updateExercise(exercise.id, { restDuration: Number(e.target.value) })
        }
        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-yellow-400 appearance-none cursor-pointer"
      >
        {REST_PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => removeExercise(exercise.id)}
        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
        title="Remover descanso"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
