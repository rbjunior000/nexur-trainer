import { ArrowLeft, Clock, Square } from 'lucide-react';
import { SPORT_LABELS } from '../../types/aerobic';
import { formatElapsed } from '../../utils/formatTime';
import { useAerobicSession } from './AerobicSessionContext';

export interface AerobicHeaderProps {
  onBack: () => void;
}

/**
 * Sticky header for the aerobic execution page.
 * Shows workout name, sport badge, elapsed time, and a Stop button.
 */
export function AerobicHeader({ onBack }: AerobicHeaderProps) {
  const { workout, elapsed, stop } = useAerobicSession();

  return (
    <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Voltar"
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-gray-900 text-base truncate max-w-[160px]">
                {workout.workoutName}
              </h1>
              <span className="px-2 py-0.5 bg-gray-100 rounded-md text-[10px] font-bold text-gray-500 uppercase">
                {SPORT_LABELS[workout.sport]}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock size={12} />
              <span className="tabular-nums">{formatElapsed(elapsed)}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={stop}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors"
        >
          <Square size={14} />
          Parar
        </button>
      </div>
    </div>
  );
}
