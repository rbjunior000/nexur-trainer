import { Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrainingSession } from './TrainingSessionContext';
import { StatCard } from '../shared/StatCard';
import { formatElapsed } from '../../utils/formatTime';

/**
 * Workout completion modal.
 * Shows duration, sets completed, and total volume.
 */
export function TrainingSummaryModal() {
  const { showSummary, exercises, completedSetIds, elapsed, closeSummary } = useTrainingSession();

  const nonRest = exercises.filter((e) => !e.isRest);
  const totalSets = nonRest.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedCount = completedSetIds.size;

  const totalVolume = nonRest.reduce(
    (acc, ex) =>
      acc +
      ex.sets
        .filter((s) => completedSetIds.has(s.id))
        .reduce((a, s) => {
          const mainVol = (s.weight || 0) * (s.reps || 0);
          const dropsVol =
            s.type === 'dropset'
              ? (s.dropsets ?? []).reduce((d, drop) => d + (drop.weight || 0) * (drop.reps || 0), 0)
              : 0;
          return a + mainVol + dropsVol;
        }, 0),
    0,
  );

  return (
    <AnimatePresence>
      {showSummary && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl border border-gray-800"
          >
            <div className="w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy size={32} className="text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Treino concluído!</h2>
            <p className="text-gray-500 text-sm mb-8">Parabéns pelo treino de hoje</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <StatCard label="Duração" value={formatElapsed(elapsed)} />
              <StatCard label="Séries" value={`${completedCount}/${totalSets}`} />
              <StatCard
                label="Volume"
                value={totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${totalVolume}kg`}
              />
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
      )}
    </AnimatePresence>
  );
}
