import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
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
  X,
  Flame,
  CornerDownRight,
  ChevronRight,
} from 'lucide-react';
import {
  StrictExercise,
  ExerciseType,
  StrictSet,
  SetType,
  DropSet,
  makeRestExercise,
} from '../types/workout';
import { getMediaPreviewUrl } from '../types/media';
import { MediaPreview } from './MediaPreview';
import { PseBadgeWithPicker } from './PsePicker';
import { ExerciseDetailModal } from './ExerciseDetailModal';
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
    columns: [
      { key: 'weight', label: 'Carga', type: 'number', placeholder: '0', suffix: 'kg' },
      { key: 'duration', label: 'Duração', type: 'text', placeholder: '00:00:00' },
    ],
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

// --- Color Bar ---
const NEXUR_COLORS = [
  '#f1f1f1',
  '#E45A33',
  '#FA761E',
  '#EF486E',
  '#4488FF',
  '#FF44AA',
  '#FDE84E',
  '#9AC53E',
  '#05D59E',
  '#5BBFEA',
  '#1089B1',
  '#06394A',
];

type ColorBarPlacement = 'right' | 'below';

function ColorBar({
  color,
  onChange,
  placement = 'right',
  children,
}: {
  color?: string;
  onChange: (hex: string) => void;
  placement?: ColorBarPlacement;
  children?: (triggerProps: { ref: React.RefObject<HTMLElement | null>; onClick: () => void }) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement | null>(null);

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      if (placement === 'below') {
        setPos({ top: rect.bottom + 4, left: rect.left });
      } else {
        setPos({ top: rect.top, left: rect.right + 8 });
      }
    }
    setOpen((v) => !v);
  };

  const popover = open && (
    <>
      <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
      <div
        className="fixed z-40 bg-white rounded-xl shadow-xl border border-gray-100 p-2"
        style={{ top: pos.top, left: pos.left }}
      >
        <div className="grid grid-cols-4 gap-1.5">
          {NEXUR_COLORS.map((hex) => (
            <button
              key={hex}
              onClick={() => { onChange(hex); setOpen(false); }}
              className="w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 focus:outline-none"
              style={{
                background: hex,
                borderColor: color === hex ? '#374151' : 'transparent',
              }}
            />
          ))}
        </div>
      </div>
    </>
  );

  if (children) {
    return (
      <>
        {children({ ref: triggerRef, onClick: handleOpen })}
        {popover}
      </>
    );
  }

  return (
    <div className="flex-shrink-0 h-full">
      <button
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        onClick={handleOpen}
        title="Cor do exercício"
        className="h-full w-2.5 rounded-lg cursor-pointer focus:outline-none"
        style={{ background: color || '#e5e7eb' }}
      />
      {popover}
    </div>
  );
}

// --- Helpers ---
function uid() {
  return crypto.randomUUID();
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

// --- Mobile card helpers ---
function fmtDurStr(d?: string): string {
  if (!d) return '?';
  const parts = d.split(':').map(Number);
  const total = (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h${m > 0 ? m + 'm' : ''}`;
  if (m > 0 && s > 0) return `${m}m${s}s`;
  if (m > 0) return `${m}min`;
  return `${s}s`;
}

function summarizeSet(set: StrictSet, type: ExerciseType, repsMode?: 'fixed' | 'range'): string {
  if (type === 'weight_reps') {
    const reps = repsMode === 'range' && set.repsRange
      ? `${set.repsRange[0] ?? 0}-${set.repsRange[1] ?? 0}`
      : String(set.reps ?? '?');
    return set.weight ? `${reps}×${set.weight}kg` : reps;
  }
  if (type === 'duration') return fmtDurStr(set.duration);
  if (type === 'distance') return set.distance ? `${set.distance}km` : '?';
  return '';
}

// --- Confirm dialog ---

// --- Superset connector ---
function SupersetConnector({ color }: { color: string }) {
  return (
    <div className="relative pl-5 -my-px z-10">
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full" style={{ background: color }} />
      <div className="absolute left-[-3px] top-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full" style={{ background: color }} />
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

// --- Fill Modal ---
type FillForm = {
  type: ExerciseType | null;
  setType: SetType | null;
  numSets: number | null;
  repsMode: 'fixed' | 'range' | null;
  weight: number | null;
  reps: number | null;
  repsMin: number | null;
  repsMax: number | null;
  duration: string | null;
  distance: number | null;
  rest: number | null;
  notes: string | null;
};

const INPUT_CLS = 'w-full text-center bg-gray-50 border border-gray-200 rounded-lg py-2 text-sm font-medium focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400';

function FillModal({ onApply, onClose }: { onApply: (form: FillForm) => void; onClose: () => void }) {
  const [type, setType] = useState<ExerciseType | null>(null);
  const [serieType, setSerieType] = useState<SetType | null>(null);
  const [numSets, setNumSets] = useState<number | null>(null);
  const [repsMode, setRepsMode] = useState<'fixed' | 'range' | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [reps, setReps] = useState<number | null>(null);
  const [repsMin, setRepsMin] = useState<number | null>(null);
  const [repsMax, setRepsMax] = useState<number | null>(null);
  const [durationEnabled, setDurationEnabled] = useState(false);
  const [duration, setDuration] = useState('00:00:30');
  const [distance, setDistance] = useState<number | null>(null);
  const [rest, setRest] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const isDropset = serieType === 'dropset';

  const handleApply = () => {
    onApply({ type, setType: serieType, numSets, repsMode, weight, reps, repsMin, repsMax, duration: durationEnabled ? duration : null, distance, rest, notes: notes !== '' ? notes : null });
  };

  const toggleType = (t: ExerciseType) => setType((prev) => prev === t ? null : t);
  const toggleSetType = (t: SetType) => setSerieType((prev) => prev === t ? null : t);
  const toggleRepsMode = (m: 'fixed' | 'range') => setRepsMode((prev) => prev === m ? null : m);

  const numInput = (val: number | null, onChange: (v: number | null) => void, placeholder: string) => (
    <input
      type="number" min={0}
      value={val ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      placeholder={placeholder}
      className={INPUT_CLS}
    />
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Preencher em massa</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Tipo de exercício */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Tipo de exercício</label>
            <div className="flex gap-1.5 flex-wrap">
              {(Object.keys(TYPE_CONFIG) as ExerciseType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${type === t ? `${TYPE_CONFIG[t].bgColor} ${TYPE_CONFIG[t].textColor}` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {TYPE_CONFIG[t].label}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de série */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Tipo de série</label>
            <div className="flex gap-1.5">
              {([['normal', 'Normal'], ['warmup', 'Aquecimento'], ['dropset', 'Drop Set']] as [SetType, string][]).map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => toggleSetType(t)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    serieType === t
                      ? t === 'warmup' ? 'bg-amber-100 text-amber-700' : t === 'dropset' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-700'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Séries + Reps mode */}
          <div className="flex items-end gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Séries</label>
              <input
                type="number" min={1} max={10}
                value={numSets ?? ''}
                onChange={(e) => setNumSets(e.target.value === '' ? null : Math.min(10, Math.max(1, Number(e.target.value))))}
                placeholder="3"
                className="w-16 text-center bg-gray-50 border border-gray-200 rounded-lg py-2 text-sm font-medium focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
              />
            </div>
            <div className="flex gap-1.5 pb-0.5">
              <button
                onClick={() => toggleRepsMode('fixed')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${repsMode === 'fixed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                Reps
              </button>
              <button
                onClick={() => toggleRepsMode('range')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${repsMode === 'range' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                Faixa
              </button>
            </div>
          </div>

          {/* Campos de série */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Carga (kg)</label>
              {numInput(weight, setWeight, '0 kg')}
            </div>

            {repsMode !== 'range' ? (
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Reps</label>
                {numInput(reps, setReps, '12')}
              </div>
            ) : (
              <>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Reps mín</label>
                  {numInput(repsMin, setRepsMin, '8')}
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Reps máx</label>
                  {numInput(repsMax, setRepsMax, '12')}
                </div>
              </>
            )}

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Duração</label>
              {durationEnabled ? (
                <DurationInput value={duration} onChange={setDuration} className={INPUT_CLS} />
              ) : (
                <button onClick={() => setDurationEnabled(true)} className="w-full text-center bg-gray-50 border border-gray-200 rounded-lg py-2 text-sm text-gray-400 hover:border-yellow-400 hover:text-gray-600 transition-colors">
                  00:00:30
                </button>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Distância (km)</label>
              {numInput(distance, setDistance, '0 km')}
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Descanso (seg)</label>
              {isDropset ? (
                <div className="w-full text-center bg-gray-50 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-300 cursor-not-allowed select-none">
                  OFF
                </div>
              ) : numInput(rest, setRest, '60s')}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicionar observação..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 resize-none h-16"
            />
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
          <button onClick={handleApply} className="flex-1 py-2.5 text-sm font-bold text-white bg-yellow-400 hover:bg-yellow-500 rounded-lg transition-colors">Aplicar</button>
        </div>
      </motion.div>
    </motion.div>
  );
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
  onRegisterToggleBulk,
  onRegisterBulkClear,
  onRegisterBulkRemove,
  onRegisterBulkFill,
  onRegisterToggleSelectAll,
  onBulkStateChange,
  onExercisesChange,
  defaultExerciseType = 'weight_reps',
}: {
  onRegisterAdd?: (fn: (ex: LibraryExercise) => void) => void;
  onRegisterAddRest?: (fn: () => void) => void;
  onRegisterToggleBulk?: (fn: () => void) => void;
  onRegisterBulkClear?: (fn: () => void) => void;
  onRegisterBulkRemove?: (fn: () => void) => void;
  onRegisterBulkFill?: (fn: () => void) => void;
  onRegisterToggleSelectAll?: (fn: () => void) => void;
  onBulkStateChange?: (state: { active: boolean; count: number; allSelected: boolean }) => void;
  onExercisesChange?: (exercises: StrictExercise[]) => void;
  defaultExerciseType?: ExerciseType;
}) {
  const storageKey = defaultExerciseType === 'duration' ? 'nexur-autoplay-exercises' : 'nexur-strict-exercises';
  const [exercises, setExercises] = useLocalStorage<StrictExercise[]>(storageKey, []);

  // One-time migration: fix duplicate IDs from old _idCounter-based storage
  useEffect(() => {
    const seen = new Set<string>();
    let dirty = false;
    const fixed = exercises.map((ex) => {
      let e = ex;
      if (seen.has(e.id)) { e = { ...e, id: uid() }; dirty = true; }
      seen.add(e.id);
      const seenSets = new Set<string>();
      const fixedSets = e.sets.map((s) => {
        if (seenSets.has(s.id)) { dirty = true; return { ...s, id: uid() }; }
        seenSets.add(s.id);
        return s;
      });
      return fixedSets !== e.sets ? { ...e, sets: fixedSets } : e;
    });
    if (dirty) setExercises(fixed);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFillModal, setShowFillModal] = useState(false);

  const selectableExercises = useMemo(() => exercises.filter((ex) => ex.type !== 'rest'), [exercises]);
  const allSelected = selectableExercises.length > 0 && selectableExercises.every((ex) => selectedIds.has(ex.id));

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(allSelected ? new Set() : new Set(selectableExercises.map((ex) => ex.id)));
  }, [allSelected, selectableExercises]);

  const toggleBulkMode = useCallback(() => {
    setBulkMode((v) => {
      if (v) setSelectedIds(new Set());
      return !v;
    });
  }, []);

  const handleBulkRemove = useCallback(() => {
    setExercises((prev) => {
      const toRemove = selectedIds;
      const next = prev.filter((ex) => !toRemove.has(ex.id));
      for (let i = 0; i < next.length; i++) {
        if (next[i].supersetWithNext && (i === next.length - 1 || next[i + 1].type === 'rest')) {
          next[i] = { ...next[i], supersetWithNext: false };
        }
      }
      if (next.length > 0 && next[next.length - 1].supersetWithNext) {
        next[next.length - 1] = { ...next[next.length - 1], supersetWithNext: false };
      }
      return next;
    });
    setBulkMode(false);
    setSelectedIds(new Set());
  }, [selectedIds, setExercises]);

  const handleBulkClear = useCallback(() => {
    setExercises((prev) =>
      prev.map((ex) => (selectedIds.has(ex.id) ? { ...ex, sets: [], notes: '' } : ex))
    );
    setSelectedIds(new Set());
  }, [selectedIds, setExercises]);

  const handleFillApply = useCallback((form: FillForm) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (!selectedIds.has(ex.id)) return ex;
        let updated = { ...ex };

        if (form.type !== null) updated = { ...updated, type: form.type };
        if (form.repsMode !== null) updated = { ...updated, repsMode: form.repsMode };

        const effectiveRepsMode = form.repsMode ?? ex.repsMode;

        const applyToSet = (s: StrictSet): StrictSet => {
          const ns = { ...s };
          if (form.weight !== null) ns.weight = form.weight;
          if (form.rest !== null) ns.rest = form.rest;
          if (form.duration !== null) ns.duration = form.duration;
          if (form.distance !== null) ns.distance = form.distance;
          if (effectiveRepsMode === 'range') {
            if (form.repsMin !== null || form.repsMax !== null) {
              ns.repsRange = [form.repsMin ?? s.repsRange?.[0] ?? 0, form.repsMax ?? s.repsRange?.[1] ?? 0];
            }
          } else {
            if (form.reps !== null) ns.reps = form.reps;
          }
          if (form.setType !== null) {
            ns.type = form.setType;
            if (form.setType === 'dropset') {
              if (!ns.dropsets || ns.dropsets.length === 0) {
                ns.dropsets = makeInitialDropsets(ns);
              }
            } else {
              ns.dropsets = undefined;
            }
          }
          // Scale drop weights proportionally when main weight changes on a dropset
          const isDropset = ns.type === 'dropset' && ns.dropsets && ns.dropsets.length > 0;
          if (form.weight !== null && isDropset) {
            const oldWeight = s.weight ?? 0;
            const newWeight = form.weight;
            ns.dropsets = (ns.dropsets ?? []).map((drop, di) => {
              if (oldWeight > 0) {
                return { ...drop, weight: Math.round(newWeight * ((drop.weight ?? 0) / oldWeight)) };
              }
              return { ...drop, weight: Math.round(newWeight * 0.8 ** (di + 1)) };
            });
          }
          return ns;
        };

        if (form.numSets !== null) {
          const base = updated.sets;
          updated = {
            ...updated,
            sets: Array.from({ length: form.numSets }, (_, i) => {
              const src = base[i] ?? base[base.length - 1] ?? { id: uid(), rest: 60 };
              return applyToSet({ ...src, id: uid() });
            }),
          };
        } else {
          updated = { ...updated, sets: updated.sets.map(applyToSet) };
        }

        if (form.notes !== null) updated = { ...updated, notes: form.notes };

        return updated;
      })
    );
    setShowFillModal(false);
    setSelectedIds(new Set());
  }, [selectedIds, setExercises]);

  const addFromLibrary = useCallback((ex: LibraryExercise) => {
    const isDuration = defaultExerciseType === 'duration';
    const newExercise: StrictExercise = {
      id: uid(),
      name: ex.name,
      media1: ex.media1,
      media2: ex.media2,
      category: ex.category,
      equipment: ex.equipment,
      orientacoes: ex.orientacoes,
      type: defaultExerciseType,
      repsMode: 'fixed',
      notes: '',
      supersetWithNext: false,
      sets: isDuration
        ? [
            { id: uid(), weight: 0, duration: '00:00:30', rest: 60 },
            { id: uid(), weight: 0, duration: '00:00:30', rest: 60 },
            { id: uid(), weight: 0, duration: '00:00:30', rest: 60 },
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
    onRegisterToggleBulk?.(toggleBulkMode);
  }, [onRegisterToggleBulk, toggleBulkMode]);

  useEffect(() => {
    onRegisterBulkClear?.(handleBulkClear);
  }, [onRegisterBulkClear, handleBulkClear]);

  useEffect(() => {
    onRegisterBulkRemove?.(handleBulkRemove);
  }, [onRegisterBulkRemove, handleBulkRemove]);

  useEffect(() => {
    onRegisterBulkFill?.(() => setShowFillModal(true));
  }, [onRegisterBulkFill]);

  useEffect(() => {
    onRegisterToggleSelectAll?.(toggleSelectAll);
  }, [onRegisterToggleSelectAll, toggleSelectAll]);

  useEffect(() => {
    onBulkStateChange?.({ active: bulkMode, count: selectedIds.size, allSelected });
  }, [bulkMode, selectedIds, allSelected, onBulkStateChange]);

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

            const { supersetColor, chainStartId } = (() => {
              let s = index;
              while (s > 0 && exercises[s - 1].supersetWithNext) s--;
              return {
                supersetColor: exercises[s].cor || '#FBBF24',
                chainStartId: exercises[s].id,
              };
            })();

            return (
              <SortableExerciseItem key={exercise.id} id={exercise.id}>
                {(handleProps) => (
                  <>

                    {isFirst && index > 0 && !isRest && (
                      <div className="mt-4" />
                    )}

                    {/* Superset connector */}
                    {prevLinked && <SupersetConnector color={supersetColor} />}

                    {/* Superset badge above first card of group */}
                    {exercise.supersetWithNext && isFirst && (
                      <div className={`mb-2 ${linked ? 'pl-5' : ''}`}>
                        <ColorBar
                          color={exercise.cor}
                          onChange={(hex) => updateExercise(exercise.id, { cor: hex })}
                          placement="below"
                        >
                          {({ ref, onClick }) => (
                            <button
                              ref={ref as React.RefObject<HTMLButtonElement>}
                              onClick={onClick}
                              style={{ background: supersetColor }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-gray-900 rounded-lg text-[11px] font-bold cursor-pointer focus:outline-none"
                            >
                              <Link size={11} />
                              Superset
                            </button>
                          )}
                        </ColorBar>
                      </div>
                    )}

                    <div className={bulkMode && !isRest ? 'flex items-start gap-2' : ''}>
                      {bulkMode && !isRest && (
                        <div className="flex-shrink-0 pt-5">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(exercise.id)}
                            onChange={() => toggleSelect(exercise.id)}
                            className="w-4 h-4 accent-yellow-400 cursor-pointer"
                          />
                        </div>
                      )}
                      <div className={`relative flex-1 ${linked ? 'pl-5' : ''}`}>
                        {linked && (
                          <ColorBar
                            color={exercises.find(e => e.id === chainStartId)?.cor}
                            onChange={(hex) => updateExercise(chainStartId, { cor: hex })}
                            placement="right"
                          >
                            {({ ref, onClick }) => (
                              <div
                                ref={ref as React.RefObject<HTMLDivElement>}
                                onClick={onClick}
                                className="absolute left-0 top-0 bottom-0 w-1 rounded-full cursor-pointer"
                                style={{ background: supersetColor }}
                              />
                            )}
                          </ColorBar>
                        )}

                        {isRest ? (
                          <RestCard
                            exercise={exercise}
                            onUpdate={(updates) => updateExercise(exercise.id, updates)}
                            onRemove={() => removeExercise(index)}
                            dragHandleProps={bulkMode ? undefined : handleProps}
                          />
                        ) : (
                          <ExerciseCard
                            exercise={exercise}
                            onUpdate={(updates) => updateExercise(exercise.id, updates)}
                            onRemove={() => removeExercise(index)}
                            onDuplicate={() => duplicateExercise(index)}
                            onToggleSuperset={() => {
                              if (!canSuperset) return;
                              setExercises((prev) => {
                                const next = [...prev];
                                next[index] = { ...next[index], supersetWithNext: true };

                                // Find full chain boundaries
                                let chainStart = index;
                                while (chainStart > 0 && next[chainStart - 1].supersetWithNext) chainStart--;
                                let chainEnd = index;
                                while (chainEnd < next.length - 1 && next[chainEnd].supersetWithNext) chainEnd++;

                                // Last exercise in chain: all sets rest=60. Others: all sets rest=0.
                                for (let j = chainStart; j <= chainEnd; j++) {
                                  if (next[j].type === 'rest') continue;
                                  const isLast = j === chainEnd;
                                  const ex = next[j];
                                  next[j] = { ...ex, sets: ex.sets.map(s => ({ ...s, rest: isLast ? 60 : 0 })) };
                                }
                                return next;
                              });
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
                            onAddRestAfter={() => insertRestAt(index + 1)}
                            isLast={isLast(index)}
                            canSuperset={canSuperset}
                            isPartOfSuperset={linked}
                            lockType={defaultExerciseType !== 'weight_reps'}
                            dragHandleProps={bulkMode ? undefined : handleProps}
                          />
                        )}
                      </div>
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
                    <MediaPreview media={activeExercise.media1} alt={activeExercise.name} />
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

      {/* Fill modal */}
      <AnimatePresence>
        {showFillModal && (
          <FillModal onApply={handleFillApply} onClose={() => setShowFillModal(false)} />
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

// --- Set Type Badge ---
function SetTypeBadge({ set, index, onChangeType }: { set: StrictSet; index: number; onChangeType: (type: SetType) => void }) {
  const [open, setOpen] = useState(false);
  const type = set.type ?? 'normal';

  const badge = type === 'warmup' ? (
    <span className="w-8 h-7 flex items-center justify-center rounded-md bg-amber-100 text-amber-600 text-xs font-bold flex-shrink-0">W</span>
  ) : type === 'dropset' ? (
    <span className="w-8 h-7 flex items-center justify-center rounded-md bg-orange-100 text-orange-500 flex-shrink-0">
      <CornerDownRight size={14} />
    </span>
  ) : (
    <span className="w-8 h-7 flex items-center justify-center rounded-md text-sm font-bold text-gray-400 flex-shrink-0">{index + 1}</span>
  );

  return (
    <div className="relative flex-shrink-0">
      <button onClick={() => setOpen(!open)} className="focus:outline-none" title="Tipo da série">
        {badge}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              className="absolute left-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1 overflow-hidden"
            >
              {(['normal', 'warmup', 'dropset'] as SetType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { onChangeType(t); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors hover:bg-gray-50 ${type === t ? 'font-semibold text-gray-900' : 'text-gray-600'}`}
                >
                  {t === 'normal' && <span className="w-5 h-5 flex items-center justify-center rounded text-xs font-bold text-gray-400 bg-gray-100">{index + 1}</span>}
                  {t === 'warmup' && <span className="w-5 h-5 flex items-center justify-center rounded text-xs font-bold text-amber-600 bg-amber-100"><Flame size={12} /></span>}
                  {t === 'dropset' && <span className="w-5 h-5 flex items-center justify-center rounded text-orange-500 bg-orange-100"><CornerDownRight size={12} /></span>}
                  {t === 'normal' ? 'Normal' : t === 'warmup' ? 'Aquecimento' : 'Drop Set'}
                  {type === t && <Check size={12} className="ml-auto text-yellow-500" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Dropset Row ---
type DropsetRowProps = {
  drop: DropSet;
  isLast: boolean;
  config: { columns: ColumnConfig[] };
  hasReps: boolean | undefined;
  isRange: boolean;
  onUpdate: (field: keyof DropSet, value: any) => void;
  onRemove: () => void;
  onAdd: () => void;
};

function DropsetRow({ drop, isLast, config, hasReps, isRange, onUpdate, onRemove, onAdd }: DropsetRowProps) {
  return (
    <div className="flex items-center gap-2 bg-orange-50 p-2 rounded-lg group px-1 ml-2">
      {/* Badge */}
      <div className="w-8 flex-shrink-0 flex items-center justify-center">
        {isLast ? (
          <button
            onClick={onAdd}
            className="w-8 h-7 flex items-center justify-center rounded-md bg-orange-200 text-orange-600 hover:bg-orange-300 transition-colors"
            title="Adicionar drop"
          >
            <span className="flex items-center"><CornerDownRight size={12} /><Plus size={10} /></span>
          </button>
        ) : (
          <span className="w-8 h-7 flex items-center justify-center rounded-md bg-orange-100 text-orange-400">
            <CornerDownRight size={14} />
          </span>
        )}
      </div>

      {config.columns.map((col) => (
        <div key={col.key} className="flex-1 relative">
          {col.key === 'duration' ? (
            <DurationInput
              value={(drop.duration as string) || ''}
              onChange={(masked) => onUpdate('duration', masked)}
              placeholder={col.placeholder}
              className="w-full text-center bg-white border border-orange-200 rounded-lg py-2 text-sm font-medium focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-all tabular-nums"
            />
          ) : (
            <>
              <input
                type={col.type}
                value={(drop[col.key as keyof DropSet] as string | number) || ''}
                onChange={(e) => onUpdate(col.key as keyof DropSet, e.target.value)}
                placeholder={col.placeholder}
                className="w-full text-center bg-white border border-orange-200 rounded-lg py-2 text-sm font-medium focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-all"
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
              value={drop.repsRange?.[0] || ''}
              onChange={(e) => {
                const min = Number(e.target.value) || 0;
                const max = drop.repsRange?.[1] || 0;
                onUpdate('repsRange', [min, max]);
              }}
              placeholder="0"
              className="w-full text-center bg-white border border-orange-200 rounded-lg py-2 text-sm font-medium focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-all"
            />
            <span className="text-gray-300 text-sm flex-shrink-0">-</span>
            <input
              type="number"
              value={drop.repsRange?.[1] || ''}
              onChange={(e) => {
                const min = drop.repsRange?.[0] || 0;
                const max = Number(e.target.value) || 0;
                onUpdate('repsRange', [min, max]);
              }}
              placeholder="0"
              className="w-full text-center bg-white border border-orange-200 rounded-lg py-2 text-sm font-medium focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-all"
            />
          </div>
        ) : (
          <div className="flex-1">
            <input
              type="number"
              value={drop.reps || ''}
              onChange={(e) => onUpdate('reps', e.target.value)}
              placeholder="0"
              className="w-full text-center bg-white border border-orange-200 rounded-lg py-2 text-sm font-medium focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-all"
            />
          </div>
        )
      )}

      {/* Rest column — disabled, always OFF for dropsets */}
      <div className="w-20 flex-shrink-0">
        <div className="w-full text-center bg-gray-50 border border-gray-200 rounded-lg py-2 text-xs font-medium text-gray-300 cursor-not-allowed select-none">
          OFF
        </div>
      </div>

      {/* Remove */}
      <div className="w-14 flex items-center justify-center flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button
          onClick={onRemove}
          className="p-1 text-orange-300 hover:text-red-500 transition-colors"
          title="Remover drop"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

function makeInitialDropsets(s: { reps?: number; repsRange?: [number, number]; weight?: number; duration?: string; distance?: number }): DropSet[] {
  const w1 = s.weight && s.weight > 0 ? Math.max(0, Math.round(s.weight * 0.8)) : s.weight;
  const w2 = w1 && w1 > 0 ? Math.max(0, Math.round(w1 * 0.8)) : w1;
  return [
    { id: uid(), reps: s.reps, repsRange: s.repsRange, weight: w1, duration: s.duration, distance: s.distance },
    { id: uid(), reps: s.reps, repsRange: s.repsRange, weight: w2, duration: s.duration, distance: s.distance },
  ];
}

// --- Exercise Type Modal ---
const TYPE_DETAIL: Record<string, { icon: React.ReactNode; description: string; fields: string[] }> = {
  weight_reps: {
    icon: <Dumbbell size={20} />,
    description: 'Registra peso e repetições por série. Ideal para treinos de força clássicos.',
    fields: ['Peso (kg)', 'Repetições'],
  },
  duration: {
    icon: <Timer size={20} />,
    description: 'Registra carga opcional e tempo de execução. Ideal para isométricos e cardio.',
    fields: ['Carga (kg)', 'Duração (hh:mm:ss)'],
  },
  distance: {
    icon: <Flame size={20} />,
    description: 'Registra a distância percorrida por série. Ideal para corrida, ciclismo e remo.',
    fields: ['Distância (km)'],
  },
};

function ExerciseTypeModal({
  open,
  current,
  onSelect,
  onClose,
}: {
  open: boolean;
  current: ExerciseType;
  onSelect: (type: ExerciseType) => void;
  onClose: () => void;
}) {
  const types = Object.keys(TYPE_CONFIG) as ExerciseType[];

  const cardContent = (type: ExerciseType, isSelected: boolean) => {
    const tc = TYPE_CONFIG[type];
    const detail = TYPE_DETAIL[type];
    return (
      <button
        key={type}
        onClick={() => onSelect(type)}
        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
          isSelected
            ? `${tc.bgColor} ${tc.textColor} border-current`
            : 'border-gray-100 bg-gray-50 hover:border-gray-200 text-gray-700'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className={isSelected ? '' : 'text-gray-400'}>{detail.icon}</span>
            <span className="text-sm font-bold">{tc.label}</span>
          </div>
          {isSelected && <Check size={16} />}
        </div>
        <p className={`text-xs mb-2 ${isSelected ? 'opacity-70' : 'text-gray-500'}`}>{detail.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {detail.fields.map((f) => (
            <span
              key={f}
              className={`text-[10px] px-2 py-0.5 rounded-full border ${
                isSelected ? 'bg-white/60 border-current/20' : 'bg-white border-gray-200 text-gray-500'
              }`}
            >
              {f}
            </span>
          ))}
        </div>
      </button>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />

          {/* Mobile: bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl"
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="px-4 pb-2">
              <h2 className="text-base font-bold text-gray-900">Tipo de exercício</h2>
              <p className="text-xs text-gray-400 mt-0.5">Selecione como as séries serão registradas</p>
            </div>
            <div className="px-4 pb-8 flex flex-col gap-3">
              {types.map((type) => cardContent(type, current === type))}
            </div>
          </motion.div>

          {/* Desktop: centered modal */}
          <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 pointer-events-auto"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Tipo de exercício</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Selecione como as séries serão registradas</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {types.map((type) => cardContent(type, current === type))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
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
  onAddRestAfter,
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
  onAddRestAfter: () => void;
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

  const [mobileEditOpen, setMobileEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleTypeChange = (newType: ExerciseType) => {
    const mappedSets = exercise.sets.map((s) => ({ id: s.id, rest: s.rest }));
    onUpdate({ type: newType, sets: mappedSets, repsMode: 'fixed' });
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

  const updateSetType = (setId: string, type: SetType) => {
    onUpdate({
      sets: exercise.sets.map((s) => {
        if (s.id !== setId) return s;
        if (type === 'dropset') {
          const existing = s.dropsets && s.dropsets.length > 0 ? s.dropsets : makeInitialDropsets(s);
          return { ...s, type, dropsets: existing };
        }
        return { ...s, type, dropsets: undefined };
      }),
    });
  };

  const addDropset = (setId: string) => {
    onUpdate({
      sets: exercise.sets.map((s) => {
        if (s.id !== setId) return s;
        const last = s.dropsets?.[s.dropsets.length - 1];
        const prevWeight = last?.weight ?? 0;
        const reducedWeight = prevWeight > 0 ? Math.max(0, Math.round(prevWeight * 0.8)) : undefined;
        const newDrop: DropSet = { id: uid(), reps: last?.reps, repsRange: last?.repsRange, weight: reducedWeight, duration: last?.duration, distance: last?.distance };
        return { ...s, dropsets: [...(s.dropsets ?? []), newDrop] };
      }),
    });
  };

  const updateDropset = (setId: string, dropId: string, field: keyof DropSet, value: any) => {
    onUpdate({
      sets: exercise.sets.map((s) => {
        if (s.id !== setId) return s;
        return { ...s, dropsets: (s.dropsets ?? []).map((d) => d.id === dropId ? { ...d, [field]: value } : d) };
      }),
    });
  };

  const removeDropset = (setId: string, dropId: string) => {
    onUpdate({
      sets: exercise.sets.map((s) => {
        if (s.id !== setId) return s;
        const remaining = (s.dropsets ?? []).filter((d) => d.id !== dropId);
        return remaining.length === 0
          ? { ...s, type: 'normal' as const, dropsets: undefined }
          : { ...s, dropsets: remaining };
      }),
    });
  };

  return (
    <div className="flex flex-col gap-4 py-4 rounded-lg bg-white">
      {/* Title row */}
      <div className="flex items-center gap-2">
        {/* Mobile: tappable card (thumbnail + name + type + sets summary) */}
        <div className="flex items-stretch gap-1.5 flex-1 min-w-0 md:hidden">
          {!isPartOfSuperset && <ColorBar color={exercise.cor} onChange={(hex) => onUpdate({ cor: hex })} />}
          <button
            onClick={() => setMobileEditOpen(true)}
            className="flex items-start gap-2.5 flex-1 min-w-0 text-left py-0.5"
          >
            <button
              onClick={(e) => { e.stopPropagation(); setDetailOpen(true); }}
              className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 focus:outline-none"
            >
              <MediaPreview media={exercise.media1} alt={exercise.name} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate leading-tight">{exercise.name}</p>
              <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${config.bgColor} ${config.textColor}`}>
                {config.label}
              </span>
              {exercise.sets.length > 0 && (
                <div className="flex flex-col mt-0.5">
                  {exercise.sets.slice(0, 5).map((s, i) => {
                    const label = summarizeSet(s, exercise.type, exercise.repsMode);
                    if (!label) return null;
                    return (
                      <span key={s.id} className="text-[11px] text-gray-500 leading-snug">
                        <span className="text-gray-300 mr-1">{i + 1}</span>{label}
                      </span>
                    );
                  })}
                  {exercise.sets.length > 5 && (
                    <span className="text-[11px] text-gray-400">+{exercise.sets.length - 5} séries</span>
                  )}
                </div>
              )}
            </div>
            <ChevronRight size={14} className="text-gray-300 flex-shrink-0 mt-1" />
          </button>
        </div>
        {/* Desktop: just the name */}
        <button
          onClick={() => setDetailOpen(true)}
          className="hidden md:block text-sm font-bold text-gray-900 truncate flex-1 text-left hover:text-blue-600 transition-colors"
        >
          {exercise.name}
        </button>
        {/* Mobile actions — grip + menu */}
        <div className="flex md:hidden items-center gap-0.5 flex-shrink-0">
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
                      onClick={() => { onAddRestAfter(); setIsMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors text-gray-600"
                    >
                      <Timer size={15} className="text-gray-400" />
                      Adicionar descanso
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

      {/* Content: thumbnail + form on md+ */}
      <div className="hidden md:flex gap-4">
        {/* Thumbnail + color bar – desktop only */}
        <div className="hidden md:flex gap-1 h-36 flex-shrink-0">
          {!isPartOfSuperset && <ColorBar color={exercise.cor} onChange={(hex) => onUpdate({ cor: hex })} />}
          <button
            onClick={() => setDetailOpen(true)}
            className="w-36 h-36 rounded-lg overflow-hidden bg-gray-100 focus:outline-none hover:opacity-90 transition-opacity"
          >
            <MediaPreview media={exercise.media1} alt={exercise.name} />
          </button>
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
              <button
                onClick={() => setIsTypeOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${config.bgColor} ${config.textColor} hover:opacity-80`}
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
              <div className="w-9 text-[10px] font-bold text-gray-400 uppercase text-center">PSE</div>
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
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10, height: 0 }}
                    className="flex flex-col gap-1"
                  >
                    {/* Main set row */}
                    <div className={`flex items-center gap-2 p-2 rounded-lg group transition-colors px-1 ${set.type === 'dropset' ? 'bg-orange-50 hover:bg-orange-100' : set.type === 'warmup' ? 'bg-amber-50 hover:bg-amber-100' : 'bg-gray-50 hover:bg-gray-100'}`}>
                      <SetTypeBadge
                        set={set}
                        index={setIndex}
                        onChangeType={(type) => updateSetType(set.id, type)}
                      />

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

                      {/* PSE */}
                      <div className="flex-shrink-0 flex items-center justify-center">
                        <PseBadgeWithPicker
                          value={set.pse}
                          onChange={(v) => updateSet(set.id, 'pse', v)}
                        />
                      </div>

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
                          onClick={() => removeSet(set.id)}
                          className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                          title="Remover série"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Dropset sub-rows */}
                    {set.type === 'dropset' && (set.dropsets ?? []).map((drop, di) => (
                      <DropsetRow
                        key={drop.id}
                        drop={drop}
                        isLast={di === (set.dropsets?.length ?? 0) - 1}
                        config={config}
                        hasReps={hasReps}
                        isRange={isRange}
                        onUpdate={(field, val) => updateDropset(set.id, drop.id, field, val)}
                        onRemove={() => removeDropset(set.id, drop.id)}
                        onAdd={() => addDropset(set.id)}
                      />
                    ))}
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

        {/* Action buttons – vertical on md+, hidden on mobile (shown in title row) */}
        <div className="hidden md:flex flex-col items-center justify-start gap-1 flex-shrink-0 pt-1">
          <button
            {...dragHandleProps}
            className="flex items-center justify-center p-2 text-gray-300 cursor-grab hover:text-gray-500 transition-colors touch-none"
          >
            <GripVertical size={18} />
          </button>
          <button
            onClick={onRemove}
            className="flex items-center justify-center p-2 text-gray-300 hover:text-red-500 transition-colors"
            title="Remover exercício"
          >
            <Trash2 size={16} />
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
                      onClick={() => { onAddRestAfter(); setIsMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors text-gray-600"
                    >
                      <Timer size={15} className="text-gray-400" />
                      Adicionar descanso
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Edit Sheet */}
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
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>

              {/* Sheet header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  {!isPartOfSuperset && (
                    <ColorBar color={exercise.cor} onChange={(hex) => onUpdate({ cor: hex })} placement="below" />
                  )}
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <MediaPreview media={exercise.media1} alt={exercise.name} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{exercise.name}</p>
                    {exercise.equipment && (
                      <p className="text-xs text-gray-400 truncate">{exercise.equipment}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setMobileEditOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form content */}
              <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-y-4">
                {/* Type Selector */}
                <div className="flex items-center gap-2 flex-wrap">
                  {lockType ? (
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold ${config.bgColor} ${config.textColor}`}>
                      {config.label}
                    </span>
                  ) : (
                    <button
                      onClick={() => setIsTypeOpen(true)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${config.bgColor} ${config.textColor} hover:opacity-80`}
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

                {/* Sets Table */}
                <div>
                  {/* Header */}
                  <div className="flex items-end gap-2 mb-1.5 px-1">
                    <div className="w-8 text-[10px] font-bold text-gray-400 uppercase text-center">#</div>
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
                          {isRange ? 'Faixa' : 'Reps'}
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
                    <div className="w-9 text-[10px] font-bold text-gray-400 uppercase text-center">PSE</div>
                    <div className="w-20 text-[10px] font-bold text-gray-400 uppercase text-center flex items-center justify-center gap-1">
                      <Clock size={10} />
                      Descanso
                    </div>
                    <div className="w-8" />
                  </div>

                  {/* Set Rows */}
                  <div className="space-y-1">
                    <AnimatePresence mode="popLayout">
                      {exercise.sets.map((set, setIndex) => (
                        <motion.div
                          key={set.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10, height: 0 }}
                          className="flex flex-col gap-1"
                        >
                          <div className={`flex items-center gap-2 p-2 rounded-lg px-1 ${set.type === 'dropset' ? 'bg-orange-50' : set.type === 'warmup' ? 'bg-amber-50' : 'bg-gray-50'}`}>
                            <SetTypeBadge
                              set={set}
                              index={setIndex}
                              onChangeType={(type) => updateSetType(set.id, type)}
                            />
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
                                      inputMode="decimal"
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
                            {hasReps && (
                              isRange ? (
                                <div className="flex-1 flex items-center gap-1">
                                  <input
                                    type="number"
                                    inputMode="numeric"
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
                                    inputMode="numeric"
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
                                    inputMode="numeric"
                                    value={set.reps || ''}
                                    onChange={(e) => updateSet(set.id, 'reps', e.target.value)}
                                    placeholder="0"
                                    className="w-full text-center bg-white border border-gray-200 rounded-lg py-2 text-sm font-medium focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
                                  />
                                </div>
                              )
                            )}
                            {/* PSE */}
                            <div className="flex-shrink-0 flex items-center justify-center">
                              <PseBadgeWithPicker
                                value={set.pse}
                                onChange={(v) => updateSet(set.id, 'pse', v)}
                              />
                            </div>
                            {/* Rest per set */}
                            <div className="w-20 flex-shrink-0">
                              {customRestSetIds.has(set.id) ? (
                                <div className="relative">
                                  <input
                                    autoFocus
                                    type="number"
                                    inputMode="numeric"
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
                            {/* Remove set */}
                            <div className="w-8 flex items-center justify-center flex-shrink-0">
                              <button
                                onClick={() => removeSet(set.id)}
                                className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          {/* Dropset sub-rows */}
                          {set.type === 'dropset' && (set.dropsets ?? []).map((drop, di) => (
                            <DropsetRow
                              key={drop.id}
                              drop={drop}
                              isLast={di === (set.dropsets?.length ?? 0) - 1}
                              config={config}
                              hasReps={hasReps}
                              isRange={isRange}
                              onUpdate={(field, val) => updateDropset(set.id, drop.id, field, val)}
                              onRemove={() => removeDropset(set.id, drop.id)}
                              onAdd={() => addDropset(set.id)}
                            />
                          ))}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <button
                    onClick={addSet}
                    className="mt-2.5 w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 border-dashed"
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
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all resize-none h-20"
                  />
                </div>
              </div>

              {/* Sheet footer */}
              <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100">
                <button
                  onClick={() => setMobileEditOpen(false)}
                  className="w-full py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Feito
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ExerciseTypeModal
        open={isTypeOpen}
        current={exercise.type}
        onSelect={handleTypeChange}
        onClose={() => setIsTypeOpen(false)}
      />

      {detailOpen && (
        <ExerciseDetailModal
          exercise={exercise}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </div>
  );
}
