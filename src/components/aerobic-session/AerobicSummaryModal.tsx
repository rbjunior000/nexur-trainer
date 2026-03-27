import { Trophy } from 'lucide-react';
import { formatElapsed } from '../../utils/formatTime';
import { ZoneDistributionChart } from './ZoneDistributionChart';
import { useAerobicSession } from './AerobicSessionContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';

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

  return (
    <Dialog
      open={showSummary}
      onOpenChange={(open) => !open && closeSummary()}
    >
      <DialogContent
        className="max-w-sm max-h-[90vh]"
        showClose={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center pt-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
            <Trophy size={32} className="text-yellow-500" />
          </div>
          <DialogTitle className="text-2xl text-center">Treino concluído!</DialogTitle>
          <DialogDescription className="text-center">
            Parabéns pelo treino de hoje
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-gray-900">{formatElapsed(elapsed)}</div>
              <div className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">Duração</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-gray-900">{completedBlockCount}</div>
              <div className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">Blocos</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-gray-900">{stepsCompleted}/{steps.length}</div>
              <div className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">Steps</div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
              Tempo por zona
            </h3>
            <ZoneDistributionChart zoneTime={zoneTime} />
          </div>
        </div>

        <DialogFooter>
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
