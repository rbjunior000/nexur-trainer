import { Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatElapsed } from '../../utils/formatTime';
import { ZoneDistributionChart } from './ZoneDistributionChart';
import { useAerobicSession } from './AerobicSessionContext';

/**
 * Completion modal shown when the aerobic session finishes.
 * Displays duration, blocks, steps, and zone distribution.
 */
export function AerobicSummaryModal() {
  const {
    showSummary,
    elapsed,
    completedBlockCount,
    stepsCompleted,
    steps,
    zoneTime,
    closeSummary,
  } = useAerobicSession();

  if (!showSummary) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy size={32} className="text-yellow-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Treino concluído!</h2>
        <p className="text-gray-500 text-sm mb-6">Parabéns pelo treino de hoje</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-lg font-bold text-gray-900">{formatElapsed(elapsed)}</div>
            <div className="text-[10px] text-gray-400 uppercase font-bold">Duração</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-lg font-bold text-gray-900">{completedBlockCount}</div>
            <div className="text-[10px] text-gray-400 uppercase font-bold">Blocos</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-lg font-bold text-gray-900">
              {stepsCompleted}/{steps.length}
            </div>
            <div className="text-[10px] text-gray-400 uppercase font-bold">Steps</div>
          </div>
        </div>

        <div className="mb-6 text-left">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            Tempo por zona
          </h3>
          <ZoneDistributionChart zoneTime={zoneTime} />
        </div>

        <button
          type="button"
          onClick={closeSummary}
          className="w-full py-3.5 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 transition-colors"
        >
          Finalizar
        </button>
      </motion.div>
    </motion.div>
  );
}
