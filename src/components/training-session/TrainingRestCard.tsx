import { Clock } from 'lucide-react';
import type { TrainingExercise } from './TrainingSessionContext';
import { formatTime } from '../../utils/formatTime';

function formatRest(seconds: number): string {
  if (seconds <= 0) return 'OFF';
  if (seconds >= 60) return `${Math.floor(seconds / 60)}min`;
  return `${seconds}s`;
}

export interface TrainingRestCardProps {
  exercise: TrainingExercise;
  isActive: boolean;
  /** Remaining rest seconds when active. */
  countdown?: number | null;
}

/** Rest block card displayed in the training execution list view. */
export function TrainingRestCard({ exercise, isActive, countdown }: TrainingRestCardProps) {
  const showCountdown = isActive && countdown !== null && countdown !== undefined && countdown > 0;

  return (
    <div
      className={`bg-gray-900 rounded-2xl p-6 flex items-center justify-center gap-3 transition-all ${
        isActive ? 'ring-2 ring-yellow-400/50' : ''
      }`}
    >
      <Clock size={20} className={isActive ? 'text-yellow-400' : 'text-gray-500'} />
      <span className={`font-semibold text-lg ${isActive ? 'text-yellow-400' : 'text-gray-400'}`}>
        {showCountdown
          ? `Descanso — ${formatTime(countdown!)}`
          : `Descanso — ${formatRest(exercise.restDuration ?? 0)}`}
      </span>
    </div>
  );
}
