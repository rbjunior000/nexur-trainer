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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StrictExercise } from '../types/workout';
import { formatTime, formatElapsed } from '../utils/formatTime';

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
  thumbnail: string;
  type: string;
  sets: TrainingSet[];
  notes: string;
  supersetId?: string;
  isRest?: boolean;
  restDuration?: number;
}

interface SupersetGroup {
  id: string;
  label: string;
  exerciseIds: string[];
  rounds: number;
}

interface FocusStep {
  exerciseIndex: number;
  setIndex: number;
  restAfterStep: number;
  isRestStep?: boolean;
  restStepDuration?: number;
}

// --- Conversion ---
function toTrainingExercise(ex: StrictExercise, supersetId?: string): TrainingExercise {
  if (ex.type === 'rest') {
    return {
      id: ex.id,
      name: 'Descanso',
      thumbnail: '',
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
    thumbnail: ex.thumbnail,
    type: ex.type,
    notes: ex.notes,
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
      supersets.push({ id: ssId, label: ssLabel, exerciseIds: ids, rounds: maxSets });
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
          let restAfter = 0;
          if (!isLastInRound) {
            restAfter = exercises[exIdx].sets[setIdx].rest;
          } else if (setIdx < maxSets - 1) {
            restAfter = exercises[exIdx].sets[setIdx].rest;
          }

          steps.push({ exerciseIndex: exIdx, setIndex: setIdx, restAfterStep: restAfter });
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
  restCountdown,
  onToggle,
  onUpdateField,
}: {
  set: TrainingSet;
  setIndex: number;
  exerciseType: string;
  isCurrent: boolean;
  showWeight: boolean;
  restCountdown: number | null;
  onToggle: () => void;
  onUpdateField: (field: keyof TrainingSet, value: number | string) => void;
}) {
  const isCountingRest = isCurrent && set.completed && restCountdown !== null && restCountdown > 0;

  return (
    <tr className={`border-b border-gray-800/50 transition-colors ${isCurrent ? 'bg-gray-800/60' : ''}`}>
      <td className="py-2.5 pl-3 pr-2 text-gray-500 text-sm font-medium w-8">
        {setIndex + 1}
      </td>

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
            <span className="text-white text-sm font-semibold">{set.duration || '00:00'}</span>
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
          {isCountingRest ? formatTime(restCountdown!) : formatRest(set.rest)}
        </span>
      </td>

      <td className="py-2.5 pl-2 pr-3">
        <button
          onClick={onToggle}
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
            set.completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-600 text-transparent hover:border-gray-400'
          }`}
        >
          <Check size={14} strokeWidth={3} />
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
  restCountdown,
  onToggleSet,
  onUpdateSetField,
}: {
  exercise: TrainingExercise;
  exerciseIndex: number;
  currentExerciseIndex: number;
  currentSetIndex: number;
  restCountdown: number | null;
  onToggleSet: (exerciseIndex: number, setIndex: number) => void;
  onUpdateSetField: (exerciseIndex: number, setIndex: number, field: keyof TrainingSet, value: number | string) => void;
}) {
  const isCurrent = exerciseIndex === currentExerciseIndex;
  const hasWeight = exercise.type === 'duration' && exercise.sets.some((s) => (s.weight ?? 0) > 0);

  const colHeaders = (() => {
    switch (exercise.type) {
      case 'weight_reps': return ['#', 'Carga', 'Reps', 'Inter', ''];
      case 'duration': return hasWeight ? ['#', 'Carga', 'Duração', 'Inter', ''] : ['#', 'Duração', 'Inter', ''];
      case 'distance': return ['#', 'Distância', 'Inter', ''];
      default: return ['#', 'Carga', 'Reps', 'Inter', ''];
    }
  })();

  return (
    <div className={`bg-gray-900 rounded-2xl overflow-hidden transition-all ${isCurrent ? 'ring-2 ring-yellow-400/50' : ''}`}>
      {/* Thumbnail */}
      {exercise.thumbnail && (
        <div className="relative aspect-video">
          <img
            src={exercise.thumbnail}
            alt={exercise.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
              <Play size={20} className="text-white ml-0.5" />
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-lg truncate flex-1">{exercise.name}</h3>
          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
            <button className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
              <BarChart3 size={14} />
            </button>
            <button className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
              <Pencil size={14} />
            </button>
          </div>
        </div>

        {/* Set Table */}
        <table className="w-full">
          <thead>
            <tr className="text-gray-500 text-xs uppercase">
              {colHeaders.map((h, i) => (
                <th key={i} className={`py-1.5 font-semibold text-left ${i === 0 ? 'pl-3 pr-2 w-8' : i === colHeaders.length - 1 ? 'pl-2 pr-3 w-10' : 'px-2'}`}>
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
                restCountdown={isCurrent && si === currentSetIndex ? restCountdown : null}
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
  restCountdown,
  onToggleSet,
  onUpdateSetField,
}: {
  superset: SupersetGroup;
  exercises: TrainingExercise[];
  exerciseIndices: number[];
  currentExerciseIndex: number;
  currentSetIndex: number;
  restCountdown: number | null;
  onToggleSet: (exerciseIndex: number, setIndex: number) => void;
  onUpdateSetField: (exerciseIndex: number, setIndex: number, field: keyof TrainingSet, value: number | string) => void;
}) {
  return (
    <div className="relative flex">
      {/* Superset side bar */}
      <div className="flex flex-col items-center mr-3 pt-1">
        <div className="w-0.5 flex-1 bg-red-500/60 rounded-full" />
        <div className="w-0.5 flex-1 bg-red-500/60 rounded-full" />
      </div>

      {/* Stacked exercises */}
      <div className="flex-1 flex flex-col gap-3">
        {/* Superset label row */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-md">
            Superset
          </span>
          <span className="text-gray-400 text-sm font-medium">
            {superset.rounds} Ciclos
          </span>
        </div>

        {exerciseIndices.map((exIdx, i) => {
          const ex = exercises[exIdx];
          return (
            <div key={ex.id}>
              <ExerciseCard
                exercise={ex}
                exerciseIndex={exIdx}
                currentExerciseIndex={currentExerciseIndex}
                currentSetIndex={currentSetIndex}
                restCountdown={restCountdown}
                onToggleSet={onToggleSet}
                onUpdateSetField={onUpdateSetField}
              />
              {/* Connector between exercises */}
              {/* {i < exerciseIndices.length - 1 && (
                <div className="flex items-center gap-2 py-1 pl-2">
                  <div className="h-px flex-1 bg-red-500/30" />
                  <span className="text-red-400 text-[10px] font-bold tracking-wider">+ SUPERSET</span>
                  <div className="h-px flex-1 bg-red-500/30" />
                </div>
              )} */}
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

// ========== Main Page V2 ==========
export function StrictTrainingPageV2({
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
  const [restCountdown, setRestCountdown] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const isResting = restCountdown !== null && restCountdown > 0;

  // Refs
  const cardRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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

  // Rest countdown timer
  useEffect(() => {
    if (!isRunning || restCountdown === null || restCountdown <= 0) return;
    const id = setInterval(() => {
      setRestCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, restCountdown]);

  // Auto-start rest on rest steps
  useEffect(() => {
    const step = focusSteps[currentStepIdx];
    if (step?.isRestStep && step.restStepDuration && step.restStepDuration > 0) {
      setRestCountdown(step.restStepDuration);
    }
  }, [currentStepIdx, focusSteps]);

  // Auto-advance when rest reaches 0
  useEffect(() => {
    if (restCountdown === 0) {
      advanceStep();
    }
  }, [restCountdown]);

  // Scroll to the card containing a given exercise index
  const scrollToExercise = useCallback((exerciseIndex: number) => {
    const groupIdx = displayGroups.findIndex((g) => {
      if (g.type === 'single' && g.exerciseIndex === exerciseIndex) return true;
      if (g.type === 'superset' && g.exerciseIndices.includes(exerciseIndex)) return true;
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

  // Advance to next step
  const advanceStep = useCallback(() => {
    const { currentStepIdx: idx, focusSteps: steps } = stateRef.current;
    setRestCountdown(null);
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

  // --- Footer Next handler ---
  const handleNext = useCallback(() => {
    if (isResting) {
      // Skip rest → advance
      advanceStep();
      return;
    }

    if (isOnRestStep) {
      // Skip rest step
      advanceStep();
      return;
    }

    if (!currentSet || !currentStep) return;

    // Mark set completed
    setCompletedSetIds((prev) => {
      const next = new Set(prev);
      next.add(currentSet.id);
      return next;
    });
    setExercises((prev) =>
      prev.map((e, ei) =>
        ei === currentStep.exerciseIndex
          ? {
              ...e,
              sets: e.sets.map((s, si) =>
                si === currentStep.setIndex ? { ...s, completed: true } : s
              ),
            }
          : e
      )
    );

    // Start rest or advance
    const rest = currentStep.restAfterStep;
    if (rest > 0 && currentStepIdx < focusSteps.length - 1) {
      setRestCountdown(rest);
    } else {
      advanceStep();
    }
  }, [isResting, isOnRestStep, currentSet, currentStep, currentStepIdx, focusSteps.length, advanceStep]);

  // --- Footer Prev handler ---
  const handlePrev = useCallback(() => {
    if (isResting) {
      setRestCountdown(null);
      return;
    }
    if (currentStepIdx > 0) {
      setRestCountdown(null);
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
    if (isResting) {
      return `Descanso — ${formatTime(restCountdown ?? 0)}`;
    }
    if (isOnRestStep) {
      return `Descanso — ${formatTime(restCountdown ?? currentStep?.restStepDuration ?? 0)}`;
    }
    if (currentExercise && currentStep) {
      return `${currentExercise.name} — Série ${currentStep.setIndex + 1}/${currentExercise.sets.length}`;
    }
    return '';
  }, [isResting, isOnRestStep, restCountdown, currentStep, currentExercise]);

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
    if (isResting || isOnRestStep) return 'Pular';
    if (currentStepIdx >= focusSteps.length - 1) return 'Finalizar';
    return 'Próximo';
  }, [isResting, isOnRestStep, currentStepIdx, focusSteps.length]);

  const hasPrev = currentStepIdx > 0;
  const hasNext = currentStepIdx < focusSteps.length;

  // Current exercise/set index for highlighting cards
  const highlightExerciseIndex = currentStep?.exerciseIndex ?? -1;
  const highlightSetIndex = currentStep?.setIndex ?? -1;

  return (
    <div className="h-screen bg-gray-950 flex justify-center overflow-hidden">
      <div ref={scrollContainerRef} className="w-full max-w-md h-full overflow-y-auto">

      {/* Header — sticky */}
      <div className="sticky top-0 z-30 bg-gray-900">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <h1 className="text-white font-bold text-base truncate">{workoutName}</h1>
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step info bar */}
        <div className="px-4 py-2 border-b border-gray-800/50">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold truncate ${isResting || isOnRestStep ? 'text-yellow-400' : 'text-white'}`}>
              {stepInfoLabel}
            </span>
            <span className="text-xs text-gray-500 font-medium tabular-nums ml-2 flex-shrink-0">
              {progress}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-1.5 h-1 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-yellow-400 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-36 px-4 pt-4 space-y-4">
        {displayGroups.map((group, groupIdx) => {
          const ref = (el: HTMLDivElement | null) => {
            cardRefs.current.set(groupIdx, el);
          };

          if (group.type === 'rest') {
            const isActiveRest = isOnRestStep && currentStep?.exerciseIndex === group.exerciseIndex;
            return (
              <div key={`rest-${group.exerciseIndex}`} ref={ref}>
                <RestBlockCard
                  exercise={exercises[group.exerciseIndex]}
                  isActive={isActiveRest}
                  countdown={isActiveRest ? restCountdown : null}
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
                  restCountdown={isResting ? restCountdown : null}
                  onToggleSet={handleToggleSet}
                  onUpdateSetField={handleUpdateSetField}
                />
              </div>
            );
          }

          // Single exercise
          return (
            <div key={exercises[group.exerciseIndex].id} ref={ref}>
              <ExerciseCard
                exercise={exercises[group.exerciseIndex]}
                exerciseIndex={group.exerciseIndex}
                currentExerciseIndex={highlightExerciseIndex}
                currentSetIndex={highlightSetIndex}
                restCountdown={isResting ? restCountdown : null}
                onToggleSet={handleToggleSet}
                onUpdateSetField={handleUpdateSetField}
              />
            </div>
          );
        })}
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-40">
        <div className="max-w-md mx-auto px-4 py-2">
          {/* Next step preview */}
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <SkipForward size={10} className="text-gray-500" />
            <span className="text-[11px] text-gray-500 font-medium truncate">
              {nextStepLabel}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Play/Pause + Stop */}
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

            {/* Timer */}
            <div className="text-white font-bold text-base font-mono tabular-nums">
              {elapsedFormatted}
            </div>

            {/* Prev / Next */}
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
    </div>
  );
}
