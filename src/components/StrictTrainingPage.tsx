import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  Check,
  Clock,
  Trophy,
  Minus,
  Plus,
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
  category: string;
  equipment: string;
  typeLabel: string;
  typeColor: string;
  typeBg: string;
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
  restBetweenRounds: number;
}

interface FocusStep {
  exerciseIndex: number;
  setIndex: number;
  restAfterStep: number;
  isRestStep?: boolean;
  restStepDuration?: number;
}

// --- Conversion: editor model → execution model ---
const TYPE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  weight_reps: { label: 'Weight Reps', color: 'text-blue-700', bg: 'bg-blue-100' },
  duration: { label: 'Duration', color: 'text-teal-700', bg: 'bg-teal-100' },
  distance: { label: 'Distance', color: 'text-rose-700', bg: 'bg-rose-100' },
};

function toTrainingExercise(ex: StrictExercise, supersetId?: string): TrainingExercise {
  if (ex.type === 'rest') {
    return {
      id: ex.id,
      name: 'Descanso',
      thumbnail: '',
      category: '',
      equipment: '',
      typeLabel: 'Rest',
      typeColor: 'text-gray-500',
      typeBg: 'bg-gray-100',
      notes: '',
      sets: [],
      isRest: true,
      restDuration: ex.restDuration ?? 0,
    };
  }
  const typeInfo = TYPE_MAP[ex.type] || TYPE_MAP.weight_reps;
  return {
    id: ex.id,
    name: ex.name,
    thumbnail: ex.thumbnail,
    category: ex.category,
    equipment: ex.equipment,
    typeLabel: typeInfo.label,
    typeColor: typeInfo.color,
    typeBg: typeInfo.bg,
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
    // Rest items never join superset groups
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
      supersets.push({ id: ssId, label: ssLabel, exerciseIds: ids, rounds: 1, restBetweenRounds: 90 });
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

    // Rest items become rest steps
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
      // Superset: interleave sets in rounds
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

          if (isLastInRound && setIdx < maxSets - 1) {
            // End of a round, rest between rounds
            restAfter = ss.restBetweenRounds;
          } else if (!isLastInRound) {
            // Between exercises within a round (typically 0 for supersets)
            restAfter = exercises[exIdx].sets[setIdx].rest;
          }
          // Last set of last round: restAfter = 0, the next rest item (if any) handles it
          steps.push({ exerciseIndex: exIdx, setIndex: setIdx, restAfterStep: restAfter });
        }
      }
    } else {
      // Standalone exercise
      processed.add(i);
      for (let setIdx = 0; setIdx < ex.sets.length; setIdx++) {
        const isLastSet = setIdx === ex.sets.length - 1;
        // For intermediate sets use set.rest; for last set use 0 (rest item handles it)
        const restAfter = isLastSet ? 0 : ex.sets[setIdx].rest;
        steps.push({ exerciseIndex: i, setIndex: setIdx, restAfterStep: restAfter });
      }
    }
  }
  return steps;
}

// --- Format set info label (used in summary) ---

// --- Thumbnail strip ---
function ThumbnailStrip({
  exercises,
  supersets,
  currentExerciseIndex,
  completedSetIds,
}: {
  exercises: TrainingExercise[];
  supersets: SupersetGroup[];
  currentExerciseIndex: number;
  completedSetIds: Set<string>;
}) {
  type ThumbItem =
    | { type: 'single'; exerciseIndex: number }
    | { type: 'superset'; label: string; exerciseIndices: number[] };

  const items: ThumbItem[] = [];
  const processed = new Set<number>();

  exercises.forEach((ex, idx) => {
    if (processed.has(idx)) return;
    if (ex.isRest) { processed.add(idx); return; }
    const ss = supersets.find((s) => s.exerciseIds.includes(ex.id));
    if (ss) {
      const indices = ss.exerciseIds
        .map((id) => exercises.findIndex((e) => e.id === id))
        .filter((i) => i >= 0);
      indices.forEach((i) => processed.add(i));
      items.push({ type: 'superset', label: ss.label, exerciseIndices: indices });
    } else {
      processed.add(idx);
      items.push({ type: 'single', exerciseIndex: idx });
    }
  });

  return (
    <div className="flex gap-2 overflow-x-auto pb-3 mb-4 hide-scrollbar -mx-6 px-6">
      {items.map((item) => {
        if (item.type === 'single') {
          const ex = exercises[item.exerciseIndex];
          const isCurrent = item.exerciseIndex === currentExerciseIndex;
          const allDone = ex.sets.every((s) => completedSetIds.has(s.id));
          return (
            <div key={ex.id} className="relative flex-shrink-0">
              <div
                className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                  isCurrent
                    ? 'border-yellow-400 shadow-md shadow-yellow-200/50'
                    : allDone
                    ? 'border-green-300 opacity-60'
                    : 'border-transparent'
                }`}
              >
                <img src={ex.thumbnail} alt={ex.name} className="w-full h-full object-cover" />
              </div>
              {allDone && (
                <div className="absolute inset-0 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Check size={18} className="text-green-600" strokeWidth={3} />
                </div>
              )}
            </div>
          );
        } else {
          const isGroupActive = item.exerciseIndices.includes(currentExerciseIndex);
          return (
            <div
              key={item.label}
              className={`flex-shrink-0 rounded-xl p-1.5 border-2 transition-all ${
                isGroupActive ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-1 mb-1">
                <div className={`w-2 h-2 rounded-full ${isGroupActive ? 'bg-blue-500' : 'bg-gray-300'}`} />
                <span className={`text-[10px] font-bold ${isGroupActive ? 'text-blue-600' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </div>
              <div className="flex gap-1">
                {item.exerciseIndices.map((exIdx) => {
                  const ex = exercises[exIdx];
                  const isThis = exIdx === currentExerciseIndex;
                  const allDone = ex.sets.every((s) => completedSetIds.has(s.id));
                  return (
                    <div key={ex.id} className="relative">
                      <div
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                          isThis
                            ? 'border-yellow-400'
                            : allDone
                            ? 'border-green-300 opacity-60'
                            : 'border-transparent'
                        }`}
                      >
                        <img src={ex.thumbnail} alt={ex.name} className="w-full h-full object-cover" />
                      </div>
                      {allDone && (
                        <div className="absolute inset-0 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <Check size={14} className="text-green-600" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
      })}
    </div>
  );
}

// --- Summary Modal ---
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl"
      >
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy size={32} className="text-yellow-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Treino concluido!</h2>
        <p className="text-gray-500 text-sm mb-8">Parabens pelo treino de hoje</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-lg font-bold text-gray-900">{formatElapsed(elapsed)}</div>
            <div className="text-[10px] text-gray-400 uppercase font-bold">Duracao</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-lg font-bold text-gray-900">{completedCount}/{totalSets}</div>
            <div className="text-[10px] text-gray-400 uppercase font-bold">Series</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-lg font-bold text-gray-900">
              {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${totalVolume}kg`}
            </div>
            <div className="text-[10px] text-gray-400 uppercase font-bold">Volume</div>
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

// ========== Main Page ==========
export function StrictTrainingPage({
  sourceExercises,
  onBack,
}: {
  sourceExercises: StrictExercise[];
  onBack: () => void;
}) {
  const { trainingExercises: initialExercises, supersets } = useMemo(
    () => buildSupersetGroups(sourceExercises),
    [sourceExercises]
  );
  const [trainingExercises, setTrainingExercises] = useState(initialExercises);
  const focusSteps = useMemo(
    () => buildFocusSteps(trainingExercises, supersets),
    [trainingExercises, supersets]
  );

  const updateSetField = useCallback(
    (exerciseIndex: number, setIndex: number, field: keyof TrainingSet, value: number | string) => {
      setTrainingExercises((prev) =>
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

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [completedSetIds, setCompletedSetIds] = useState<Set<string>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const [stepTimer, setStepTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [restCountdown, setRestCountdown] = useState<number | null>(null);
  const [restInitial, setRestInitial] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  const isResting = restCountdown !== null && restCountdown > 0;

  // Refs for stable callbacks
  const stateRef = useRef({ currentStepIdx, focusSteps });
  stateRef.current = { currentStepIdx, focusSteps };

  const currentStep = focusSteps[currentStepIdx];
  const currentExercise = currentStep ? trainingExercises[currentStep.exerciseIndex] : null;
  const currentSet = currentExercise?.sets[currentStep?.setIndex ?? 0] ?? null;

  // --- Timers ---
  // Elapsed total time
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  // Per-step timer (resets on step change)
  useEffect(() => {
    setStepTimer(0);
  }, [currentStepIdx]);

  useEffect(() => {
    if (!isRunning || isResting) return;
    const id = setInterval(() => setStepTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning, isResting]);

  // Rest countdown
  useEffect(() => {
    if (!isRunning || restCountdown === null || restCountdown <= 0) return;
    const id = setInterval(() => {
      setRestCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, restCountdown]);

  // Advance to next step
  const advanceStep = useCallback(() => {
    const { currentStepIdx: idx, focusSteps: steps } = stateRef.current;
    setRestCountdown(null);
    if (idx >= steps.length - 1) {
      setIsRunning(false);
      setShowSummary(true);
      return;
    }
    setCurrentStepIdx(idx + 1);
  }, []);

  // Auto-start rest countdown when landing on a rest step
  useEffect(() => {
    const step = focusSteps[currentStepIdx];
    if (step?.isRestStep && step.restStepDuration && step.restStepDuration > 0) {
      setRestCountdown(step.restStepDuration);
      setRestInitial(step.restStepDuration);
    }
  }, [currentStepIdx, focusSteps]);

  // Auto-advance when rest reaches 0
  useEffect(() => {
    if (restCountdown === 0) {
      advanceStep();
    }
  }, [restCountdown, advanceStep]);

  // --- Handlers ---
  const handleNext = useCallback(() => {
    if (isResting) {
      // Skip rest
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

    // Start rest or advance
    const rest = currentStep.restAfterStep;
    if (rest > 0 && stateRef.current.currentStepIdx < stateRef.current.focusSteps.length - 1) {
      setRestCountdown(rest);
      setRestInitial(rest);
    } else {
      advanceStep();
    }
  }, [isResting, currentSet, currentStep, advanceStep]);

  const handlePrev = useCallback(() => {
    if (isResting) {
      setRestCountdown(null);
      return;
    }
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  }, [isResting, currentStepIdx]);


  // --- Derived values ---
  const isOnRestStep = currentStep?.isRestStep === true;

  // Count only non-rest focus steps for progress
  const totalActionSteps = focusSteps.filter((s) => !s.isRestStep).length;
  const progress = totalActionSteps > 0
    ? Math.round((completedSetIds.size / totalActionSteps) * 100)
    : 0;

  const nextRestDuration = !isResting ? (currentStep?.restAfterStep ?? 0) : 0;

  // Rest progress for the visual ring
  const restProgress = isResting && restInitial > 0 ? (restCountdown ?? 0) / restInitial : 0;

  // For rest steps, find the next exercise to show its info
  const displayExercise = isOnRestStep
    ? (() => {
        // Look for the next non-rest exercise after current step
        for (let s = currentStepIdx + 1; s < focusSteps.length; s++) {
          const ex = trainingExercises[focusSteps[s].exerciseIndex];
          if (!ex.isRest) return ex;
        }
        // Fallback to previous non-rest exercise
        for (let s = currentStepIdx - 1; s >= 0; s--) {
          const ex = trainingExercises[focusSteps[s].exerciseIndex];
          if (!ex.isRest) return ex;
        }
        return null;
      })()
    : currentExercise;

  if (!currentStep || (!isOnRestStep && (!currentExercise || !currentSet))) return null;

  const setLabel = isOnRestStep
    ? 'Descanso'
    : `Serie ${currentStep.setIndex + 1} de ${currentExercise!.sets.length}`;
  const mainTimerValue = isResting ? (restCountdown ?? 0) : stepTimer;

  return (
    <div className="min-h-screen flex items-start justify-center bg-black">
     <div className="w-full max-w-lg flex flex-col min-h-screen">
      {/* ===== Hero image ===== */}
      <div className="relative flex-shrink-0 h-[52vh] min-h-[280px]">
        <AnimatePresence mode="wait">
          {(displayExercise?.thumbnail) ? (
            <motion.img
              key={displayExercise.id}
              src={displayExercise.thumbnail}
              alt={displayExercise.name}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: isResting || isOnRestStep ? 0.4 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          ) : (
            <motion.div
              key="rest-bg"
              className="absolute inset-0 bg-gray-900"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>

        {/* Top gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/10 pointer-events-none" />

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white z-10"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Rest overlay badge */}
        <AnimatePresence>
          {isResting && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-10"
            >
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-8 py-4 flex flex-col items-center gap-2">
                {/* Rest ring */}
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
                    <circle
                      cx="48" cy="48" r="42" fill="none"
                      stroke="#facc15" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 42}
                      strokeDashoffset={2 * Math.PI * 42 * (1 - restProgress)}
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-white tabular-nums">
                      {formatTime(restCountdown ?? 0)}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Descanso</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Set dots overlay (bottom-right of hero) */}
        <div className="absolute bottom-4 right-4 flex gap-1.5 z-10">
          {!isOnRestStep && currentExercise && currentExercise.sets.map((s, i) => {
            const done = completedSetIds.has(s.id);
            const isCurrent = i === currentStep.setIndex && !isResting;
            return (
              <div
                key={s.id}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  done
                    ? 'bg-green-400'
                    : isCurrent
                    ? 'bg-yellow-400 scale-125'
                    : 'bg-white/40'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* ===== Bottom panel ===== */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-5 relative z-10 flex flex-col px-6 pt-6 pb-6 min-h-0">
        {/* Exercise name */}
        <h2 className="text-2xl font-black text-gray-900 truncate mb-0.5">
          {isOnRestStep ? 'Descanso' : (displayExercise?.name ?? '')}
        </h2>

        {/* Set label + type badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-400">{setLabel}</span>
          {!isOnRestStep && currentExercise && (
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${currentExercise.typeBg} ${currentExercise.typeColor}`}>
              {currentExercise.typeLabel}
            </span>
          )}
          {!isOnRestStep && currentExercise?.notes && (
            <span className="text-[10px] text-gray-400 truncate max-w-[140px]">
              {currentExercise.notes}
            </span>
          )}
          {isOnRestStep && displayExercise && (
            <span className="text-[10px] text-gray-400">
              Proximo: {displayExercise.name}
            </span>
          )}
        </div>

        {/* Set detail cards */}
        {!isOnRestStep && currentSet && (
          <div className="flex gap-3 mb-5">
            {/* Reps */}
            {currentSet.reps !== undefined && (
              <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-gray-900 tabular-nums">{currentSet.reps}</div>
                <div className="text-[10px] text-gray-400 uppercase font-bold">Reps</div>
              </div>
            )}
            {/* Weight — editable */}
            {currentSet.weight !== undefined && (
              <div className="flex-1 bg-yellow-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() =>
                      updateSetField(
                        currentStep.exerciseIndex,
                        currentStep.setIndex,
                        'weight',
                        Math.max(0, (currentSet.weight ?? 0) - 2.5)
                      )
                    }
                    className="w-7 h-7 rounded-lg bg-yellow-100 text-yellow-700 flex items-center justify-center hover:bg-yellow-200 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    value={currentSet.weight ?? 0}
                    onChange={(e) =>
                      updateSetField(
                        currentStep.exerciseIndex,
                        currentStep.setIndex,
                        'weight',
                        Number(e.target.value) || 0
                      )
                    }
                    className="w-16 text-2xl font-black text-gray-900 tabular-nums text-center bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() =>
                      updateSetField(
                        currentStep.exerciseIndex,
                        currentStep.setIndex,
                        'weight',
                        (currentSet.weight ?? 0) + 2.5
                      )
                    }
                    className="w-7 h-7 rounded-lg bg-yellow-100 text-yellow-700 flex items-center justify-center hover:bg-yellow-200 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="text-[10px] text-yellow-600 uppercase font-bold">kg</div>
              </div>
            )}
            {/* Duration */}
            {currentSet.duration && (
              <div className="flex-1 bg-teal-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-teal-700 tabular-nums">{currentSet.duration}</div>
                <div className="text-[10px] text-teal-500 uppercase font-bold">Duracao</div>
              </div>
            )}
            {/* Distance */}
            {currentSet.distance !== undefined && currentSet.distance > 0 && (
              <div className="flex-1 bg-rose-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-rose-700 tabular-nums">{currentSet.distance}</div>
                <div className="text-[10px] text-rose-500 uppercase font-bold">km</div>
              </div>
            )}
          </div>
        )}

        {/* Timers row */}
        <div className="flex items-end justify-between mb-5">
          <span className={`text-5xl font-black tabular-nums leading-none ${isResting ? 'text-yellow-500' : 'text-gray-900'}`}>
            {formatTime(mainTimerValue)}
          </span>
          <div className="text-right">
            <div className="text-xl font-bold text-gray-900 tabular-nums">{formatElapsed(elapsed)}</div>
            <div className="text-[10px] text-gray-400 uppercase font-bold">Total time</div>
          </div>
        </div>

        {/* Thumbnail strip */}
        <ThumbnailStrip
          exercises={trainingExercises}
          supersets={supersets}
          currentExerciseIndex={currentStep.exerciseIndex}
          completedSetIds={completedSetIds}
        />

        {/* Spacer */}
        <div className="flex-1 min-h-2" />

        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-yellow-400 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
          <span className="text-xs font-bold text-gray-400 tabular-nums">{progress}%</span>
        </div>

        {/* ===== Footer controls ===== */}
        <div className="flex items-center justify-between">
          {/* Prev */}
          <button
            onClick={handlePrev}
            className="flex flex-col items-center gap-0.5 min-w-[64px] py-2"
          >
            <span className="text-sm font-bold text-gray-600">Prev</span>
          </button>

          {/* Pause / Play */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsRunning((r) => !r)}
            className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-white shadow-lg"
          >
            {isRunning ? <Pause size={28} /> : <Play size={28} />}
          </motion.button>

          {/* Next */}
          <button
            onClick={handleNext}
            className="flex flex-col items-center gap-0.5 min-w-[64px] py-2"
          >
            <span className="text-sm font-bold text-gray-600">
              {isResting ? 'Skip' : 'Next'}
            </span>
            {!isResting && nextRestDuration > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Clock size={10} />
                {nextRestDuration}s
              </span>
            )}
          </button>
        </div>
      </div>

     </div>
      {/* ===== Summary Modal ===== */}
      <AnimatePresence>
        {showSummary && (
          <SummaryModal
            exercises={trainingExercises}
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
