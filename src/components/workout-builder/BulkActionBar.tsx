import { Trash2, Pencil, X, CheckSquare, Square } from 'lucide-react';
import { useWorkoutBuilder } from './WorkoutBuilderContext';

export interface BulkActionBarProps {
  /** Called to open the fill modal */
  onFill: () => void;
}

/**
 * Sticky bar that appears when bulk selection mode is active.
 * Provides select-all, fill, and remove actions.
 */
export function BulkActionBar({ onFill }: BulkActionBarProps) {
  const { exercises, selectedIds, selectAll, clearSelected, bulkRemove, exitBulkMode } =
    useWorkoutBuilder();

  const selectableCount = exercises.filter((e) => e.type !== 'rest').length;
  const allSelected = selectedIds.size === selectableCount && selectableCount > 0;

  return (
    <div className="sticky bottom-4 mx-2 z-20">
      <div className="bg-gray-900 rounded-2xl shadow-xl border border-gray-800 px-4 py-3 flex items-center gap-3">
        {/* Select all / clear */}
        <button
          type="button"
          onClick={allSelected ? clearSelected : () => selectAll()}
          className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
        >
          {allSelected ? <CheckSquare size={16} className="text-yellow-400" /> : <Square size={16} />}
          <span className="tabular-nums">{selectedIds.size}</span>
        </button>

        <div className="flex-1" />

        {/* Fill */}
        <button
          type="button"
          onClick={onFill}
          disabled={selectedIds.size === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-yellow-400 text-gray-900 hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Pencil size={14} />
          Preencher
        </button>

        {/* Remove */}
        <button
          type="button"
          onClick={bulkRemove}
          disabled={selectedIds.size === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 size={14} />
          Remover
        </button>

        {/* Exit bulk mode */}
        <button
          type="button"
          onClick={exitBulkMode}
          className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
          title="Sair do modo seleção"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
