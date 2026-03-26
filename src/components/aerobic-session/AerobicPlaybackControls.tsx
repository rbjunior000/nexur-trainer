import { Play, Pause, SkipForward, SkipBack, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ZONE_HEX } from '../aerobic-builder/ZoneBadge';
import { useAerobicSession } from './AerobicSessionContext';

/**
 * Sticky playback bar: Skip Back, Play/Pause, Skip Forward.
 * Shows a "Concluir Passo" button for DISTANCE steps.
 */
export function AerobicPlaybackControls() {
  const { phase, isTimeStep, currentStep, togglePlayPause, goNext, goPrev } = useAerobicSession();

  const zoneHex = currentStep ? ZONE_HEX[currentStep.step.intensity] : '#eab308';

  return (
    <div className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-gray-100">
      <div className="px-4 py-4 flex items-center justify-center gap-6">
        <motion.button
          type="button"
          aria-label="Passo anterior"
          whileTap={{ scale: 0.9 }}
          onClick={goPrev}
          className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <SkipBack size={20} />
        </motion.button>

        <motion.button
          type="button"
          aria-label={phase === 'paused' ? 'Retomar' : 'Pausar'}
          whileTap={{ scale: 0.9 }}
          onClick={togglePlayPause}
          className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-white shadow-lg hover:bg-gray-800 transition-colors"
        >
          {phase === 'paused' ? <Play size={28} /> : <Pause size={28} />}
        </motion.button>

        <motion.button
          type="button"
          aria-label="Próximo passo"
          whileTap={{ scale: 0.9 }}
          onClick={goNext}
          className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <SkipForward size={20} />
        </motion.button>

        {!isTimeStep && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={goNext}
            className="px-5 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-colors"
            style={{ backgroundColor: zoneHex }}
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 size={18} />
              Concluir Passo
            </span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
