import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Trash2, ChevronRight, Repeat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WorkoutBlock } from '../../types/aerobic';
import { useAerobicBuilder } from './AerobicBuilderContext';
import { StepList } from './StepList';

export interface BlockCardProps {
  block: WorkoutBlock;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * Collapsible card for a workout block, with header controls and a StepList.
 */
export function BlockCard({ block, isFirst, isLast }: BlockCardProps) {
  const { removeBlock, duplicateBlock, updateBlock, moveBlockUp, moveBlockDown } =
    useAerobicBuilder();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-b border-gray-100">
        {/* Collapse toggle */}
        <button
          type="button"
          aria-label={collapsed ? 'Expandir bloco' : 'Recolher bloco'}
          onClick={() => setCollapsed((v) => !v)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <motion.div animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronRight size={16} />
          </motion.div>
        </button>

        {/* Name */}
        <input
          type="text"
          aria-label="Nome do bloco"
          value={block.name}
          onChange={(e) => updateBlock(block.id, { name: e.target.value })}
          className="flex-1 bg-transparent text-sm font-semibold text-gray-800 focus:outline-none min-w-0"
        />

        {/* Repetitions */}
        <div className="flex items-center gap-1 mr-1">
          <Repeat size={12} className="text-gray-400" />
          <input
            type="number"
            aria-label="Repetições do bloco"
            min={1}
            max={99}
            value={block.repetitions}
            onChange={(e) => updateBlock(block.id, { repetitions: Math.max(1, Number(e.target.value) || 1) })}
            className="w-10 text-center text-xs font-semibold bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-yellow-400"
          />
          <span className="text-xs text-gray-400">x</span>
        </div>

        {/* Move up/down */}
        <button
          type="button"
          aria-label="Mover bloco para cima"
          disabled={isFirst}
          onClick={() => moveBlockUp(block.id)}
          className="p-1 rounded text-gray-300 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          aria-label="Mover bloco para baixo"
          disabled={isLast}
          onClick={() => moveBlockDown(block.id)}
          className="p-1 rounded text-gray-300 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronDown size={14} />
        </button>

        {/* Duplicate */}
        <button
          type="button"
          aria-label="Duplicar bloco"
          onClick={() => duplicateBlock(block.id)}
          className="p-1 rounded text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
        >
          <Copy size={14} />
        </button>

        {/* Delete */}
        <button
          type="button"
          aria-label="Remover bloco"
          onClick={() => removeBlock(block.id)}
          className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Body */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3">
              <StepList blockId={block.id} steps={block.steps} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
