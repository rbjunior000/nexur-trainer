import { Trophy } from 'lucide-react';
import { useTrainingSession } from './TrainingSessionContext';
import { StatCard } from '../shared/StatCard';
import { formatElapsed } from '../../utils/formatTime';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';

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
    <Dialog
      open={showSummary}
      onOpenChange={(open) => !open && closeSummary()}
    >
      <DialogContent
        className="max-w-sm bg-gray-900 border border-gray-800"
        showClose={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center border-b-gray-800 pt-8">
          <div className="w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center mb-3">
            <Trophy size={32} className="text-yellow-400" />
          </div>
          <DialogTitle className="text-2xl text-white text-center">Treino concluído!</DialogTitle>
          <DialogDescription className="text-gray-500 text-center">
            Parabéns pelo treino de hoje
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-6">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Duração" value={formatElapsed(elapsed)} />
            <StatCard label="Séries" value={`${completedCount}/${totalSets}`} />
            <StatCard
              label="Volume"
              value={totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${totalVolume}kg`}
            />
          </div>
        </div>

        <DialogFooter className="border-t-gray-800">
          <button
            type="button"
            onClick={closeSummary}
            className="flex-1 py-3.5 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 transition-colors"
          >
            Finalizar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
