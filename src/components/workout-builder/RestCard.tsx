import { GripVertical, Timer, Trash2 } from 'lucide-react';
import type { StrictExercise } from '../../types/workout';
import { useWorkoutBuilder } from './WorkoutBuilderContext';

export interface RestCardProps {
  exercise: StrictExercise;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

const REST_PRESETS = [
  { label: 'OFF', value: 0 },
  { label: '10s', value: 10 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '2min', value: 120 },
  { label: '3min', value: 180 },
];

const PRESET_VALUES = REST_PRESETS.map((p) => p.value);

/**
 * Editor card for a rest block (type='rest').
 * Shows duration pill buttons and a delete button.
 */
export function RestCard({ exercise, dragHandleProps }: RestCardProps) {
  const { updateExercise, removeExercise } = useWorkoutBuilder();

  const current = exercise.restDuration ?? 60;
  const isCustom = !PRESET_VALUES.includes(current);

  function handleOutro() {
    const input = window.prompt('Duração personalizada (em segundos):', String(current));
    if (input === null) return;
    const val = parseInt(input, 10);
    if (!isNaN(val) && val >= 0) {
      updateExercise(exercise.id, { restDuration: val });
    }
  }

  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-gray-50 border border-gray-200 my-1">
      <div className="flex items-center gap-2 flex-shrink-0">
        <Timer size={16} className="text-gray-400" aria-hidden="true" />
        <span className="text-sm font-bold text-gray-600">Descanso</span>
      </div>

      <div className="flex items-center gap-1.5 flex-1 overflow-x-auto hide-scrollbar">
        {REST_PRESETS.map((p) => {
          const active = !isCustom && current === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => updateExercise(exercise.id, { restDuration: p.value })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {p.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={handleOutro}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            isCustom
              ? 'bg-yellow-400 text-gray-900'
              : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          {isCustom ? `${current}s` : 'Outro'}
        </button>
      </div>

      <button
        type="button"
        onClick={() => removeExercise(exercise.id)}
        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
        title="Remover descanso"
      >
        <Trash2 size={14} aria-hidden="true" />
      </button>

      {dragHandleProps && (
        <button
          type="button"
          className="flex items-center justify-center p-1 text-gray-300 cursor-grab hover:text-gray-500 transition-colors flex-shrink-0 touch-none"
          {...dragHandleProps}
        >
          <GripVertical size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
