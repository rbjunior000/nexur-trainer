import { Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAerobicBuilder } from './AerobicBuilderContext';
import { BlockCard } from './BlockCard';

/**
 * Animated list of BlockCards with an Add Block button at the bottom.
 */
export function BlockList() {
  const { workout, addBlock } = useAerobicBuilder();
  const { blocks } = workout;

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {blocks.map((block, idx) => (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <BlockCard block={block} isFirst={idx === 0} isLast={idx === blocks.length - 1} />
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        type="button"
        onClick={addBlock}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-400 hover:border-yellow-400 hover:text-yellow-500 hover:bg-yellow-50 transition-colors"
      >
        <Plus size={16} />
        Adicionar Bloco
      </button>
    </div>
  );
}
