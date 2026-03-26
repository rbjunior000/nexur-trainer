import { useEffect, useRef, useState } from 'react';
import { Play, Plus, Dumbbell, Edit2, Timer, BarChart2, X, Tag, Trash2 } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { StrictExercise, ExerciseType } from '../../types/workout';
import { makeStrictExercise, makeRestExercise } from '../../types/workout';
import type { LibraryExercise } from '../../App';
import { LoadPreviewModal } from '../LoadPreviewModal';
import { FillModal } from './FillModal';
import { WorkoutBuilderProvider, useWorkoutBuilder } from './WorkoutBuilderContext';
import { ExerciseList } from './ExerciseList';

// ─── Metadata (persisted separately from exercises) ───────────────────────────

interface WorkoutMeta {
  name: string;
  startDate: string;
  endDate: string;
  description: string;
}

const DEFAULT_META: WorkoutMeta = {
  name: 'Novo Treino',
  startDate: '',
  endDate: '',
  description: '',
};

// ─── Inner (consumes context) ──────────────────────────────────────────────────

interface InnerProps {
  lockType?: ExerciseType;
  meta: WorkoutMeta;
  onMetaChange: (patch: Partial<WorkoutMeta>) => void;
  onStartTraining?: (exercises: StrictExercise[]) => void;
  onExercisesChange?: (exercises: StrictExercise[]) => void;
  onRegisterAdd?: (fn: (ex: LibraryExercise) => void) => void;
  onSave: (ex: StrictExercise[]) => void;
}

function WorkoutBuilderInner({
  lockType,
  meta,
  onMetaChange,
  onStartTraining,
  onExercisesChange,
  onRegisterAdd,
  onSave,
}: InnerProps) {
  const {
    exercises, addExercise, bulkMode, enterBulkMode, exitBulkMode,
    selectedIds, selectAll, clearSelected, bulkClear, bulkRemove, applyFill,
  } = useWorkoutBuilder();
  const [showSummary, setShowSummary] = useState(false);
  const [showFill, setShowFill] = useState(false);

  const allSelected =
    selectedIds.size > 0 &&
    selectedIds.size === exercises.filter((e) => e.type !== 'rest').length;

  // Sync to parent and storage
  useEffect(() => {
    onExercisesChange?.(exercises);
    onSave(exercises);
  }, [exercises, onExercisesChange, onSave]);

  // Register add-from-library with parent
  const addFromLibrary = useRef((lib: LibraryExercise) => {
    addExercise(makeStrictExercise({
      name: lib.name,
      type: lockType ?? 'weight_reps',
      media1: lib.media1,
      media2: lib.media2,
      orientacoes: lib.orientacoes,
    }));
  });
  useEffect(() => { onRegisterAdd?.(addFromLibrary.current); }, [onRegisterAdd]);

  const hasExercises = exercises.some((e) => e.type !== 'rest');

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">

      {/* ── Workout metadata ── */}
      <div className="space-y-5 mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Editar treino
          </h1>
          <button
            type="button"
            aria-label="Excluir treino"
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Nome do treino
          </label>
          <input
            type="text"
            value={meta.name}
            onChange={(e) => onMetaChange({ name: e.target.value })}
            className="w-full text-lg text-gray-900 border-b border-gray-200 py-2 focus:outline-none focus:border-yellow-400 transition-colors bg-transparent"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Início
            </label>
            <input
              type="date"
              value={meta.startDate}
              onChange={(e) => onMetaChange({ startDate: e.target.value })}
              className="w-full text-base text-gray-900 border-b border-gray-200 py-2 focus:outline-none focus:border-yellow-400 transition-colors bg-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Fim
            </label>
            <input
              type="date"
              value={meta.endDate}
              onChange={(e) => onMetaChange({ endDate: e.target.value })}
              className="w-full text-base text-gray-900 border-b border-gray-200 py-2 focus:outline-none focus:border-yellow-400 transition-colors bg-transparent"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Descrição
          </label>
          <textarea
            value={meta.description}
            onChange={(e) => onMetaChange({ description: e.target.value })}
            placeholder="Deixe aqui observações sobre este treino"
            className="w-full text-base text-gray-900 border-b border-gray-200 py-2 focus:outline-none focus:border-yellow-400 transition-colors bg-transparent resize-none min-h-[60px]"
          />
        </div>

        {/* Tags (UI placeholder) */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-3">
            Etiquetas
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <Plus size={14} />
              Atribuir
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <Tag size={14} />
              Etiquetas
            </button>
          </div>
        </div>
      </div>

      {/* ── Exercise section ── */}
      <div>
        {/* Toolbar */}
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Exercícios</h2>

          <div className="flex gap-3">
            {bulkMode ? (
              <>
                <button
                  type="button"
                  onClick={exitBulkMode}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <X size={16} />
                  Cancelar ({selectedIds.size})
                </button>
                <button
                  type="button"
                  disabled={!hasExercises}
                  onClick={() => onStartTraining?.(exercises)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-40"
                >
                  <Dumbbell size={16} />
                  Treinar
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => addExercise(makeRestExercise())}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <Timer size={16} />
                  Descanso
                </button>
                <button
                  type="button"
                  disabled={!hasExercises}
                  onClick={() => setShowSummary(true)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-40"
                >
                  <BarChart2 size={16} />
                  Resumo
                </button>
                <button
                  type="button"
                  onClick={enterBulkMode}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <Edit2 size={16} />
                  Editar
                </button>
                <button
                  type="button"
                  disabled={!hasExercises}
                  onClick={() => onStartTraining?.(exercises)}
                  className="flex items-center gap-2 text-sm text-yellow-600 hover:text-yellow-700 font-medium transition-colors disabled:opacity-40"
                >
                  <Play size={16} />
                  Treinar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bulk action row */}
        {bulkMode && (
          <div className="flex items-center gap-5 mb-4 pb-3 border-b border-gray-100">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => allSelected ? clearSelected() : selectAll()}
              className="w-4 h-4 accent-yellow-400 cursor-pointer flex-shrink-0"
            />
            <button
              type="button"
              onClick={() => { if (selectedIds.size > 0) setShowFill(true); }}
              disabled={selectedIds.size === 0}
              className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Preencher
            </button>
            <button
              type="button"
              onClick={() => { if (selectedIds.size > 0) bulkClear(); }}
              disabled={selectedIds.size === 0}
              className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => { if (selectedIds.size > 0) bulkRemove(); }}
              disabled={selectedIds.size === 0}
              className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Remover
            </button>
          </div>
        )}

        {/* Empty state */}
        {exercises.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Dumbbell size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">
              Nenhum exercício ainda.<br />
              Busque na biblioteca ao lado ou adicione manualmente.
            </p>
          </div>
        )}

        {/* Exercise list */}
        <ExerciseList lockType={lockType !== undefined} />

        {/* Add exercise */}
        <button
          type="button"
          onClick={() => addExercise(makeStrictExercise({
            name: 'Novo exercício',
            type: lockType ?? 'weight_reps',
          }))}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-400 hover:border-yellow-400 hover:text-yellow-500 hover:bg-yellow-50 transition-colors"
        >
          <Plus size={16} />
          Adicionar Exercício
        </button>
      </div>

      {/* Summary modal */}
      {showSummary && (
        <LoadPreviewModal
          exercises={exercises}
          onClose={() => setShowSummary(false)}
        />
      )}

      {/* Fill modal */}
      <FillModal
        open={showFill}
        onApply={(form) => { applyFill(form); setShowFill(false); }}
        onClose={() => setShowFill(false)}
      />
    </div>
  );
}

// ─── Page (owns Provider + localStorage) ──────────────────────────────────────

export interface WorkoutBuilderPageProps {
  /** Storage key for exercises (different for strict vs autoplay). */
  storageKey?: string;
  /** If set, locks all exercises to this type (e.g. 'duration' for autoplay). */
  lockType?: ExerciseType;
  onStartTraining?: (exercises: StrictExercise[]) => void;
  onExercisesChange?: (exercises: StrictExercise[]) => void;
  onRegisterAdd?: (fn: (ex: LibraryExercise) => void) => void;
}

export function WorkoutBuilderPage({
  storageKey = 'nexur-strict-exercises',
  lockType,
  onStartTraining,
  onExercisesChange,
  onRegisterAdd,
}: WorkoutBuilderPageProps) {
  const metaKey = `${storageKey}-meta`;
  const [savedExercises, setSavedExercises] = useLocalStorage<StrictExercise[]>(storageKey, []);
  const [meta, setMeta] = useLocalStorage<WorkoutMeta>(metaKey, DEFAULT_META);

  return (
    <WorkoutBuilderProvider initialExercises={savedExercises}>
      <WorkoutBuilderInner
        lockType={lockType}
        meta={meta}
        onMetaChange={(patch) => setMeta((prev) => ({ ...prev, ...patch }))}
        onStartTraining={onStartTraining}
        onExercisesChange={onExercisesChange}
        onRegisterAdd={onRegisterAdd}
        onSave={setSavedExercises}
      />
    </WorkoutBuilderProvider>
  );
}
