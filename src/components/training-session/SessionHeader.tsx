import { useState } from 'react';
import { X, List, Maximize2, LayoutList, ChevronDown, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTrainingSession } from './TrainingSessionContext';
import { ProgressBar } from './ProgressBar';
import type { ViewMode } from './TrainingSessionContext';

const VIEW_OPTIONS: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'list', label: 'Lista', icon: <List size={15} /> },
  { mode: 'compact', label: 'Compacto', icon: <LayoutList size={15} /> },
  { mode: 'guided', label: 'Guiado', icon: <Maximize2 size={15} /> },
];

export interface SessionHeaderProps {
  onClose: () => void;
}

/** Sticky header for the training execution page. */
export function SessionHeader({ onClose }: SessionHeaderProps) {
  const { workoutName, viewMode, setViewMode, progress, currentExercise, currentStep } =
    useTrainingSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const stepLabel = currentStep?.isRestStep ? 'Descanso' : (currentExercise?.name ?? '');
  const progressPct = Math.round(progress * 100);

  return (
    <div className="flex-shrink-0 bg-gray-900 border-b border-gray-800">
      {/* Title row */}
      <div className="flex items-center gap-2 px-4 py-3">
        <h1 className="text-white font-bold text-base truncate flex-1">{workoutName}</h1>

        {/* View mode picker */}
        <div className="relative">
          <button
            type="button"
            aria-label="Selecionar modo de visualização"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors text-sm"
          >
            {VIEW_OPTIONS.find((o) => o.mode === viewMode)?.icon}
            <ChevronDown size={12} />
          </button>
          <AnimatePresence>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  className="absolute right-0 top-full mt-1 w-40 bg-gray-800 rounded-xl border border-gray-700 z-20 py-1 overflow-hidden shadow-xl"
                >
                  {VIEW_OPTIONS.map((opt) => (
                    <button
                      key={opt.mode}
                      type="button"
                      onClick={() => { setViewMode(opt.mode); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      {opt.icon}
                      {opt.label}
                      {viewMode === opt.mode && (
                        <Check size={13} className="ml-auto text-yellow-400" />
                      )}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Step + progress */}
      <div className="px-4 pb-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs truncate flex-1">{stepLabel}</span>
          <span className="text-gray-500 text-xs tabular-nums ml-2">{progressPct}%</span>
        </div>
        <ProgressBar progress={progress} />
      </div>
    </div>
  );
}
