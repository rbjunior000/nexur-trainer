import { useState, useMemo } from 'react';
import { X, TrendingUp, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import type { StrictExercise } from '../types/workout';

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseDurationSecs(d: string): number {
  const parts = d.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] ?? 0;
}

function formatSecs(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0 && s > 0) return `${m}min ${s}s`;
  if (m > 0) return `${m}min`;
  return `${s}s`;
}

function formatDurationLabel(d: string): string {
  return formatSecs(parseDurationSecs(d));
}

// ─── Weight / reps ───────────────────────────────────────────────────────────

interface SetLoad {
  index: number;
  reps: number;
  weight: number;
  total: number;
}

interface ExerciseLoad {
  id: string;
  name: string;
  sets: SetLoad[];
  total: number;
}

function calcExerciseLoads(exercises: StrictExercise[]): ExerciseLoad[] {
  return exercises
    .filter((ex) => ex.type === 'weight_reps')
    .map((ex) => {
      const sets: SetLoad[] = ex.sets.map((set, i) => {
        const reps =
          ex.repsMode === 'range' && set.repsRange
            ? Math.round((set.repsRange[0] + set.repsRange[1]) / 2)
            : (set.reps ?? 0);
        const weight = set.weight ?? 0;
        return { index: i + 1, reps, weight, total: reps * weight };
      });
      return {
        id: ex.id,
        name: ex.name,
        sets,
        total: sets.reduce((sum, s) => sum + s.total, 0),
      };
    })
    .filter((ex) => ex.total > 0);
}

// ─── Duration ────────────────────────────────────────────────────────────────

interface SetDuration {
  index: number;
  label: string;
  secs: number;
}

interface ExerciseDuration {
  id: string;
  name: string;
  sets: SetDuration[];
  totalSecs: number;
}

function calcExerciseDurations(exercises: StrictExercise[]): ExerciseDuration[] {
  return exercises
    .filter((ex) => ex.type === 'duration')
    .map((ex) => {
      const sets: SetDuration[] = ex.sets
        .filter((s) => s.duration)
        .map((set, i) => {
          const secs = parseDurationSecs(set.duration!);
          return { index: i + 1, label: formatDurationLabel(set.duration!), secs };
        });
      return {
        id: ex.id,
        name: ex.name,
        sets,
        totalSecs: sets.reduce((sum, s) => sum + s.secs, 0),
      };
    })
    .filter((ex) => ex.totalSecs > 0);
}

// ─── Cards ───────────────────────────────────────────────────────────────────

function WeightCard({ ex }: { ex: ExerciseLoad }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900 text-sm text-left">{ex.name}</span>
        <div className="flex items-center gap-2">
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-1 rounded-full">
            {ex.total} kg
          </span>
        </div>
      </button>
      {open && (
        <div className="border-t border-gray-100">
          {ex.sets.map((set) => (
            <div
              key={set.index}
              className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 last:border-b-0"
            >
              <span className="text-sm text-gray-500">
                Série {set.index} · {set.reps} reps × {set.weight} kg
              </span>
              <span className="text-sm font-medium text-gray-900">{set.total} kg</span>
            </div>
          ))}
          <div className="flex justify-end px-4 py-3">
            <span className="text-sm font-bold text-gray-900">Total: {ex.total} kg</span>
          </div>
        </div>
      )}
    </div>
  );
}

function DurationCard({ ex }: { ex: ExerciseDuration }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900 text-sm text-left">{ex.name}</span>
        <div className="flex items-center gap-2">
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            {formatSecs(ex.totalSecs)}
          </span>
        </div>
      </button>
      {open && (
        <div className="border-t border-gray-100">
          {ex.sets.map((set) => (
            <div
              key={set.index}
              className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 last:border-b-0"
            >
              <span className="text-sm text-gray-500">Série {set.index}</span>
              <span className="text-sm font-medium text-gray-900">{set.label}</span>
            </div>
          ))}
          <div className="flex justify-end px-4 py-3">
            <span className="text-sm font-bold text-gray-900">
              Total: {formatSecs(ex.totalSecs)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export function LoadPreviewModal({
  exercises,
  onClose,
}: {
  exercises: StrictExercise[];
  onClose: () => void;
}) {
  const exerciseLoads = useMemo(() => calcExerciseLoads(exercises), [exercises]);
  const exerciseDurations = useMemo(() => calcExerciseDurations(exercises), [exercises]);

  const grandTotalKg = useMemo(
    () => exerciseLoads.reduce((sum, ex) => sum + ex.total, 0),
    [exerciseLoads],
  );
  const grandTotalSecs = useMemo(
    () => exerciseDurations.reduce((sum, ex) => sum + ex.totalSecs, 0),
    [exerciseDurations],
  );

  const hasWeight = exerciseLoads.length > 0;
  const hasTime = exerciseDurations.length > 0;
  const hasAny = hasWeight || hasTime;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-xl sm:rounded-2xl sm:max-h-[90vh] h-full sm:h-auto flex flex-col shadow-xl">

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Preview de Carga</h2>
            <p className="text-sm text-gray-500 mt-0.5">Estimativa de carga calculada</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors mt-0.5">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-4">

          {/* Summary cards */}
          <div className={hasWeight && hasTime ? 'grid grid-cols-2 gap-3' : ''}>
            {hasWeight && (
              <div className="border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                  <TrendingUp size={14} />
                  Carga total
                </div>
                <div>
                  <span className="text-3xl font-bold text-gray-900">{grandTotalKg}</span>
                  <span className="text-base text-gray-500 ml-1">kg</span>
                </div>
                <span className="self-start bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {exerciseLoads.length} {exerciseLoads.length === 1 ? 'exercício' : 'exercícios'}
                </span>
              </div>
            )}

            {hasTime && (
              <div className="border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                  <Clock size={14} />
                  Tempo total
                </div>
                <div>
                  <span className="text-3xl font-bold text-gray-900">
                    {formatSecs(grandTotalSecs)}
                  </span>
                </div>
                <span className="self-start bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {exerciseDurations.length} {exerciseDurations.length === 1 ? 'exercício' : 'exercícios'}
                </span>
              </div>
            )}
          </div>

          {/* Breakdown */}
          {hasAny ? (
            <>
              <p className="text-sm text-gray-500">Detalhamento por exercício</p>
              <div className="space-y-3">
                {exerciseLoads.map((ex) => <WeightCard key={ex.id} ex={ex} />)}
                {exerciseDurations.map((ex) => <DurationCard key={ex.id} ex={ex} />)}
              </div>
            </>
          ) : (
            <p className="text-center text-gray-400 py-8 text-sm">
              Nenhum exercício com carga ou duração configurada.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
