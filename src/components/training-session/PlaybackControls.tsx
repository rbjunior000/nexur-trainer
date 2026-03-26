import { Play, Pause, Square, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTrainingSession } from './TrainingSessionContext';
import { formatElapsed } from '../../utils/formatTime';

export interface PlaybackControlsProps {
  /** Label for the next step (shown above the Next button). */
  nextStepLabel?: string;
}

/**
 * Sticky footer playback controls:
 * Play/Pause · Stop · elapsed · Prev · Next
 */
export function PlaybackControls({ nextStepLabel }: PlaybackControlsProps) {
  const { isRunning, elapsed, currentStepIdx, focusSteps, phase, togglePlayPause, stopSession, goNext, goPrev } =
    useTrainingSession();

  const isFirst = currentStepIdx === 0;

  return (
    <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800 safe-area-pb">
      {/* Next label */}
      {nextStepLabel && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <SkipForward size={12} className="text-gray-500" />
          <span className="text-gray-500 text-xs truncate">A seguir: {nextStepLabel}</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 px-4 py-3">
        {/* Prev */}
        <button
          type="button"
          onClick={goPrev}
          disabled={isFirst}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors disabled:opacity-30"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Stop */}
        <button
          type="button"
          onClick={stopSession}
          className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <Square size={16} />
        </button>

        {/* Play/Pause */}
        <motion.button
          type="button"
          onClick={togglePlayPause}
          whileTap={{ scale: 0.9 }}
          className="w-14 h-14 rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 shadow-lg"
        >
          {isRunning ? <Pause size={24} strokeWidth={2.5} /> : <Play size={24} strokeWidth={2.5} className="ml-0.5" />}
        </motion.button>

        {/* Elapsed */}
        <span className="text-gray-500 text-sm font-mono tabular-nums w-14 text-center">
          {formatElapsed(elapsed)}
        </span>

        {/* Next */}
        <button
          type="button"
          onClick={goNext}
          className="w-10 h-10 rounded-full flex items-center justify-center text-yellow-400 hover:text-yellow-300 transition-colors"
        >
          <ChevronRight size={22} />
        </button>
      </div>
    </div>
  );
}
