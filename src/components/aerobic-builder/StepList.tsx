import { Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { BlockStep } from '../../types/aerobic';
import { useAerobicBuilder } from './AerobicBuilderContext';
import { StepCard } from './StepCard';

export interface StepListProps {
  blockId: string;
  steps: BlockStep[];
}

/**
 * Animated list of steps inside a block, with an Add Step button.
 */
export function StepList({ blockId, steps }: StepListProps) {
  const { addStep } = useAerobicBuilder();

  return (
    <div className="space-y-1.5">
      <AnimatePresence initial={false}>
        {steps.map((step) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <StepCard blockId={blockId} step={step} />
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => addStep(blockId)}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-gray-200 text-xs font-medium text-gray-400 hover:border-yellow-400 hover:text-yellow-500 hover:bg-yellow-50 transition-colors"
      >
        <Plus size={12} />
        Adicionar Step
      </button>
    </div>
  );
}
