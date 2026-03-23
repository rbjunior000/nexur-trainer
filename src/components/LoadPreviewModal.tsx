import { useState, useMemo } from 'react';
import { X, TrendingUp, Clock, ChevronUp, ChevronDown, CornerDownRight } from 'lucide-react';
import type { StrictExercise } from '../types/workout';
import { WorkoutSummary } from './WorkoutSummary';

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

interface DropLoad {
  index: number;
  reps: number;
  weight: number;
  total: number;
}

interface SetLoad {
  index: number;
  reps: number;
  weight: number;
  total: number;
  isDropset: boolean;
  drops: DropLoad[];
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
        const mainTotal = reps * weight;
        const drops: DropLoad[] = set.type === 'dropset'
          ? (set.dropsets ?? []).map((drop, di) => {
              const dr = ex.repsMode === 'range' && drop.repsRange
                ? Math.round((drop.repsRange[0] + drop.repsRange[1]) / 2)
                : (drop.reps ?? 0);
              const dw = drop.weight ?? 0;
              return { index: di + 1, reps: dr, weight: dw, total: dr * dw };
            })
          : [];
        const dropsTotal = drops.reduce((s, d) => s + d.total, 0);
        return { index: i + 1, reps, weight, total: mainTotal + dropsTotal, isDropset: set.type === 'dropset', drops };
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
            <div key={set.index} className="border-b border-gray-100 last:border-b-0">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-gray-500">
                  {set.isDropset
                    ? `Série ${set.index} · Drop Set`
                    : `Série ${set.index} · ${set.reps} reps × ${set.weight} kg`}
                </span>
                <span className="text-sm font-medium text-gray-900">{set.total} kg</span>
              </div>
              {set.isDropset && (
                <>
                  <div className="flex items-center justify-between px-4 py-1.5 bg-orange-50">
                    <span className="text-xs text-orange-500 flex items-center gap-1.5">
                      <CornerDownRight size={11} />
                      Série principal · {set.reps} reps × {set.weight} kg
                    </span>
                    <span className="text-xs font-medium text-orange-700">{set.reps * set.weight} kg</span>
                  </div>
                  {set.drops.map((drop) => (
                    <div key={drop.index} className="flex items-center justify-between px-4 py-1.5 bg-orange-50">
                      <span className="text-xs text-orange-500 flex items-center gap-1.5">
                        <CornerDownRight size={11} />
                        Drop {drop.index} · {drop.reps} reps × {drop.weight} kg
                      </span>
                      <span className="text-xs font-medium text-orange-700">{drop.total} kg</span>
                    </div>
                  ))}
                </>
              )}
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

function CargaContent({ exercises }: { exercises: StrictExercise[] }) {
  const exerciseLoads    = useMemo(() => calcExerciseLoads(exercises),     [exercises]);
  const exerciseDurations = useMemo(() => calcExerciseDurations(exercises), [exercises]);
  const grandTotalKg   = useMemo(() => exerciseLoads.reduce((s, e) => s + e.total, 0),        [exerciseLoads]);
  const grandTotalSecs = useMemo(() => exerciseDurations.reduce((s, e) => s + e.totalSecs, 0), [exerciseDurations]);

  const hasWeight = exerciseLoads.length > 0;
  const hasTime   = exerciseDurations.length > 0;
  const hasAny    = hasWeight || hasTime;

  return (
    <div className="space-y-4">
      <div className={hasWeight && hasTime ? 'grid grid-cols-2 gap-3' : ''}>
        {hasWeight && (
          <div className="border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-gray-500 text-sm">
              <TrendingUp size={14} /> Carga total
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
              <Clock size={14} /> Tempo total
            </div>
            <div>
              <span className="text-3xl font-bold text-gray-900">{formatSecs(grandTotalSecs)}</span>
            </div>
            <span className="self-start bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              {exerciseDurations.length} {exerciseDurations.length === 1 ? 'exercício' : 'exercícios'}
            </span>
          </div>
        )}
      </div>

      {hasAny ? (
        <>
          <p className="text-sm text-gray-500">Detalhamento por exercício</p>
          <div className="space-y-3">
            {exerciseLoads.map((ex)       => <WeightCard   key={ex.id} ex={ex} />)}
            {exerciseDurations.map((ex)   => <DurationCard key={ex.id} ex={ex} />)}
          </div>
        </>
      ) : (
        <p className="text-center text-gray-400 py-8 text-sm">
          Nenhum exercício com carga ou duração configurada.
        </p>
      )}
    </div>
  );
}

export function LoadPreviewModal({
  exercises,
  onClose,
}: {
  exercises: StrictExercise[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'resumo' | 'carga'>('resumo');

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-xl sm:rounded-2xl sm:max-h-[90vh] h-full sm:h-auto flex flex-col shadow-xl">

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-0 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Resumo do Treino</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors mt-0.5">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 mt-3 px-5 flex-shrink-0">
          {(['resumo', 'carga'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`mr-6 pb-2.5 text-sm font-semibold capitalize transition-colors border-b-2 ${
                tab === t
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              {t === 'resumo' ? 'Resumo' : 'Carga'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-5">
          {tab === 'resumo' ? (
            <WorkoutSummary exercises={exercises} />
          ) : (
            <CargaContent exercises={exercises} />
          )}
        </div>
      </div>
    </div>
  );
}
