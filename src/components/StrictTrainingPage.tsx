import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  BarChart3,
  Pencil,
  Trophy,
  X,
  SkipForward,
  List,
  Maximize2,
  LayoutList,
  Image,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StrictExercise } from '../types/workout';
import type { Media } from '../types/media';
import { getMediaPreviewUrl } from '../types/media';
import { MediaPreview } from './MediaPreview';
import { MediaCarousel } from './MediaCarousel';
import { formatTime, formatElapsed, parseDurationToSeconds } from '../utils/formatTime';

// --- Internal types ---
interface TrainingSet {
  id: string;
  reps?: number;
  weight?: number;
  duration?: string;
  distance?: number;
  rest: number;
  completed: boolean;
}

interface TrainingExercise {
  id: string;
  name: string;
  media1: Media | null;
  media2: Media | null;
  type: string;
  sets: TrainingSet[];
  notes: string;
  supersetId?: string;
  isRest?: boolean;
  restDuration?: number;
  cor?: string;
}

interface SupersetGroup {
  id: string;
  label: string;
  exerciseIds: string[];
  rounds: number;
  color: string;
}

interface FocusStep {
  exerciseIndex: number;
  setIndex: number;
  restAfterStep: number;
  isRestStep?: boolean;
  restStepDuration?: number;
  isSupersetRest?: boolean;
}

type Phase = 'work' | 'rest';

// --- Conversion ---
function toTrainingExercise(ex: StrictExercise, supersetId?: string): TrainingExercise {
  if (ex.type === 'rest') {
    return {
      id: ex.id,
      name: 'Descanso',
      media1: null,
      media2: null,
      type: 'rest',
      notes: '',
      sets: [],
      isRest: true,
      restDuration: ex.restDuration ?? 0,
    };
  }
  return {
    id: ex.id,
    name: ex.name,
    media1: ex.media1,
    media2: ex.media2,
    type: ex.type,
    notes: ex.notes,
    cor: ex.cor,
    supersetId,
    sets: ex.sets.map((s) => ({
      id: s.id,
      reps: s.reps,
      weight: s.weight,
      duration: s.duration,
      distance: s.distance,
      rest: s.rest,
      completed: false,
    })),
  };
}

function buildSupersetGroups(exercises: StrictExercise[]): {
  trainingExercises: TrainingExercise[];
  supersets: SupersetGroup[];
} {
  const trainingExercises: TrainingExercise[] = [];
  const supersets: SupersetGroup[] = [];
  let ssCounter = 0;
  let i = 0;

  while (i < exercises.length) {
    if (exercises[i].type === 'rest') {
      trainingExercises.push(toTrainingExercise(exercises[i]));
      i++;
      continue;
    }
    if (exercises[i].supersetWithNext) {
      ssCounter++;
      const ssId = `ss${ssCounter}`;
      const ssLabel = `Superset ${String.fromCharCode(64 + ssCounter)}`;
      const ids: string[] = [];
      let j = i;
      while (j < exercises.length && exercises[j].supersetWithNext && exercises[j].type !== 'rest') {
        const te = toTrainingExercise(exercises[j], ssId);
        trainingExercises.push(te);
        ids.push(te.id);
        j++;
      }
      if (j < exercises.length && exercises[j].type !== 'rest') {
        const te = toTrainingExercise(exercises[j], ssId);
        trainingExercises.push(te);
        ids.push(te.id);
        j++;
      }
      const maxSets = Math.max(...ids.map((id) => {
        const ex = trainingExercises.find((e) => e.id === id);
        return ex ? ex.sets.length : 0;
      }));
      const ssColor = exercises[i].cor && exercises[i].cor !== '#f1f1f1' ? exercises[i].cor! : '#FBBF24';
      supersets.push({ id: ssId, label: ssLabel, exerciseIds: ids, rounds: maxSets, color: ssColor });
      i = j;
    } else {
      trainingExercises.push(toTrainingExercise(exercises[i]));
      i++;
    }
  }
  return { trainingExercises, supersets };
}

// --- Build linear focus-step sequence ---
function buildFocusSteps(
  exercises: TrainingExercise[],
  supersets: SupersetGroup[]
): FocusStep[] {
  const steps: FocusStep[] = [];
  const processed = new Set<number>();

  for (let i = 0; i < exercises.length; i++) {
    if (processed.has(i)) continue;
    const ex = exercises[i];

    if (ex.isRest) {
      processed.add(i);
      if (ex.restDuration && ex.restDuration > 0) {
        steps.push({
          exerciseIndex: i,
          setIndex: 0,
          restAfterStep: 0,
          isRestStep: true,
          restStepDuration: ex.restDuration,
        });
      }
      continue;
    }

    const ss = supersets.find((s) => s.exerciseIds.includes(ex.id));

    if (ss) {
      const ssIndices = ss.exerciseIds
        .map((id) => exercises.findIndex((e) => e.id === id))
        .filter((idx) => idx >= 0);
      ssIndices.forEach((idx) => processed.add(idx));

      const maxSets = Math.max(...ssIndices.map((idx) => exercises[idx].sets.length));
      for (let setIdx = 0; setIdx < maxSets; setIdx++) {
        for (let k = 0; k < ssIndices.length; k++) {
          const exIdx = ssIndices[k];
          if (setIdx >= exercises[exIdx].sets.length) continue;

          const isLastInRound = k === ssIndices.length - 1;
          // Rest only after the last exercise of each round; use its configured set rest directly
          const restAfter = isLastInRound ? exercises[exIdx].sets[setIdx].rest : 0;

          steps.push({
            exerciseIndex: exIdx,
            setIndex: setIdx,
            restAfterStep: restAfter,
            isSupersetRest: isLastInRound && restAfter > 0,
          });
        }
      }
    } else {
      processed.add(i);
      for (let setIdx = 0; setIdx < ex.sets.length; setIdx++) {
        const isLastSet = setIdx === ex.sets.length - 1;
        const restAfter = isLastSet ? 0 : ex.sets[setIdx].rest;
        steps.push({ exerciseIndex: i, setIndex: setIdx, restAfterStep: restAfter });
      }
    }
  }
  return steps;
}

// --- Build ordered exercise groups for display ---
type DisplayGroup =
  | { type: 'single'; exerciseIndex: number }
  | { type: 'superset'; superset: SupersetGroup; exerciseIndices: number[] }
  | { type: 'rest'; exerciseIndex: number };

function buildDisplayGroups(
  exercises: TrainingExercise[],
  supersets: SupersetGroup[]
): DisplayGroup[] {
  const groups: DisplayGroup[] = [];
  const processed = new Set<number>();

  exercises.forEach((ex, idx) => {
    if (processed.has(idx)) return;
    if (ex.isRest) {
      processed.add(idx);
      groups.push({ type: 'rest', exerciseIndex: idx });
      return;
    }
    const ss = supersets.find((s) => s.exerciseIds.includes(ex.id));
    if (ss) {
      const indices = ss.exerciseIds
        .map((id) => exercises.findIndex((e) => e.id === id))
        .filter((i) => i >= 0);
      indices.forEach((i) => processed.add(i));
      groups.push({ type: 'superset', superset: ss, exerciseIndices: indices });
    } else {
      processed.add(idx);
      groups.push({ type: 'single', exerciseIndex: idx });
    }
  });
  return groups;
}

// --- Format rest display ---
function formatRest(seconds: number): string {
  if (seconds <= 0) return 'OFF';
  if (seconds >= 60) return `${Math.floor(seconds / 60)}min`;
  return `${seconds}s`;
}

// --- Set Table Row ---
function SetRow({
  set,
  setIndex,
  exerciseType,
  isCurrent,
  showWeight,
  phase,
  countdown,
  onToggle,
  onUpdateField,
}: {
  set: TrainingSet;
  setIndex: number;
  exerciseType: string;
  isCurrent: boolean;
  showWeight: boolean;
  phase: Phase;
  countdown: number | null;
  onToggle: () => void;
  onUpdateField: (field: keyof TrainingSet, value: number | string) => void;
}) {
  const isCountingRest = isCurrent && set.completed && phase === 'rest' && countdown !== null && countdown > 0;

  return (
    <tr className={`border-b border-gray-800/50 transition-colors ${isCurrent ? 'bg-gray-800/60' : ''}`}>

      {exerciseType === 'weight_reps' && (
        <>
          <td className="py-2.5 px-2">
            <input
              type="number"
              value={set.weight ?? 0}
              onChange={(e) => onUpdateField('weight', Number(e.target.value) || 0)}
              className="w-16 bg-gray-800 text-white text-sm font-semibold rounded-lg px-2 py-1 text-center border border-gray-700 focus:border-yellow-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </td>
          <td className="py-2.5 px-2">
            <input
              type="number"
              value={set.reps ?? 0}
              onChange={(e) => onUpdateField('reps', Number(e.target.value) || 0)}
              className="w-14 bg-gray-800 text-white text-sm font-semibold rounded-lg px-2 py-1 text-center border border-gray-700 focus:border-yellow-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </td>
        </>
      )}

      {exerciseType === 'duration' && (
        <>
          {showWeight && (
            <td className="py-2.5 px-2">
              <input
                type="number"
                value={set.weight ?? 0}
                onChange={(e) => onUpdateField('weight', Number(e.target.value) || 0)}
                className="w-16 bg-gray-800 text-white text-sm font-semibold rounded-lg px-2 py-1 text-center border border-gray-700 focus:border-yellow-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </td>
          )}
          <td className="py-2.5 px-2">
            {isCurrent && phase === 'work' && countdown !== null
              ? <span className="text-yellow-400 text-sm font-bold animate-pulse tabular-nums">{formatTime(countdown)}</span>
              : <span className="text-white text-sm font-semibold">{set.duration || '00:00'}</span>
            }
          </td>
        </>
      )}

      {exerciseType === 'distance' && (
        <td className="py-2.5 px-2">
          <input
            type="number"
            value={set.distance ?? 0}
            onChange={(e) => onUpdateField('distance', Number(e.target.value) || 0)}
            className="w-16 bg-gray-800 text-white text-sm font-semibold rounded-lg px-2 py-1 text-center border border-gray-700 focus:border-yellow-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </td>
      )}

      <td className="py-2.5 px-2">
        <span className={`flex items-center gap-1 text-sm ${isCountingRest ? 'text-yellow-400 animate-pulse font-bold' : 'text-gray-400'}`}>
          <Clock size={12} />
          {isCountingRest ? formatTime(countdown!) : formatRest(set.rest)}
        </span>
      </td>

      <td className="py-2.5 pl-2 pr-3">
        <button
          onClick={onToggle}
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
            set.completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-600 text-gray-500 hover:border-gray-400'
          }`}
        >
          {set.completed
            ? <Check size={14} strokeWidth={3} />
            : <span className="text-[11px] font-bold tabular-nums">{setIndex + 1}</span>
          }
        </button>
      </td>
    </tr>
  );
}

// --- Exercise Card ---
function ExerciseCard({
  exercise,
  exerciseIndex,
  currentExerciseIndex,
  currentSetIndex,
  phase,
  countdown,
  onToggleSet,
  onUpdateSetField,
}: {
  exercise: TrainingExercise;
  exerciseIndex: number;
  currentExerciseIndex: number;
  currentSetIndex: number;
  phase: Phase;
  countdown: number | null;
  onToggleSet: (exerciseIndex: number, setIndex: number) => void;
  onUpdateSetField: (exerciseIndex: number, setIndex: number, field: keyof TrainingSet, value: number | string) => void;
}) {
  const isCurrent = exerciseIndex === currentExerciseIndex;
  const hasWeight = exercise.type === 'duration' && exercise.sets.some((s) => (s.weight ?? 0) > 0);

  const colHeaders = (() => {
    switch (exercise.type) {
      case 'weight_reps': return ['Carga', 'Reps', 'Inter', ''];
      case 'duration': return hasWeight ? ['Carga', 'Duração', 'Inter', ''] : ['Duração', 'Inter', ''];
      case 'distance': return ['Distância', 'Inter', ''];
      default: return ['#', 'Carga', 'Reps', 'Inter', ''];
    }
  })();

  const corStyle = !exercise.supersetId && exercise.cor && exercise.cor !== '#f1f1f1'
    ? { borderLeft: `4px solid ${exercise.cor}` }
    : undefined;

  return (
    <div
      className={`bg-gray-900 rounded-2xl overflow-hidden transition-all ${isCurrent ? 'ring-2 ring-yellow-400/50' : ''}`}
      style={corStyle}
    >
      {/* Media carousel */}
      {(exercise.media1 || exercise.media2) && (
        <MediaCarousel items={[exercise.media1, exercise.media2]} alt={exercise.name} playable />
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-lg truncate flex-1">{exercise.name}</h3>
        </div>

        {/* Set Table */}
        <table className="w-full">
          <thead>
            <tr className="text-gray-500 text-xs uppercase">
              {colHeaders.map((h, i) => (
                <th key={i} className={`py-1.5 font-semibold text-left ${i === 0 ? 'pl-3 px-2' : i === colHeaders.length - 1 ? 'pl-2 pr-3 w-10' : 'px-2'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exercise.sets.map((set, si) => (
              <SetRow
                key={set.id}
                set={set}
                setIndex={si}
                exerciseType={exercise.type}
                isCurrent={isCurrent && si === currentSetIndex}
                showWeight={exercise.type !== 'duration' || hasWeight}
                phase={phase}
                countdown={isCurrent && si === currentSetIndex ? countdown : null}
                onToggle={() => onToggleSet(exerciseIndex, si)}
                onUpdateField={(field, value) => onUpdateSetField(exerciseIndex, si, field, value)}
              />
            ))}
          </tbody>
        </table>

        {/* Notes */}
        {exercise.notes && (
          <p className="mt-3 text-sm text-gray-400">
            <span className="text-gray-500 font-medium">Nota: </span>{exercise.notes}
          </p>
        )}
      </div>
    </div>
  );
}

// --- Superset Card (Stacked) ---
function SupersetCard({
  superset,
  exercises,
  exerciseIndices,
  currentExerciseIndex,
  currentSetIndex,
  phase,
  countdown,
  onToggleSet,
  onUpdateSetField,
  onExerciseRef,
}: {
  superset: SupersetGroup;
  exercises: TrainingExercise[];
  exerciseIndices: number[];
  currentExerciseIndex: number;
  currentSetIndex: number;
  phase: Phase;
  countdown: number | null;
  onToggleSet: (exerciseIndex: number, setIndex: number) => void;
  onUpdateSetField: (exerciseIndex: number, setIndex: number, field: keyof TrainingSet, value: number | string) => void;
  onExerciseRef: (exIdx: number, el: HTMLDivElement | null) => void;
}) {
  return (
    <div className="relative flex">
      {/* Superset side bar */}
      <div className="flex flex-col items-center mr-3 pt-1">
        <div className="w-0.5 flex-1 rounded-full" style={{ backgroundColor: superset.color }} />
        <div className="w-0.5 flex-1 rounded-full" style={{ backgroundColor: superset.color }} />
      </div>

      {/* Stacked exercises */}
      <div className="flex-1 flex flex-col gap-3">
        {/* Superset label row */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-gray-900 text-xs font-bold rounded-md" style={{ backgroundColor: superset.color }}>
            Superset
          </span>
          <span className="text-gray-400 text-sm font-medium">
            {superset.rounds} Ciclos
          </span>
        </div>

        {exerciseIndices.map((exIdx) => {
          const ex = exercises[exIdx];
          return (
            <div key={ex.id} ref={(el) => onExerciseRef(exIdx, el)}>
              <ExerciseCard
                exercise={ex}
                exerciseIndex={exIdx}
                currentExerciseIndex={currentExerciseIndex}
                currentSetIndex={currentSetIndex}
                phase={phase}
                countdown={countdown}
                onToggleSet={onToggleSet}
                onUpdateSetField={onUpdateSetField}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Rest Block Card ---
function RestBlockCard({
  exercise,
  isActive,
  countdown,
}: {
  exercise: TrainingExercise;
  isActive: boolean;
  countdown: number | null;
}) {
  return (
    <div className={`bg-gray-900 rounded-2xl p-6 flex items-center justify-center gap-3 transition-all ${isActive ? 'ring-2 ring-yellow-400/50' : ''}`}>
      <Clock size={20} className={isActive ? 'text-yellow-400' : 'text-gray-500'} />
      <span className={`font-semibold text-lg ${isActive ? 'text-yellow-400' : 'text-gray-400'}`}>
        {isActive && countdown !== null
          ? `Descanso — ${formatTime(countdown)}`
          : `Descanso — ${formatRest(exercise.restDuration ?? 0)}`}
      </span>
    </div>
  );
}

// --- Compact helpers ---
function summarizeSets(exercise: TrainingExercise): string {
  const count = exercise.sets.length;
  if (count === 0) return '';
  const first = exercise.sets[0];
  if (exercise.type === 'weight_reps') {
    const reps = first.reps ?? 0;
    const weight = first.weight ?? 0;
    return weight > 0 ? `${count}x${reps} — ${weight}kg` : `${count}x${reps}`;
  }
  if (exercise.type === 'duration') {
    return `${count}x ${first.duration || '00:00'}`;
  }
  if (exercise.type === 'distance') {
    const dist = first.distance ?? 0;
    return `${count}x ${dist}m`;
  }
  return `${count} séries`;
}

function CompactExerciseRow({
  exercise,
  exerciseIndex,
  isCurrent,
  onTap,
}: {
  exercise: TrainingExercise;
  exerciseIndex: number;
  isCurrent: boolean;
  onTap?: (idx: number) => void;
}) {
  const completedCount = exercise.sets.filter((s) => s.completed).length;
  const total = exercise.sets.length;
  const allDone = completedCount === total && total > 0;
  const media = exercise.media1 ?? exercise.media2;
  const previewUrl = media ? getMediaPreviewUrl(media) : null;
  const summary = summarizeSets(exercise);
  const corColor = !exercise.supersetId && exercise.cor && exercise.cor !== '#f1f1f1' ? exercise.cor : '#6b7280';

  return (
    <button
      className={`w-full flex items-center bg-gray-900 rounded-xl overflow-hidden transition-all ${isCurrent ? 'ring-2 ring-yellow-400/60' : ''}`}
      onClick={() => onTap?.(exerciseIndex)}
    >
      {/* Color bar */}
      <div className="w-1 self-stretch flex-shrink-0" style={{ backgroundColor: corColor }} />

      {/* Thumbnail */}
      <div className="w-16 h-16 flex-shrink-0 bg-gray-800 flex items-center justify-center overflow-hidden">
        {previewUrl ? (
          <img src={previewUrl} alt={exercise.name} className="w-full h-full object-cover" />
        ) : (
          <Image size={20} className="text-gray-600" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 px-3 text-left min-w-0">
        <p className="text-white text-sm font-semibold truncate">{exercise.name}</p>
        {summary && <p className="text-gray-400 text-xs mt-0.5">{summary}</p>}
      </div>

      {/* Completion badge */}
      <div className={`w-8 h-8 rounded-full flex-shrink-0 mr-3 flex items-center justify-center border-2 transition-all ${
        allDone
          ? 'bg-green-500 border-green-500 text-white'
          : isCurrent
          ? 'border-yellow-400 text-gray-500'
          : 'border-gray-700 text-gray-500'
      }`}>
        {allDone ? (
          <Check size={14} strokeWidth={3} />
        ) : (
          <span className="text-[10px] font-bold tabular-nums">{completedCount}/{total}</span>
        )}
      </div>
    </button>
  );
}

function CompactView({
  exercises,
  displayGroups,
  highlightExerciseIndex,
  onScrollTo,
}: {
  exercises: TrainingExercise[];
  displayGroups: DisplayGroup[];
  highlightExerciseIndex: number;
  onScrollTo: (idx: number) => void;
}) {
  return (
    <div className="pb-4 px-4 pt-4 space-y-2">
      {displayGroups.map((group, groupIdx) => {
        if (group.type === 'rest') {
          const ex = exercises[group.exerciseIndex];
          return (
            <div key={`rest-${group.exerciseIndex}-${groupIdx}`} className="flex items-center gap-3 bg-gray-900 rounded-xl px-4 py-3">
              <Clock size={14} className="text-gray-500 flex-shrink-0" />
              <span className="text-gray-400 text-sm">Descanso — {formatRest(ex.restDuration ?? 0)}</span>
            </div>
          );
        }

        if (group.type === 'superset') {
          return (
            <div key={group.superset.id} className="relative flex">
              <div className="w-0.5 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: group.superset.color }} />
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2 px-1 pb-0.5">
                  <span className="px-2 py-0.5 text-gray-900 text-[10px] font-bold rounded-md" style={{ backgroundColor: group.superset.color }}>Superset</span>
                  <span className="text-gray-400 text-xs">{group.superset.rounds} ciclos</span>
                </div>
                {group.exerciseIndices.map((exIdx) => (
                  <CompactExerciseRow
                    key={exercises[exIdx].id}
                    exercise={exercises[exIdx]}
                    exerciseIndex={exIdx}
                    isCurrent={highlightExerciseIndex === exIdx}
                    onTap={onScrollTo}
                  />
                ))}
              </div>
            </div>
          );
        }

        return (
          <CompactExerciseRow
            key={exercises[group.exerciseIndex].id}
            exercise={exercises[group.exerciseIndex]}
            exerciseIndex={group.exerciseIndex}
            isCurrent={highlightExerciseIndex === group.exerciseIndex}
            onTap={onScrollTo}
          />
        );
      })}
    </div>
  );
}

// --- Summary Modal (dark version) ---
function SummaryModal({
  exercises,
  completedSetIds,
  elapsed,
  onClose,
}: {
  exercises: TrainingExercise[];
  completedSetIds: Set<string>;
  elapsed: number;
  onClose: () => void;
}) {
  const nonRestExercises = exercises.filter((ex) => !ex.isRest);
  const totalSets = nonRestExercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedCount = completedSetIds.size;
  const totalVolume = nonRestExercises.reduce(
    (acc, ex) =>
      acc +
      ex.sets
        .filter((s) => completedSetIds.has(s.id))
        .reduce((a, s) => a + (s.weight || 0) * (s.reps || 0), 0),
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl border border-gray-800"
      >
        <div className="w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy size={32} className="text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Treino concluído!</h2>
        <p className="text-gray-500 text-sm mb-8">Parabéns pelo treino de hoje</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-3">
            <div className="text-lg font-bold text-white">{formatElapsed(elapsed)}</div>
            <div className="text-[10px] text-gray-500 uppercase font-bold">Duração</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3">
            <div className="text-lg font-bold text-white">{completedCount}/{totalSets}</div>
            <div className="text-[10px] text-gray-500 uppercase font-bold">Séries</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3">
            <div className="text-lg font-bold text-white">
              {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${totalVolume}kg`}
            </div>
            <div className="text-[10px] text-gray-500 uppercase font-bold">Volume</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 transition-colors"
        >
          Finalizar
        </button>
      </motion.div>
    </motion.div>
  );
}

// --- Guided View (one exercise at a time) ---
function GuidedView({
  exercises,
  supersets,
  focusSteps,
  currentStepIdx,
  phase,
  countdown,
  nextStepLabel,
}: {
  exercises: TrainingExercise[];
  supersets: SupersetGroup[];
  focusSteps: FocusStep[];
  currentStepIdx: number;
  phase: Phase;
  countdown: number | null;
  nextStepLabel: string;
}) {
  const currentStep = focusSteps[currentStepIdx];
  if (!currentStep) return null;

  const currentExercise = exercises[currentStep.exerciseIndex];
  const currentSet = currentExercise?.sets[currentStep.setIndex];
  const ss = currentExercise
    ? supersets.find((s) => s.exerciseIds.includes(currentExercise.id))
    : undefined;
  const posInSS = ss && currentExercise ? ss.exerciseIds.indexOf(currentExercise.id) + 1 : 0;
  const totalInSS = ss ? ss.exerciseIds.length : 0;
  const setIdx = currentStep.setIndex;
  const totalSets = currentExercise?.sets.length ?? 0;

  // Duration countdown screen
  if (phase === 'work' && countdown !== null) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 px-6 py-8">
        <div className="w-24 h-24 rounded-full bg-yellow-400/10 flex items-center justify-center">
          <Clock size={40} className="text-yellow-400" />
        </div>
        <p className="text-gray-400 text-lg font-semibold uppercase tracking-widest">Duração</p>
        <p className="text-7xl font-bold text-white tabular-nums">{formatTime(countdown)}</p>
        {currentExercise && (
          <p className="text-gray-500 text-sm font-medium">{currentExercise.name}</p>
        )}
      </div>
    );
  }

  // Rest screen
  if (phase === 'rest') {
    const restDisplay = countdown ?? currentStep.restStepDuration ?? 0;
    const isSupersetRest = currentStep.isSupersetRest === true;
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 px-6 py-8">
        <div className="w-24 h-24 rounded-full bg-yellow-400/10 flex items-center justify-center">
          <Clock size={40} className="text-yellow-400" />
        </div>
        {isSupersetRest && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 rounded-full text-[11px] font-bold uppercase tracking-wider">
            Descanso entre exercícios
          </span>
        )}
        <p className="text-gray-400 text-lg font-semibold uppercase tracking-widest">Descanso</p>
        <p className="text-7xl font-bold text-white tabular-nums">{formatTime(restDisplay)}</p>
        {nextStepLabel && (
          <p className="text-gray-500 text-sm">A seguir: {nextStepLabel}</p>
        )}
      </div>
    );
  }

  if (!currentExercise || !currentSet) return null;

  const hasWeight = currentExercise.type === 'duration' && (currentSet.weight ?? 0) > 0;

  return (
    <div className="flex flex-col">
      {/* Title section */}
      <div className="px-4 py-4">
        {ss && (
          <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">
            Superset · Exercício {posInSS} de {totalInSS}
          </p>
        )}
        <p className="text-yellow-400 text-2xl font-bold">
          {ss
            ? `Round ${setIdx + 1} de ${ss.rounds}`
            : `Série ${setIdx + 1} de ${totalSets}`}
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-800" />

      {/* Media carousel */}
      {currentExercise.media1 || currentExercise.media2 ? (
        <MediaCarousel items={[currentExercise.media1, currentExercise.media2]} alt={currentExercise.name} playable />
      ) : (
        <div className="aspect-video bg-gray-900 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
            <Play size={28} className="text-gray-600 ml-0.5" />
          </div>
        </div>
      )}

      {/* Info section */}
      <div className="bg-gray-900 px-4 pt-5 pb-6 space-y-5">
        <h2 className="text-2xl font-bold text-white">{currentExercise.name}</h2>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {currentExercise.type === 'weight_reps' && (
            <>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Carga</p>
                <p className="text-white font-bold text-lg">{currentSet.weight ?? 0} kg</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Reps</p>
                <p className="text-yellow-400 font-bold text-lg">{currentSet.reps ?? 0}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Inter</p>
                <p className="text-white font-bold text-lg">{formatRest(currentSet.rest)}</p>
              </div>
            </>
          )}

          {currentExercise.type === 'duration' && (
            <>
              {hasWeight && (
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Carga</p>
                  <p className="text-white font-bold text-lg">{currentSet.weight ?? 0} kg</p>
                </div>
              )}
              <div className={`bg-gray-800 rounded-xl p-3 text-center ${!hasWeight ? 'col-span-2' : ''}`}>
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Duração</p>
                <p className="text-yellow-400 font-bold text-lg">{currentSet.duration || '00:00'}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Inter</p>
                <p className="text-white font-bold text-lg">{formatRest(currentSet.rest)}</p>
              </div>
            </>
          )}

          {currentExercise.type === 'distance' && (
            <>
              <div className="bg-gray-800 rounded-xl p-3 text-center col-span-2">
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Distância</p>
                <p className="text-yellow-400 font-bold text-lg">{currentSet.distance ?? 0} m</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Inter</p>
                <p className="text-white font-bold text-lg">{formatRest(currentSet.rest)}</p>
              </div>
            </>
          )}
        </div>

        {/* Notes */}
        {currentExercise.notes && (
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Notas</p>
            <p className="text-gray-300 text-sm">{currentExercise.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== Main Page V2 ==========
export function StrictTrainingPage({
  sourceExercises,
  onBack,
  workoutName = 'Treino',
}: {
  sourceExercises: StrictExercise[];
  onBack: () => void;
  workoutName?: string;
}) {
  const { trainingExercises: initialExercises, supersets } = useMemo(
    () => buildSupersetGroups(sourceExercises),
    [sourceExercises]
  );

  const [exercises, setExercises] = useState(initialExercises);
  const displayGroups = useMemo(() => buildDisplayGroups(exercises, supersets), [exercises, supersets]);

  // Build linear focus-step sequence
  const focusSteps = useMemo(
    () => buildFocusSteps(exercises, supersets),
    [exercises, supersets]
  );

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [completedSetIds, setCompletedSetIds] = useState<Set<string>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [phase, setPhase] = useState<Phase>('work');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'guided' | 'compact'>('list');
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);

  const isResting = phase === 'rest';
  const isWorkCountdown = phase === 'work' && countdown !== null;

  // Refs
  const cardRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const exerciseCardRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const exercisesRef = useRef(exercises);
  exercisesRef.current = exercises;
  const focusStepsRef = useRef(focusSteps);
  focusStepsRef.current = focusSteps;
  const stateRef = useRef({ currentStepIdx, focusSteps });
  stateRef.current = { currentStepIdx, focusSteps };

  // Current step data
  const currentStep = focusSteps[currentStepIdx];
  const currentExercise = currentStep ? exercises[currentStep.exerciseIndex] : null;
  const currentSet = currentExercise?.sets[currentStep?.setIndex ?? 0] ?? null;
  const isOnRestStep = currentStep?.isRestStep === true;

  // Elapsed timer
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  // Effect A — Single countdown ticker
  useEffect(() => {
    if (!isRunning || countdown === null || countdown <= 0) return;
    const id = setInterval(() => setCountdown((p) => (p !== null && p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [isRunning, countdown]);

  // Effect B — Step entry: set phase and countdown based on what the step requires
  useEffect(() => {
    const step = focusStepsRef.current[currentStepIdx];
    if (!step) return;
    if (step.isRestStep && step.restStepDuration) {
      setPhase('rest');
      setCountdown(step.restStepDuration);
      return;
    }
    setPhase('work');
    const ex = exercisesRef.current[step.exerciseIndex];
    if (ex?.type === 'duration') {
      const secs = parseDurationToSeconds(ex.sets[step.setIndex]?.duration || '');
      setCountdown(secs > 0 ? secs : null);
    } else {
      setCountdown(null);
    }
  }, [currentStepIdx]);

  // Scroll to the card containing a given exercise index
  const scrollToExercise = useCallback((exerciseIndex: number) => {
    // For exercises inside a superset, scroll to the individual exercise card
    const exEl = exerciseCardRefs.current.get(exerciseIndex);
    if (exEl) {
      exEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    // Fallback: scroll to the group card (singles, rests)
    const groupIdx = displayGroups.findIndex((g) => {
      if (g.type === 'single' && g.exerciseIndex === exerciseIndex) return true;
      if (g.type === 'rest' && g.exerciseIndex === exerciseIndex) return true;
      return false;
    });
    if (groupIdx >= 0) {
      const el = cardRefs.current.get(groupIdx);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [displayGroups]);

  // Go to next step
  const goNextStep = useCallback(() => {
    const { currentStepIdx: idx, focusSteps: steps } = stateRef.current;
    setCountdown(null);
    if (idx >= steps.length - 1) {
      setIsRunning(false);
      setShowSummary(true);
      return;
    }
    const nextIdx = idx + 1;
    setCurrentStepIdx(nextIdx);
    const nextStep = steps[nextIdx];
    if (nextStep) {
      setTimeout(() => scrollToExercise(nextStep.exerciseIndex), 50);
    }
  }, [scrollToExercise]);

  // Complete current set and start rest or advance
  const completeStep = useCallback(() => {
    if (!currentSet || !currentStep) return;
    setCountdown(null);
    setCompletedSetIds((prev) => {
      const next = new Set(prev);
      next.add(currentSet.id);
      return next;
    });
    setExercises((prev) =>
      prev.map((e, ei) =>
        ei === currentStep.exerciseIndex
          ? { ...e, sets: e.sets.map((s, si) => si === currentStep.setIndex ? { ...s, completed: true } : s) }
          : e
      )
    );
    const rest = currentStep.restAfterStep;
    if (rest > 0 && currentStepIdx < focusSteps.length - 1) {
      setPhase('rest');
      setCountdown(rest);
    } else {
      goNextStep();
    }
  }, [currentSet, currentStep, currentStepIdx, focusSteps.length, goNextStep]);

  // Refs for stable closure access in Effect C
  const goNextStepRef = useRef(goNextStep);
  goNextStepRef.current = goNextStep;
  const completeStepRef = useRef(completeStep);
  completeStepRef.current = completeStep;

  // Effect C — Auto-advance when countdown reaches 0
  useEffect(() => {
    if (countdown === null || countdown > 0) return;
    if (phase === 'rest') goNextStepRef.current();
    else completeStepRef.current();
  }, [phase, countdown]);

  // --- Footer Next handler ---
  const handleNext = useCallback(() => {
    if (phase === 'rest') { goNextStep(); return; }
    completeStep();
  }, [phase, goNextStep, completeStep]);

  // --- Footer Prev handler ---
  const handlePrev = useCallback(() => {
    if (isResting) {
      setCountdown(null);
      setPhase('work');
      return;
    }
    if (currentStepIdx > 0) {
      setCountdown(null);
      const prevIdx = currentStepIdx - 1;
      setCurrentStepIdx(prevIdx);
      const prevStep = focusSteps[prevIdx];
      if (prevStep) {
        setTimeout(() => scrollToExercise(prevStep.exerciseIndex), 50);
      }
    }
  }, [isResting, currentStepIdx, focusSteps, scrollToExercise]);

  // Toggle set completion via checkbox (manual toggle, does NOT advance)
  const handleToggleSet = useCallback((exerciseIndex: number, setIndex: number) => {
    const ex = exercises[exerciseIndex];
    if (!ex) return;
    const set = ex.sets[setIndex];
    if (!set) return;

    const wasCompleted = completedSetIds.has(set.id);

    setCompletedSetIds((prev) => {
      const next = new Set(prev);
      if (wasCompleted) next.delete(set.id);
      else next.add(set.id);
      return next;
    });

    setExercises((prev) =>
      prev.map((e, ei) =>
        ei === exerciseIndex
          ? {
              ...e,
              sets: e.sets.map((s, si) =>
                si === setIndex ? { ...s, completed: !wasCompleted } : s
              ),
            }
          : e
      )
    );
  }, [exercises, completedSetIds]);

  // Update set field
  const handleUpdateSetField = useCallback(
    (exerciseIndex: number, setIndex: number, field: keyof TrainingSet, value: number | string) => {
      setExercises((prev) =>
        prev.map((ex, ei) =>
          ei === exerciseIndex
            ? {
                ...ex,
                sets: ex.sets.map((s, si) =>
                  si === setIndex ? { ...s, [field]: value } : s
                ),
              }
            : ex
        )
      );
    },
    []
  );

  // Stop training
  const handleStop = useCallback(() => {
    setIsRunning(false);
    setShowSummary(true);
  }, []);

  // --- Derived: footer info ---
  const totalActionSteps = focusSteps.filter((s) => !s.isRestStep).length;
  const progress = totalActionSteps > 0
    ? Math.round((completedSetIds.size / totalActionSteps) * 100)
    : 0;

  // Elapsed formatted HH:MM:SS
  const elapsedFormatted = useMemo(() => {
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [elapsed]);

  // Step info label for footer
  const stepInfoLabel = useMemo(() => {
    if (phase === 'rest' && countdown !== null) {
      return `Descanso — ${formatTime(countdown)}`;
    }
    if (isWorkCountdown) {
      return `${currentExercise?.name ?? ''} — ${formatTime(countdown!)}`;
    }
    if (currentExercise && currentStep) {
      return `${currentExercise.name} — Série ${currentStep.setIndex + 1}/${currentExercise.sets.length}`;
    }
    return '';
  }, [phase, countdown, isWorkCountdown, currentStep, currentExercise]);

  // Next step preview label
  const nextStepLabel = useMemo(() => {
    const nextIdx = currentStepIdx + 1;
    if (nextIdx >= focusSteps.length) return 'Finalizar';

    // If currently resting (inter-set), the "next" is the actual next set
    const nextStep = focusSteps[nextIdx];
    const nextEx = exercises[nextStep.exerciseIndex];

    if (nextStep.isRestStep) {
      return `Descanso ${formatRest(nextStep.restStepDuration ?? 0)}`;
    }
    if (nextEx) {
      return `${nextEx.name} S${nextStep.setIndex + 1}`;
    }
    return 'Próximo';
  }, [currentStepIdx, focusSteps, exercises]);

  // What the Next button should say
  const nextButtonLabel = useMemo(() => {
    if (phase === 'rest') return 'Pular Descanso';
    if (currentStepIdx >= focusSteps.length - 1) return 'Finalizar';
    return 'Próximo';
  }, [phase, currentStepIdx, focusSteps.length]);

  const hasPrev = currentStepIdx > 0;
  const hasNext = currentStepIdx < focusSteps.length;

  // Current exercise/set index for highlighting cards
  const highlightExerciseIndex = currentStep?.exerciseIndex ?? -1;
  const highlightSetIndex = currentStep?.setIndex ?? -1;

  return (
    <div className="h-screen bg-gray-950 flex justify-center overflow-hidden">
      <div className="w-full max-w-md h-full flex flex-col">

        {/* ── Shared Header ── */}
        <div className="flex-shrink-0 bg-gray-900">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <h1 className="text-white font-bold text-base truncate">{workoutName}</h1>
            <div className="flex items-center gap-2">
              {/* View mode dropdown */}
              {(() => {
                const VIEW_OPTIONS = [
                  { mode: 'list' as const,    label: 'Lista',    Icon: List },
                  { mode: 'compact' as const, label: 'Compacto', Icon: LayoutList },
                  { mode: 'guided' as const,  label: 'Guiado',   Icon: Maximize2 },
                ];
                const current = VIEW_OPTIONS.find((o) => o.mode === viewMode) ?? VIEW_OPTIONS[0];
                return (
                  <div className="relative">
                    <button
                      onClick={() => setViewDropdownOpen((o) => !o)}
                      className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    >
                      <current.Icon size={15} />
                    </button>
                    {viewDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setViewDropdownOpen(false)} />
                        <div className="absolute right-0 top-full mt-1 z-20 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl min-w-[110px]">
                          {VIEW_OPTIONS.map(({ mode, label, Icon }) => (
                            <button
                              key={mode}
                              onClick={() => { setViewMode(mode); setViewDropdownOpen(false); }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-700 ${
                                viewMode === mode ? 'bg-yellow-400/15 text-yellow-400 font-semibold' : 'text-gray-300'
                              }`}
                            >
                              <Icon size={14} /> {label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
              <button
                onClick={onBack}
                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Step info bar */}
          <div className="px-4 py-2 border-b border-gray-800/50">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold truncate ${isResting || isWorkCountdown ? 'text-yellow-400' : 'text-white'}`}>
                {stepInfoLabel}
              </span>
              <span className="text-xs text-gray-500 font-medium tabular-nums ml-2 flex-shrink-0">
                {progress}%
              </span>
            </div>
            <div className="mt-1.5 h-1 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-yellow-400 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {/* ── Content Area ── */}
        {viewMode === 'guided' ? (
          <div className="flex-1 overflow-y-auto">
            <GuidedView
              exercises={exercises}
              supersets={supersets}
              focusSteps={focusSteps}
              currentStepIdx={currentStepIdx}
              phase={phase}
              countdown={countdown}
              nextStepLabel={nextStepLabel}
            />
          </div>
        ) : viewMode === 'compact' ? (
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
            <CompactView
              exercises={exercises}
              displayGroups={displayGroups}
              highlightExerciseIndex={highlightExerciseIndex}
              onScrollTo={scrollToExercise}
            />
          </div>
        ) : (
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
            <div className="pb-4 px-4 pt-4 space-y-4">
              {displayGroups.map((group, groupIdx) => {
                const ref = (el: HTMLDivElement | null) => {
                  cardRefs.current.set(groupIdx, el);
                };

                if (group.type === 'rest') {
                  const isActiveRest = isResting && isOnRestStep && currentStep?.exerciseIndex === group.exerciseIndex;
                  return (
                    <div key={`rest-${group.exerciseIndex}`} ref={ref}>
                      <RestBlockCard
                        exercise={exercises[group.exerciseIndex]}
                        isActive={isActiveRest}
                        countdown={isActiveRest ? countdown : null}
                      />
                    </div>
                  );
                }

                if (group.type === 'superset') {
                  return (
                    <div key={group.superset.id} ref={ref}>
                      <SupersetCard
                        superset={group.superset}
                        exercises={exercises}
                        exerciseIndices={group.exerciseIndices}
                        currentExerciseIndex={highlightExerciseIndex}
                        currentSetIndex={highlightSetIndex}
                        phase={phase}
                        countdown={countdown}
                        onToggleSet={handleToggleSet}
                        onUpdateSetField={handleUpdateSetField}
                        onExerciseRef={(exIdx, el) => exerciseCardRefs.current.set(exIdx, el)}
                      />
                    </div>
                  );
                }

                return (
                  <div key={exercises[group.exerciseIndex].id} ref={ref}>
                    <ExerciseCard
                      exercise={exercises[group.exerciseIndex]}
                      exerciseIndex={group.exerciseIndex}
                      currentExerciseIndex={highlightExerciseIndex}
                      currentSetIndex={highlightSetIndex}
                      phase={phase}
                      countdown={countdown}
                      onToggleSet={handleToggleSet}
                      onUpdateSetField={handleUpdateSetField}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Shared Footer ── */}
        <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800">
          <div className="px-4 py-2">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <SkipForward size={10} className="text-gray-500" />
              <span className="text-[11px] text-gray-500 font-medium truncate">
                {nextStepLabel}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsRunning((r) => !r)}
                  className="w-11 h-11 rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 shadow-lg"
                >
                  {isRunning ? <Pause size={18} strokeWidth={2.5} /> : <Play size={18} className="ml-0.5" strokeWidth={2.5} />}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleStop}
                  className="w-11 h-11 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 shadow-lg"
                >
                  <Square size={16} strokeWidth={2.5} />
                </motion.button>
              </div>

              <div className="text-white font-bold text-base font-mono tabular-nums">
                {elapsedFormatted}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={!hasPrev}
                  className={`flex items-center gap-1 px-2.5 py-2 rounded-xl transition-colors ${
                    hasPrev
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={hasNext ? handleNext : handleStop}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl transition-colors bg-yellow-400 text-gray-900 hover:bg-yellow-500"
                >
                  <span className="text-xs font-bold">{nextButtonLabel}</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Summary Modal */}
      <AnimatePresence>
        {showSummary && (
          <SummaryModal
            exercises={exercises}
            completedSetIds={completedSetIds}
            elapsed={elapsed}
            onClose={() => {
              setShowSummary(false);
              onBack();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
