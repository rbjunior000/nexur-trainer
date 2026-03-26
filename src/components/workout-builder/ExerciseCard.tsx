import { useState } from 'react';
import {
  GripVertical,
  MoreVertical,
  Link,
  Copy,
  Timer,
  Trash2,
  ChevronDown,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { StrictExercise, ExerciseType } from '../../types/workout';
import { MediaPreview } from '../MediaPreview';
import { ExerciseDetailModal } from '../ExerciseDetailModal';
import { ColorBar } from './ColorBar';
import { ExerciseSummaryRow } from './ExerciseSummaryRow';
import { ExerciseTypeModal } from './ExerciseTypeModal';
import { SetList } from './SetList';
import { useWorkoutBuilder } from './WorkoutBuilderContext';

const TYPE_META: Record<string, { label: string; bg: string; text: string }> = {
  weight_reps: { label: 'Peso e Reps', bg: 'bg-blue-100', text: 'text-blue-700' },
  duration: { label: 'Duração', bg: 'bg-teal-100', text: 'text-teal-700' },
  distance: { label: 'Distância', bg: 'bg-rose-100', text: 'text-rose-700' },
};

export interface ExerciseCardProps {
  exercise: StrictExercise;
  /** Whether this exercise is part of a superset (hides individual color bar). */
  isPartOfSuperset?: boolean;
  /** Whether this is the last exercise in the list (disables "superset with next"). */
  isLast?: boolean;
  /** Lock the exercise type (e.g. for autoplay mode). */
  lockType?: boolean;
  /** Drag handle props from @dnd-kit useSortable. */
  dragHandleProps?: Record<string, unknown>;
}

/**
 * Full exercise editor card.
 * Desktop: expanded form (thumbnail + sets table + notes).
 * Mobile: compact summary row + bottom sheet editor.
 */
export function ExerciseCard({
  exercise,
  isPartOfSuperset = false,
  isLast = false,
  lockType = false,
  dragHandleProps,
}: ExerciseCardProps) {
  const {
    updateExercise,
    removeExercise,
    duplicateExercise,
    toggleSuperset,
    unlinkSuperset,
    addRestAfter,
    bulkMode,
    selectedIds,
    toggleSelected,
  } = useWorkoutBuilder();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [mobileEditOpen, setMobileEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const config = TYPE_META[exercise.type] ?? TYPE_META.weight_reps;
  const canSuperset = !isLast && exercise.type !== 'rest';

  const isSelected = selectedIds.has(exercise.id);

  return (
    <>
      <div className={`flex items-start gap-2 ${bulkMode ? '' : ''}`}>
        {/* Bulk selection checkbox */}
        {bulkMode && (
          <div className="flex-shrink-0 pt-5">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelected(exercise.id)}
              aria-label={`Selecionar ${exercise.name}`}
              className="w-4 h-4 accent-yellow-400 cursor-pointer"
            />
          </div>
        )}
      <div className="flex flex-col gap-4 py-4 rounded-lg bg-white flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-center gap-2">
          {/* ── MOBILE ── compact tap row */}
          <div className="flex items-stretch gap-1.5 flex-1 min-w-0 md:hidden">
            {!isPartOfSuperset && (
              <ColorBar
                color={exercise.cor}
                onChange={(hex) => updateExercise(exercise.id, { cor: hex })}
              />
            )}
            <ExerciseSummaryRow exercise={exercise} onTap={() => setMobileEditOpen(true)} />
          </div>

          {/* ── DESKTOP ── name */}
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="hidden md:block text-sm font-bold text-gray-900 truncate flex-1 text-left hover:text-blue-600 transition-colors"
          >
            {exercise.name}
          </button>

          {/* Mobile actions: grip + menu */}
          <div className="flex md:hidden items-center gap-0.5 flex-shrink-0">
            <button
              type="button"
              {...(bulkMode ? {} : dragHandleProps)}
              className="flex items-center justify-center p-2 text-gray-300 cursor-grab hover:text-gray-500 transition-colors touch-none"
            >
              <GripVertical size={18} />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center justify-center p-2 text-gray-300 hover:text-gray-600"
              >
                <MoreVertical size={18} />
              </button>
              <AnimatePresence>
                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1"
                    >
                      <ExerciseContextMenu
                        isPartOfSuperset={isPartOfSuperset}
                        canSuperset={canSuperset}
                        hasSupersetNext={exercise.supersetWithNext}
                        onUnlink={() => { unlinkSuperset(exercise.id); setIsMenuOpen(false); }}
                        onToggleSuperset={() => { toggleSuperset(exercise.id); setIsMenuOpen(false); }}
                        onDuplicate={() => { duplicateExercise(exercise.id); setIsMenuOpen(false); }}
                        onAddRest={() => { addRestAfter(exercise.id); setIsMenuOpen(false); }}
                        onRemove={() => { removeExercise(exercise.id); setIsMenuOpen(false); }}
                      />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── DESKTOP ── thumbnail + form */}
        <div className="hidden md:flex gap-4">
          <div className="flex gap-1 h-36 flex-shrink-0">
            {!isPartOfSuperset && (
              <ColorBar
                color={exercise.cor}
                onChange={(hex) => updateExercise(exercise.id, { cor: hex })}
              />
            )}
            <button
              type="button"
              onClick={() => setDetailOpen(true)}
              className="w-36 h-36 rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
            >
              <MediaPreview media={exercise.media1} alt={exercise.name} />
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-y-3 min-w-0">
            {/* Type selector + meta */}
            <div className="flex items-center gap-2 flex-wrap">
              {lockType ? (
                <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${config.bg} ${config.text}`}>
                  {config.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsTypeOpen(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold hover:opacity-80 transition-opacity ${config.bg} ${config.text}`}
                >
                  {config.label}
                  <ChevronDown size={12} />
                </button>
              )}
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-500">{exercise.equipment}</span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400">{exercise.sets.length} séries</span>
            </div>

            <SetList exercise={exercise} />

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">
                Observações
              </label>
              <textarea
                value={exercise.notes}
                onChange={(e) => updateExercise(exercise.id, { notes: e.target.value })}
                placeholder="Adicionar notas sobre este exercício..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 resize-none h-16"
              />
            </div>
          </div>

          {/* Desktop action column */}
          <div className="flex flex-col items-center justify-start gap-1 flex-shrink-0 pt-1">
            <button
              type="button"
              {...(bulkMode ? {} : dragHandleProps)}
              className="flex items-center justify-center p-2 text-gray-300 cursor-grab hover:text-gray-500 touch-none"
            >
              <GripVertical size={18} />
            </button>
            <button
              type="button"
              onClick={() => removeExercise(exercise.id)}
              className="flex items-center justify-center p-2 text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center justify-center p-2 text-gray-300 hover:text-gray-600"
              >
                <MoreVertical size={18} />
              </button>
              <AnimatePresence>
                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1"
                    >
                      <ExerciseContextMenu
                        isPartOfSuperset={isPartOfSuperset}
                        canSuperset={canSuperset}
                        hasSupersetNext={exercise.supersetWithNext}
                        onUnlink={() => { unlinkSuperset(exercise.id); setIsMenuOpen(false); }}
                        onToggleSuperset={() => { toggleSuperset(exercise.id); setIsMenuOpen(false); }}
                        onDuplicate={() => { duplicateExercise(exercise.id); setIsMenuOpen(false); }}
                        onAddRest={() => { addRestAfter(exercise.id); setIsMenuOpen(false); }}
                        onRemove={() => { removeExercise(exercise.id); setIsMenuOpen(false); }}
                      />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      </div>{/* end bulk wrapper */}

      {/* ── MOBILE EDIT SHEET ── */}
      <AnimatePresence>
        {mobileEditOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMobileEditOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl md:hidden flex flex-col"
              style={{ maxHeight: '92dvh' }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  {!isPartOfSuperset && (
                    <ColorBar
                      color={exercise.cor}
                      onChange={(hex) => updateExercise(exercise.id, { cor: hex })}
                      placement="below"
                    />
                  )}
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100">
                    <MediaPreview media={exercise.media1} alt={exercise.name} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 truncate">{exercise.name}</p>
                    {exercise.equipment && (
                      <p className="text-xs text-gray-400">{exercise.equipment}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileEditOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-y-4">
                {/* Type selector */}
                <div className="flex items-center gap-2">
                  {lockType ? (
                    <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${config.bg} ${config.text}`}>
                      {config.label}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsTypeOpen(true)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold hover:opacity-80 ${config.bg} ${config.text}`}
                    >
                      {config.label}
                      <ChevronDown size={12} />
                    </button>
                  )}
                </div>

                <SetList exercise={exercise} />

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">
                    Observações
                  </label>
                  <textarea
                    value={exercise.notes}
                    onChange={(e) => updateExercise(exercise.id, { notes: e.target.value })}
                    placeholder="Adicionar notas..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-400 resize-none h-16"
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Type modal */}
      <ExerciseTypeModal
        open={isTypeOpen}
        current={exercise.type}
        onSelect={(t: ExerciseType) => updateExercise(exercise.id, { type: t })}
        onClose={() => setIsTypeOpen(false)}
      />

      {/* Detail modal */}
      {detailOpen && (
        <ExerciseDetailModal
          exercise={exercise}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </>
  );
}

// ─── Context menu items ────────────────────────────────────────────────────────

function ExerciseContextMenu({
  isPartOfSuperset,
  canSuperset,
  hasSupersetNext,
  onUnlink,
  onToggleSuperset,
  onDuplicate,
  onAddRest,
  onRemove,
}: {
  isPartOfSuperset: boolean;
  canSuperset: boolean;
  hasSupersetNext: boolean;
  onUnlink: () => void;
  onToggleSuperset: () => void;
  onDuplicate: () => void;
  onAddRest: () => void;
  onRemove: () => void;
}) {
  return (
    <>
      {isPartOfSuperset && (
        <button
          type="button"
          onClick={onUnlink}
          className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 text-orange-500"
        >
          <Link size={15} />
          Remover superset
        </button>
      )}
      {canSuperset && !hasSupersetNext && (
        <button
          type="button"
          onClick={onToggleSuperset}
          className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-600"
        >
          <Link size={15} className="text-gray-400" />
          Superset com próximo
        </button>
      )}
      <button
        type="button"
        onClick={onDuplicate}
        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-600"
      >
        <Copy size={15} className="text-gray-400" />
        Duplicar exercício
      </button>
      <button
        type="button"
        onClick={onAddRest}
        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-600"
      >
        <Timer size={15} className="text-gray-400" />
        Adicionar descanso
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 text-red-500"
      >
        <Trash2 size={15} />
        Remover exercício
      </button>
    </>
  );
}
