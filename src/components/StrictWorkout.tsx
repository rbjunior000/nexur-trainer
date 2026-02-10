import { useState, useEffect, useCallback } from 'react';
import {
  Trash2,
  Plus,
  Clock,
  ChevronDown,
  Check,
  Copy,
  GripVertical,
  Link,
  Dumbbell,
  ArrowRight,
} from 'lucide-react';
import {
  StrictExercise,
  ExerciseType,
  StrictSet,
} from '../types/workout';
import { motion, AnimatePresence } from 'framer-motion';
import type { LibraryExercise } from '../App';

// --- Configuration ---
type ColumnConfig = {
  key: keyof StrictSet;
  label: string;
  type: 'number' | 'text';
  placeholder: string;
  suffix?: string;
};
type ExerciseTypeConfig = {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  columns: ColumnConfig[];
};
const TYPE_CONFIG: Record<ExerciseType, ExerciseTypeConfig> = {
  weight_reps: {
    label: 'Peso e Reps',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    columns: [
      { key: 'weight', label: 'Peso', type: 'number', placeholder: '0', suffix: 'kg' },
      { key: 'reps', label: 'Reps', type: 'number', placeholder: '0' },
    ],
  },
  reps_only: {
    label: 'Apenas Reps',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    columns: [{ key: 'reps', label: 'Reps', type: 'number', placeholder: '0' }],
  },
  weighted_bodyweight: {
    label: 'Corporal + Carga',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    columns: [
      { key: 'weight', label: '+Kg', type: 'number', placeholder: '0', suffix: 'kg' },
      { key: 'reps', label: 'Reps', type: 'number', placeholder: '0' },
    ],
  },
  assisted_bodyweight: {
    label: 'Corporal Assistido',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    columns: [
      { key: 'weight', label: '-Kg', type: 'number', placeholder: '0', suffix: 'kg' },
      { key: 'reps', label: 'Reps', type: 'number', placeholder: '0' },
    ],
  },
  duration: {
    label: 'Duração',
    color: 'teal',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-700',
    columns: [{ key: 'duration', label: 'Duração', type: 'text', placeholder: '00:00' }],
  },
  weight_duration: {
    label: 'Peso e Duração',
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-700',
    columns: [
      { key: 'weight', label: 'Peso', type: 'number', placeholder: '0', suffix: 'kg' },
      { key: 'duration', label: 'Duração', type: 'text', placeholder: '00:00' },
    ],
  },
  distance_duration: {
    label: 'Distância e Duração',
    color: 'rose',
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-700',
    columns: [
      { key: 'distance', label: 'Distância', type: 'number', placeholder: '0', suffix: 'km' },
      { key: 'duration', label: 'Duração', type: 'text', placeholder: '00:00' },
    ],
  },
  weight_distance: {
    label: 'Peso e Distância',
    color: 'amber',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    columns: [
      { key: 'weight', label: 'Peso', type: 'number', placeholder: '0', suffix: 'kg' },
      { key: 'distance', label: 'Distância', type: 'number', placeholder: '0', suffix: 'km' },
    ],
  },
};
const REST_OPTIONS = ['OFF', '30s', '60s', '90s', '2min', '3min', 'Custom'];

// --- Helpers ---
let _idCounter = 100;
function uid() {
  return String(++_idCounter);
}

function makeExerciseFromLibrary(ex: LibraryExercise): StrictExercise {
  return {
    id: uid(),
    name: ex.name,
    thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
    category: ex.category,
    equipment: ex.equipment,
    type: 'weight_reps',
    restTime: '60s',
    notes: '',
    supersetWithNext: false,
    sets: [
      { id: uid(), reps: 12, weight: 0 },
      { id: uid(), reps: 10, weight: 0 },
      { id: uid(), reps: 8, weight: 0 },
    ],
  };
}

function cloneExercise(ex: StrictExercise): StrictExercise {
  return {
    ...ex,
    id: uid(),
    name: ex.name + ' (cópia)',
    supersetWithNext: false,
    sets: ex.sets.map((s) => ({ ...s, id: uid() })),
  };
}

// --- Confirm dialog ---
function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 w-80 shadow-2xl"
      >
        <p className="text-sm text-gray-700 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
          >
            Remover
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Superset connector ---
function SupersetConnector() {
  return (
    <div className="relative pl-5 -my-px z-10">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400 rounded-full" />
      <div className="absolute left-[-3px] top-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full bg-yellow-400" />
    </div>
  );
}

// --- Helper: is exercise part of a superset group? ---
function isInSuperset(exercises: StrictExercise[], index: number): boolean {
  if (exercises[index].supersetWithNext) return true;
  if (index > 0 && exercises[index - 1].supersetWithNext) return true;
  return false;
}

// --- Empty State ---
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
        <Dumbbell size={28} className="text-gray-300" />
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-2">
        Nenhum exercício adicionado
      </h3>
      <p className="text-sm text-gray-400 max-w-xs mb-6">
        Selecione exercícios na biblioteca ao lado para montar seu treino
      </p>
      <div className="flex items-center gap-2 text-xs text-gray-300">
        <span>Biblioteca</span>
        <ArrowRight size={14} />
      </div>
    </div>
  );
}

// --- Components ---
export function StrictWorkout({
  onRegisterAdd,
}: {
  onRegisterAdd?: (fn: (ex: LibraryExercise) => void) => void;
}) {
  const [exercises, setExercises] = useState<StrictExercise[]>([]);
  const [confirmAction, setConfirmAction] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const addFromLibrary = useCallback((ex: LibraryExercise) => {
    setExercises((prev) => [...prev, makeExerciseFromLibrary(ex)]);
  }, []);

  useEffect(() => {
    onRegisterAdd?.(addFromLibrary);
  }, [onRegisterAdd, addFromLibrary]);

  const updateExercise = (id: string, updates: Partial<StrictExercise>) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, ...updates } : ex))
    );
  };

  const removeExercise = (index: number) => {
    setExercises((prev) => {
      const next = [...prev];
      if (index > 0 && next[index - 1].supersetWithNext && !next[index].supersetWithNext) {
        next[index - 1] = { ...next[index - 1], supersetWithNext: false };
      }
      next.splice(index, 1);
      return next;
    });
  };

  const duplicateExercise = (index: number) => {
    setExercises((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, cloneExercise(prev[index]));
      return next;
    });
  };

  if (exercises.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="pb-12">
      <AnimatePresence mode="popLayout">
        {exercises.map((exercise, index) => {
          const linked = isInSuperset(exercises, index);
          const prevLinked = index > 0 && exercises[index - 1].supersetWithNext;
          const isFirst = !prevLinked;

          return (
            <motion.div
              key={exercise.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className={isFirst && index > 0 ? 'mt-4' : ''}
            >
              {/* Superset connector */}
              {prevLinked && <SupersetConnector />}

              {/* Superset badge above first card of group */}
              {exercise.supersetWithNext && isFirst && (
                <div className={`mb-2 ${linked ? 'pl-5' : ''}`}>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-400 text-gray-900 rounded-lg text-[11px] font-bold">
                    <div className="flex items-center gap-4 ">
                    <Link size={11} />
                    Superset
                    </div>
                  </span>
                </div>
              )}

              <div className={`relative ${linked ? 'pl-5' : ''}`}>
                {/* Lateral bar */}
                {linked && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400 rounded-full" />
                )}

                <ExerciseCard
                  exercise={exercise}
                  onUpdate={(updates) => updateExercise(exercise.id, updates)}
                  onRemove={() =>
                    setConfirmAction({
                      message: `Remover "${exercise.name}" do treino?`,
                      onConfirm: () => {
                        removeExercise(index);
                        setConfirmAction(null);
                      },
                    })
                  }
                  onDuplicate={() => duplicateExercise(index)}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* JSON Preview */}
      {exercises.length > 0 && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            JSON do treino
          </h3>
          <pre className="bg-gray-950 text-gray-300 text-xs rounded-xl p-4 overflow-x-auto max-h-96 overflow-y-auto">
            <code>{JSON.stringify(exercises, null, 2)}</code>
          </pre>
        </div>
      )}

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirmAction && (
          <ConfirmDialog
            message={confirmAction.message}
            onConfirm={confirmAction.onConfirm}
            onCancel={() => setConfirmAction(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Rest Selector ---
function RestSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 py-2 overflow-x-auto hide-scrollbar">
      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase whitespace-nowrap">
        <Clock size={14} />
        Descanso
      </div>
      <div className="flex items-center gap-2">
        {REST_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
              value === opt
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Exercise Card ---
function ExerciseCard({
  exercise,
  onUpdate,
  onRemove,
  onDuplicate,
}: {
  exercise: StrictExercise;
  onUpdate: (updates: Partial<StrictExercise>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const config = TYPE_CONFIG[exercise.type];
  const [isTypeOpen, setIsTypeOpen] = useState(false);

  const handleTypeChange = (newType: ExerciseType) => {
    onUpdate({ type: newType, sets: [] });
    setIsTypeOpen(false);
  };

  const addSet = () => {
    onUpdate({ sets: [...exercise.sets, { id: uid() }] });
  };

  const removeSet = (setId: string) => {
    onUpdate({ sets: exercise.sets.filter((s) => s.id !== setId) });
  };

  const updateSet = (setId: string, field: keyof StrictSet, value: any) => {
    onUpdate({
      sets: exercise.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
    });
  };

  const duplicateSet = (setId: string) => {
    const idx = exercise.sets.findIndex((s) => s.id === setId);
    if (idx < 0) return;
    const clone = { ...exercise.sets[idx], id: uid() };
    const newSets = [...exercise.sets];
    newSets.splice(idx + 1, 0, clone);
    onUpdate({ sets: newSets });
  };

  return (
    <div className="flex flex-col gap-4 py-4 rounded-lg bg-white">
      {/* Title row – with inline thumbnail on mobile */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 md:hidden">
          <img src={exercise.thumbnail} alt={exercise.name} className="w-full h-full object-cover" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 truncate">{exercise.name}</h3>
      </div>

      {/* Content: form only on mobile, thumbnail + form on md+ */}
      <div className="flex gap-4">
        {/* Thumbnail – desktop only */}
        <div className="hidden md:block w-36 h-36 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          <img src={exercise.thumbnail} alt={exercise.name} className="w-full h-full object-cover" />
        </div>

        {/* Form fields */}
        <div className="flex-1 flex flex-col gap-y-3 min-w-0">
          {/* Type Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <button
                onClick={() => setIsTypeOpen(!isTypeOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${config.bgColor} ${config.textColor} hover:opacity-80`}
              >
                {config.label}
                <ChevronDown size={12} />
              </button>

              <AnimatePresence>
                {isTypeOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsTypeOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1 overflow-hidden"
                    >
                      {(Object.keys(TYPE_CONFIG) as ExerciseType[]).map((type) => {
                        const typeConfig = TYPE_CONFIG[type];
                        const isSelected = exercise.type === type;
                        return (
                          <button
                            key={type}
                            onClick={() => handleTypeChange(type)}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between transition-colors ${
                              isSelected ? 'bg-gray-50 font-medium text-gray-900' : 'text-gray-600'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${typeConfig.bgColor}`} />
                              {typeConfig.label}
                            </span>
                            {isSelected && <Check size={14} className="text-yellow-500" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-500">{exercise.equipment}</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">{exercise.sets.length} séries</span>
          </div>

          {/* Sets Table */}
          <div>
            <div
              className="grid gap-2 mb-1.5 px-2"
              style={{
                gridTemplateColumns:
                  config.columns.length === 1 ? '36px 1fr 60px' : '36px 1fr 1fr 60px',
              }}
            >
              <div className="text-[10px] font-bold text-gray-400 uppercase text-center self-center">
                Série
              </div>
              {config.columns.map((col) => (
                <div key={col.key} className="text-[10px] font-bold text-gray-400 uppercase text-center self-center">
                  {col.label}
                </div>
              ))}
              <div />
            </div>

            <div className="space-y-1">
              <AnimatePresence mode="popLayout">
                {exercise.sets.map((set, setIndex) => (
                  <motion.div
                    key={set.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10, height: 0 }}
                    className="grid gap-2 items-center bg-gray-50 p-2 rounded-lg group hover:bg-gray-100 transition-colors"
                    style={{
                      gridTemplateColumns:
                        config.columns.length === 1 ? '36px 1fr 60px' : '36px 1fr 1fr 60px',
                    }}
                  >
                    <div className="text-sm font-bold text-gray-400 text-center">{setIndex + 1}</div>

                    {config.columns.map((col) => (
                      <div key={col.key} className="relative">
                        <input
                          type={col.type}
                          value={(set[col.key] as string | number) || ''}
                          onChange={(e) => updateSet(set.id, col.key, e.target.value)}
                          placeholder={col.placeholder}
                          className="w-full text-center bg-white border border-gray-200 rounded-md py-1.5 text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
                        />
                        {col.suffix && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                            {col.suffix}
                          </span>
                        )}
                      </div>
                    ))}

                    <div className="flex items-center justify-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => duplicateSet(set.id)}
                        className="p-1 text-gray-300 hover:text-blue-500 transition-colors"
                        title="Duplicar série"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        onClick={() => removeSet(set.id)}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                        title="Remover série"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <button
              onClick={addSet}
              className="mt-2.5 w-full py-1.5 flex items-center justify-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 border-dashed"
            >
              <Plus size={16} />
              Adicionar série
            </button>
          </div>

          {/* Rest Selector */}
          <RestSelector
            value={exercise.restTime}
            onChange={(val) => onUpdate({ restTime: val })}
          />

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">
              Observações
            </label>
            <textarea
              value={exercise.notes}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Adicionar notas sobre este exercício..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all resize-none h-16"
            />
          </div>
        </div>

        {/* Action buttons – vertical on md+, hidden on mobile (shown below) */}
        <div className="hidden md:grid grid-rows-3 items-center justify-center flex-shrink-0">
          <button
            className="flex items-center justify-center p-2 text-gray-300 cursor-grab hover:text-gray-500 transition-colors"
          >
            <GripVertical size={18} />
          </button>
          <button
            onClick={onRemove}
            className="flex items-center justify-center p-2 text-gray-300 hover:text-red-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={onDuplicate}
            className="flex items-center justify-center p-2 text-gray-300 hover:text-blue-500 transition-colors"
          >
            <Copy size={18} />
          </button>
        </div>
      </div>

      {/* Mobile action buttons – horizontal row */}
      <div className="flex md:hidden items-center justify-end gap-1 pt-1 border-t border-gray-100">
        <button
          className="flex items-center justify-center p-2 text-gray-300 cursor-grab hover:text-gray-500 transition-colors"
        >
          <GripVertical size={18} />
        </button>
        <button
          onClick={onDuplicate}
          className="flex items-center justify-center p-2 text-gray-300 hover:text-blue-500 transition-colors"
        >
          <Copy size={18} />
        </button>
        <button
          onClick={onRemove}
          className="flex items-center justify-center p-2 text-gray-300 hover:text-red-500 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
