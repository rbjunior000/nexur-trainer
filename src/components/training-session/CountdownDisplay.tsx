import { Clock } from 'lucide-react';
import { formatTime } from '../../utils/formatTime';

export interface CountdownDisplayProps {
  /** Seconds remaining. */
  value: number;
  label?: string;
  nextStepLabel?: string;
}

/**
 * Full-screen countdown display used in Guided view during rest/duration phases.
 */
export function CountdownDisplay({ value, label = 'Descanso', nextStepLabel }: CountdownDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
      <Clock size={56} className="text-yellow-400" />
      <p className="text-gray-400 text-lg font-semibold uppercase tracking-widest">{label}</p>
      <p className="text-7xl font-bold text-white tabular-nums">{formatTime(value)}</p>
      {nextStepLabel && (
        <p className="text-gray-500 text-sm">A seguir: {nextStepLabel}</p>
      )}
    </div>
  );
}
