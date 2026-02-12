import { useState, useEffect, useCallback, useMemo } from 'react';
import IMask from 'imask';
import { IMaskInput } from 'react-imask';
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
  MoreVertical,
  Timer,
} from 'lucide-react';
import {
  StrictExercise,
  ExerciseType,
  StrictSet,
  makeRestExercise,
} from '../types/workout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
const TYPE_CONFIG: Record<string, ExerciseTypeConfig & { hasReps?: boolean }> = {
  weight_reps: {
    label: 'Peso e Reps',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    hasReps: true,
    columns: [
      { key: 'weight', label: 'Peso', type: 'number', placeholder: '0', suffix: 'kg' },
    ],
  },
  duration: {
    label: 'Duração',
    color: 'teal',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-700',
    columns: [{ key: 'duration', label: 'Duração', type: 'text', placeholder: '00:00:00' }],
  },
  distance: {
    label: 'Distância',
    color: 'rose',
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-700',
    columns: [{ key: 'distance', label: 'Distância', type: 'number', placeholder: '0', suffix: 'km' }],
  },
};
const REST_PRESETS: { label: string; value: number }[] = [
  { label: 'OFF', value: 0 },
  { label: '10s', value: 10 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '2min', value: 120 },
  { label: '3min', value: 180 },
];
const REST_PRESET_VALUES = new Set(REST_PRESETS.map((p) => p.value));

// --- Helpers ---
let _idCounter = 100;
function uid() {
  return String(++_idCounter);
}

function DurationInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (masked: string) => void;
  placeholder?: string;
  className: string;
}) {
  return (
    <IMaskInput
      mask="HH:MM:SS"
      blocks={{
        HH: { mask: IMask.MaskedRange, from: 0, to: 23, maxLength: 2, placeholderChar: '0' },
        MM: { mask: IMask.MaskedRange, from: 0, to: 59, maxLength: 2, placeholderChar: '0' },
        SS: { mask: IMask.MaskedRange, from: 0, to: 59, maxLength: 2, placeholderChar: '0' },
      }}
      lazy={false}
      overwrite
      value={value || '00:00:00'}
      onAccept={(val: string) => onChange(val)}
      placeholder="00:00:00"
      inputMode="numeric"
      className={className}
    />
  );
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
  if (exercises[index].type === 'rest') return false;
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
  onRegisterAddRest,
  onExercisesChange,
  defaultExerciseType = 'weight_reps',
}: {
  onRegisterAdd?: (fn: (ex: LibraryExercise) => void) => void;
  onRegisterAddRest?: (fn: () => void) => void;
  onExercisesChange?: (exercises: StrictExercise[]) => void;
  defaultExerciseType?: ExerciseType;
}) {
  const [exercises, setExercises] = useState<StrictExercise[]>([]);
  const [confirmAction, setConfirmAction] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const addFromLibrary = useCallback((ex: LibraryExercise) => {
    const isDuration = defaultExerciseType === 'duration';
    const newExercise: StrictExercise = {
      id: uid(),
      name: ex.name,
      thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
      category: ex.category,
      equipment: ex.equipment,
      type: defaultExerciseType,
      repsMode: 'fixed',
      notes: '',
      supersetWithNext: false,
      sets: isDuration
        ? [
            { id: uid(), duration: '00:00:30', rest: 60 },
            { id: uid(), duration: '00:00:30', rest: 60 },
            { id: uid(), duration: '00:00:30', rest: 60 },
          ]
        : [
            { id: uid(), reps: 12, weight: 0, rest: 60 },
            { id: uid(), reps: 10, weight: 0, rest: 60 },
            { id: uid(), reps: 8, weight: 0, rest: 60 },
          ],
    };
    setExercises((prev) => [...prev, newExercise]);
  }, [defaultExerciseType]);

  const addRestAtEnd = useCallback(() => {
    setExercises((prev) => [...prev, makeRestExercise()]);
  }, []);

  const insertRestAt = useCallback((index: number) => {
    setExercises((prev) => {
      const next = [...prev];
      // If inserting between superset-linked exercises, break the chain
      if (index > 0 && next[index - 1].supersetWithNext) {
        next[index - 1] = { ...next[index - 1], supersetWithNext: false };
      }
      next.splice(index, 0, makeRestExercise());
      return next;
    });
  }, []);

  useEffect(() => {
    onRegisterAdd?.(addFromLibrary);
  }, [onRegisterAdd, addFromLibrary]);

  useEffect(() => {
    onRegisterAddRest?.(addRestAtEnd);
  }, [onRegisterAddRest, addRestAtEnd]);

  useEffect(() => {
    onExercisesChange?.(exercises);
  }, [exercises, onExercisesChange]);

  const updateExercise = (id: string, updates: Partial<StrictExercise>) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, ...updates } : ex))
    );
  };

  const removeExercise = (index: number) => {
    setExercises((prev) => {
      const next = [...prev];
      // Se o anterior apontava pra este e este era o tail do grupo, deslinkar o anterior
      if (index > 0 && next[index - 1].supersetWithNext) {
        // Se o removido NÃO tinha supersetWithNext, o anterior perde o link
        // Se o removido TINHA supersetWithNext, o anterior agora aponta pro próximo (chain se mantém)
        if (!next[index].supersetWithNext) {
          next[index - 1] = { ...next[index - 1], supersetWithNext: false };
        }
      }
      next.splice(index, 1);
      // Garantir que o último exercício nunca tenha supersetWithNext=true
      if (next.length > 0 && next[next.length - 1].supersetWithNext) {
        next[next.length - 1] = { ...next[next.length - 1], supersetWithNext: false };
      }
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

  const isLast = (index: number) => index === exercises.length - 1;

  // --- Drag & Drop ---
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const exerciseIds = useMemo(() => exercises.map((e) => e.id), [exercises]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setExercises((prev) => {
      const oldIdx = prev.findIndex((e) => e.id === active.id);
      const newIdx = prev.findIndex((e) => e.id === over.id);
      if (oldIdx < 0 || newIdx < 0) return prev;

      // Break superset chains affected by this move
      const next = [...prev];

      // If the dragged item was part of a superset, break outgoing/incoming links
      if (next[oldIdx].supersetWithNext) {
        next[oldIdx] = { ...next[oldIdx], supersetWithNext: false };
      }
      if (oldIdx > 0 && next[oldIdx - 1].supersetWithNext) {
        // Previous item pointed to this one — if this item also pointed forward,
        // the previous can now point to the item that was below. Otherwise break.
        next[oldIdx - 1] = { ...next[oldIdx - 1], supersetWithNext: false };
      }

      const reordered = arrayMove(next, oldIdx, newIdx);

      // Fix: last item can't have supersetWithNext
      if (reordered.length > 0 && reordered[reordered.length - 1].supersetWithNext) {
        reordered[reordered.length - 1] = { ...reordered[reordered.length - 1], supersetWithNext: false };
      }
      // Fix: rest items can't have supersetWithNext
      reordered.forEach((ex, i) => {
        if (ex.type === 'rest' && ex.supersetWithNext) {
          reordered[i] = { ...ex, supersetWithNext: false };
        }
        // If item has supersetWithNext and next is rest, break
        if (ex.supersetWithNext && i < reordered.length - 1 && reordered[i + 1].type === 'rest') {
          reordered[i] = { ...reordered[i], supersetWithNext: false };
        }
      });

      return reordered;
    });
  }, []);

  const activeExercise = activeId ? exercises.find((e) => e.id === activeId) : null;

  if (exercises.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="pb-12">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={exerciseIds} strategy={verticalListSortingStrategy}>
          {exercises.map((exercise, index) => {
            const linked = isInSuperset(exercises, index);
            const prevLinked = index > 0 && exercises[index - 1].supersetWithNext;
            const isFirst = !prevLinked;
            const isRest = exercise.type === 'rest';

            const nextExercise = index < exercises.length - 1 ? exercises[index + 1] : null;
            const canSuperset = !isRest && !isLast(index) && nextExercise?.type !== 'rest';

            return (
              <SortableExerciseItem key={exercise.id} id={exercise.id}>
                {(handleProps) => (
                  <>
                    {/* Inline +Descanso button between exercises */}
                    {index > 0 && !prevLinked && !isRest && exercises[index - 1].type !== 'rest' && (
                      <div className="flex justify-center py-1 group">
                        <button
                          onClick={() => insertRestAt(index)}
                          className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium text-gray-400 bg-gray-50 hover:bg-yellow-50 hover:text-yellow-600 rounded-full border border-dashed border-gray-200 hover:border-yellow-300 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Timer size={12} />
                          Descanso
                        </button>
                      </div>
                    )}

                    {isFirst && index > 0 && !isRest && (
                      <div className="mt-4" />
                    )}

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
                      {linked && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400 rounded-full" />
                      )}

                      {isRest ? (
                        <RestCard
                          exercise={exercise}
                          onUpdate={(updates) => updateExercise(exercise.id, updates)}
                          onRemove={() => removeExercise(index)}
                          dragHandleProps={handleProps}
                        />
                      ) : (
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
                          onToggleSuperset={() => {
                            if (!canSuperset) return;
                            updateExercise(exercise.id, { supersetWithNext: true });
                          }}
                          onUnlinkSuperset={() => {
                            setExercises((prev) => {
                              const next = [...prev];
                              if (next[index].supersetWithNext) {
                                next[index] = { ...next[index], supersetWithNext: false };
                              }
                              if (index > 0 && next[index - 1].supersetWithNext) {
                                next[index - 1] = { ...next[index - 1], supersetWithNext: false };
                              }
                              return next;
                            });
                          }}
                          isLast={isLast(index)}
                          canSuperset={canSuperset}
                          isPartOfSuperset={linked}
                          lockType={defaultExerciseType !== 'weight_reps'}
                          dragHandleProps={handleProps}
                        />
                      )}
                    </div>
                  </>
                )}
              </SortableExerciseItem>
            );
          })}
        </SortableContext>

        <DragOverlay>
          {activeExercise && (
            <div className="opacity-80 shadow-2xl rounded-xl">
              {activeExercise.type === 'rest' ? (
                <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-gray-50 border border-gray-200">
                  <GripVertical size={16} className="text-gray-300" />
                  <Timer size={16} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-600">Descanso</span>
                  <span className="text-xs text-gray-400 ml-2">{activeExercise.restDuration ?? 60}s</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-4 px-4 rounded-xl bg-white border border-gray-200">
                  <GripVertical size={18} className="text-gray-300" />
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={activeExercise.thumbnail} alt={activeExercise.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm font-bold text-gray-900">{activeExercise.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{activeExercise.sets.length} séries</span>
                </div>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>

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

// --- Sortable wrapper ---
function SortableExerciseItem({
  id,
  children,
}: {
  id: string;
  children: (handleProps: Record<string, any>) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children(listeners ?? {})}
    </div>
  );
}

// --- Rest Card ---
function formatRestLabel(seconds: number): string {
  if (seconds === 0) return 'OFF';
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60}min`;
  return `${seconds}s`;
}

function RestCard({
  exercise,
  onUpdate,
  onRemove,
  dragHandleProps,
}: {
  exercise: StrictExercise;
  onUpdate: (updates: Partial<StrictExercise>) => void;
  onRemove: () => void;
  dragHandleProps?: Record<string, any>;
}) {
  const value = exercise.restDuration ?? 60;
  const isPreset = REST_PRESET_VALUES.has(value);
  const [editingCustom, setEditingCustom] = useState(!isPreset);

  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-gray-50 border border-gray-200 my-1">
      <div className="flex items-center gap-2 flex-shrink-0">
        <Timer size={16} className="text-gray-400" />
        <span className="text-sm font-bold text-gray-600">Descanso</span>
      </div>
      <div className="flex items-center gap-1.5 flex-1 overflow-x-auto hide-scrollbar">
        {REST_PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => { onUpdate({ restDuration: p.value }); setEditingCustom(false); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              !editingCustom && value === p.value
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
        {editingCustom ? (
          <div className="relative flex-shrink-0">
            <input
              autoFocus
              type="number"
              min={0}
              value={value || ''}
              onChange={(e) => onUpdate({ restDuration: Number(e.target.value) || 0 })}
              onBlur={() => { if (!value) { onUpdate({ restDuration: 0 }); setEditingCustom(false); } }}
              placeholder="45"
              className="w-20 px-2 py-1 pr-7 rounded-lg text-xs font-medium border border-yellow-400 text-gray-900 text-center focus:outline-none focus:ring-1 focus:ring-yellow-400"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">seg</span>
          </div>
        ) : (
          <button
            onClick={() => setEditingCustom(true)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              !isPreset
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {!isPreset ? formatRestLabel(value) : 'Outro'}
          </button>
        )}
      </div>
      <button
        onClick={onRemove}
        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
        title="Remover descanso"
      >
        <Trash2 size={14} />
      </button>
      <button
        {...dragHandleProps}
        className="flex items-center justify-center p-1 text-gray-300 cursor-grab hover:text-gray-500 transition-colors flex-shrink-0 touch-none"
      >
        <GripVertical size={16} />
      </button>
    </div>
  );
}

// --- Exercise Card ---
function ExerciseCard({
  exercise,
  onUpdate,
  onRemove,
  onDuplicate,
  onToggleSuperset,
  onUnlinkSuperset,
  isLast,
  canSuperset,
  isPartOfSuperset,
  lockType,
  dragHandleProps,
}: {
  exercise: StrictExercise;
  onUpdate: (updates: Partial<StrictExercise>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onToggleSuperset: () => void;
  onUnlinkSuperset: () => void;
  isLast: boolean;
  canSuperset: boolean;
  isPartOfSuperset: boolean;
  lockType?: boolean;
  dragHandleProps?: Record<string, any>;
}) {
  const config = TYPE_CONFIG[exercise.type];
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRepsMenuOpen, setIsRepsMenuOpen] = useState(false);
  const [customRestSetIds, setCustomRestSetIds] = useState<Set<string>>(
    () => new Set(exercise.sets.filter((s) => !REST_PRESET_VALUES.has(s.rest)).map((s) => s.id))
  );

  const handleTypeChange = (newType: ExerciseType) => {
    onUpdate({ type: newType, sets: [], repsMode: 'fixed' });
    setIsTypeOpen(false);
  };

  const hasReps = TYPE_CONFIG[exercise.type].hasReps;
  const isRange = exercise.repsMode === 'range';

  const addSet = () => {
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet: StrictSet = lastSet
      ? { ...lastSet, id: uid() }
      : { id: uid(), rest: 60 };
    onUpdate({ sets: [...exercise.sets, newSet] });
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
            {lockType ? (
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold ${config.bgColor} ${config.textColor}`}>
                {config.label}
              </span>
            ) : (
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
            )}

            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-500">{exercise.equipment}</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">{exercise.sets.length} séries</span>
          </div>

          {/* Sets Table */}
          <div>
            {/* Header */}
            <div className="flex items-end gap-2 mb-1.5 px-1">
              <div className="w-8 text-[10px] font-bold text-gray-400 uppercase text-center">
                #
              </div>
              {config.columns.map((col) => (
                <div key={col.key} className="flex-1 text-[10px] font-bold text-gray-400 uppercase text-center">
                  {col.label}
                </div>
              ))}
              {hasReps && (
                <div className="flex-1 relative text-center">
                  <button
                    onClick={() => setIsRepsMenuOpen(!isRepsMenuOpen)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase hover:text-gray-600 transition-colors"
                  >
                    {isRange ? 'Faixa de Reps' : 'Reps'}
                    <ChevronDown size={10} />
                  </button>
                  <AnimatePresence>
                    {isRepsMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsRepsMenuOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 p-3 space-y-2"
                        >
                          <p className="text-xs font-semibold text-gray-700">Opções de Repetições</p>
                          <button
                            onClick={() => { onUpdate({ repsMode: 'fixed' }); setIsRepsMenuOpen(false); }}
                            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                              !isRange ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            Reps
                          </button>
                          <button
                            onClick={() => { onUpdate({ repsMode: 'range' }); setIsRepsMenuOpen(false); }}
                            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                              isRange ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            Faixa de Reps
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}
              <div className="w-20 text-[10px] font-bold text-gray-400 uppercase text-center flex items-center justify-center gap-1">
                <Clock size={10} />
                Descanso
              </div>
              <div className="w-14" />
            </div>

            {/* Rows */}
            <div className="space-y-1">
              <AnimatePresence mode="popLayout">
                {exercise.sets.map((set, setIndex) => (
                  <motion.div
                    key={set.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10, height: 0 }}
                    className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg group hover:bg-gray-100 transition-colors px-1"
                  >
                    <div className="w-8 text-sm font-bold text-gray-400 text-center flex-shrink-0">{setIndex + 1}</div>

                    {config.columns.map((col) => (
                      <div key={col.key} className="flex-1 relative">
                        {col.key === 'duration' ? (
                          <DurationInput
                            value={(set.duration as string) || ''}
                            onChange={(masked) => updateSet(set.id, 'duration', masked)}
                            placeholder={col.placeholder}
                            className="w-full text-center bg-white border border-gray-200 rounded-lg py-2 text-sm font-medium focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all tabular-nums"
                          />
                        ) : (
                          <>
                            <input
                              type={col.type}
                              value={(set[col.key] as string | number) || ''}
                              onChange={(e) => updateSet(set.id, col.key, e.target.value)}
                              placeholder={col.placeholder}
                              className="w-full text-center bg-white border border-gray-200 rounded-lg py-2 text-sm font-medium focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
                            />
                            {col.suffix && (
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">
                                {col.suffix}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    ))}

                    {/* Reps cell */}
                    {hasReps && (
                      isRange ? (
                        <div className="flex-1 flex items-center gap-1">
                          <input
                            type="number"
                            value={set.repsRange?.[0] || ''}
                            onChange={(e) => {
                              const min = Number(e.target.value) || 0;
                              const max = set.repsRange?.[1] || 0;
                              updateSet(set.id, 'repsRange', [min, max]);
                            }}
                            placeholder="0"
                            className="w-full text-center bg-white border border-gray-200 rounded-lg py-2 text-sm font-medium focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
                          />
                          <span className="text-gray-300 text-sm flex-shrink-0">-</span>
                          <input
                            type="number"
                            value={set.repsRange?.[1] || ''}
                            onChange={(e) => {
                              const min = set.repsRange?.[0] || 0;
                              const max = Number(e.target.value) || 0;
                              updateSet(set.id, 'repsRange', [min, max]);
                            }}
                            placeholder="0"
                            className="w-full text-center bg-white border border-gray-200 rounded-lg py-2 text-sm font-medium focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
                          />
                        </div>
                      ) : (
                        <div className="flex-1">
                          <input
                            type="number"
                            value={set.reps || ''}
                            onChange={(e) => updateSet(set.id, 'reps', e.target.value)}
                            placeholder="0"
                            className="w-full text-center bg-white border border-gray-200 rounded-lg py-2 text-sm font-medium focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
                          />
                        </div>
                      )
                    )}

                    {/* Rest per set */}
                    <div className="w-20 flex-shrink-0">
                      {customRestSetIds.has(set.id) ? (
                        <div className="relative">
                          <input
                            autoFocus
                            type="number"
                            min={0}
                            value={set.rest || ''}
                            onChange={(e) => updateSet(set.id, 'rest', Number(e.target.value) || 0)}
                            placeholder="45"
                            className="w-full text-center bg-white border border-yellow-400 rounded-lg py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400 transition-all pr-7"
                          />
                          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 pointer-events-none">seg</span>
                        </div>
                      ) : (
                        <select
                          value={REST_PRESET_VALUES.has(set.rest) ? set.rest : 'custom'}
                          onChange={(e) => {
                            if (e.target.value === 'custom') {
                              setCustomRestSetIds((prev) => new Set(prev).add(set.id));
                            } else {
                              updateSet(set.id, 'rest', Number(e.target.value));
                              setCustomRestSetIds((prev) => {
                                const next = new Set(prev);
                                next.delete(set.id);
                                return next;
                              });
                            }
                          }}
                          className="w-full text-center bg-white border border-gray-200 rounded-lg py-2 text-xs font-medium text-gray-600 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all appearance-none cursor-pointer"
                        >
                          {REST_PRESETS.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                          <option value="custom">Outro</option>
                        </select>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="w-14 flex items-center justify-center gap-0.5 flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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
        <div className="hidden md:flex flex-col items-center justify-start gap-1 flex-shrink-0 pt-1">
          <button
            {...dragHandleProps}
            className="flex items-center justify-center p-2 text-gray-300 cursor-grab hover:text-gray-500 transition-colors touch-none"
          >
            <GripVertical size={18} />
          </button>
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center justify-center p-2 text-gray-300 hover:text-gray-600 transition-colors"
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
                    className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1 overflow-hidden"
                  >
                    {isPartOfSuperset && (
                      <button
                        onClick={() => { onUnlinkSuperset(); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors text-orange-500"
                      >
                        <Link size={15} />
                        Remover superset
                      </button>
                    )}
                    {canSuperset && !exercise.supersetWithNext && (
                      <button
                        onClick={() => { onToggleSuperset(); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors text-gray-600"
                      >
                        <Link size={15} className="text-gray-400" />
                        Superset com próximo
                      </button>
                    )}
                    <button
                      onClick={() => { onDuplicate(); setIsMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors text-gray-600"
                    >
                      <Copy size={15} className="text-gray-400" />
                      Duplicar exercício
                    </button>
                    <button
                      onClick={() => { onRemove(); setIsMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors text-red-500"
                    >
                      <Trash2 size={15} />
                      Remover exercício
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile action buttons – horizontal row */}
      <div className="flex md:hidden items-center justify-end gap-1 pt-1 border-t border-gray-100">
        <button
          {...dragHandleProps}
          className="flex items-center justify-center p-2 text-gray-300 cursor-grab hover:text-gray-500 transition-colors touch-none"
        >
          <GripVertical size={18} />
        </button>
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center justify-center p-2 text-gray-300 hover:text-gray-600 transition-colors"
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
                  className="absolute right-0 bottom-full mb-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1 overflow-hidden"
                >
                  {isPartOfSuperset && (
                    <button
                      onClick={() => { onUnlinkSuperset(); setIsMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors text-orange-500"
                    >
                      <Link size={15} />
                      Remover superset
                    </button>
                  )}
                  {!isLast && !exercise.supersetWithNext && (
                    <button
                      onClick={() => { onToggleSuperset(); setIsMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors text-gray-600"
                    >
                      <Link size={15} className="text-gray-400" />
                      Superset com próximo
                    </button>
                  )}
                  <button
                    onClick={() => { onDuplicate(); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors text-gray-600"
                  >
                    <Copy size={15} className="text-gray-400" />
                    Duplicar exercício
                  </button>
                  <button
                    onClick={() => { onRemove(); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors text-red-500"
                  >
                    <Trash2 size={15} />
                    Remover exercício
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
