import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import type { StrictExercise, SetType, DropSet } from '../../types/workout';
import type { Media } from '../../types/media';
import { parseDurationToSeconds } from '../../utils/formatTime';

// ─── Internal types ────────────────────────────────────────────────────────────

export interface TrainingSet {
  id: string;
  type?: SetType;
  dropsets?: DropSet[];
  reps?: number;
  repsRange?: [number, number];
  weight?: number;
  duration?: string;
  distance?: number;
  rest: number;
  completed: boolean;
  pse?: number | null;
}

export interface TrainingExercise {
  id: string;
  name: string;
  media1: Media | null;
  media2: Media | null;
  type: string;
  repsMode?: string;
  sets: TrainingSet[];
  notes: string;
  orientacoes?: string;
  supersetId?: string;
  isRest?: boolean;
  restDuration?: number;
  cor?: string;
}

export interface SupersetGroup {
  id: string;
  label: string;
  exerciseIds: string[];
  rounds: number;
  color: string;
}

export interface FocusStep {
  exerciseIndex: number;
  setIndex: number;
  restAfterStep: number;
  isRestStep?: boolean;
  restStepDuration?: number;
  isSupersetRest?: boolean;
}

export type Phase = 'work' | 'rest';
export type ViewMode = 'list' | 'guided' | 'compact';

export type DisplayGroup =
  | { type: 'single'; exerciseIndex: number }
  | { type: 'superset'; superset: SupersetGroup; exerciseIndices: number[] }
  | { type: 'rest'; exerciseIndex: number };

// ─── Conversion helpers ────────────────────────────────────────────────────────

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
    repsMode: ex.repsMode,
    notes: ex.notes,
    orientacoes: ex.orientacoes,
    cor: ex.cor,
    supersetId,
    sets: ex.sets.map((s) => ({
      id: s.id,
      type: s.type,
      dropsets: s.dropsets,
      reps: ex.repsMode === 'range' ? undefined : s.reps,
      repsRange: s.repsRange,
      weight: s.weight,
      duration: s.duration,
      distance: s.distance,
      rest: s.rest,
      completed: false,
      pse: s.pse,
    })),
  };
}

export function buildSupersetGroups(exercises: StrictExercise[]): {
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
      const ssColor =
        exercises[i].cor && exercises[i].cor !== '#f1f1f1' ? exercises[i].cor! : '#FBBF24';
      supersets.push({ id: ssId, label: ssLabel, exerciseIds: ids, rounds: maxSets, color: ssColor });
      i = j;
    } else {
      trainingExercises.push(toTrainingExercise(exercises[i]));
      i++;
    }
  }
  return { trainingExercises, supersets };
}

export function buildFocusSteps(
  exercises: TrainingExercise[],
  supersets: SupersetGroup[],
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
        const set = ex.sets[setIdx];
        const isLastSet = setIdx === ex.sets.length - 1;
        const restAfter = isLastSet ? 0 : set.rest;
        steps.push({ exerciseIndex: i, setIndex: setIdx, restAfterStep: restAfter });
      }
    }
  }
  return steps;
}

export function buildDisplayGroups(
  exercises: TrainingExercise[],
  supersets: SupersetGroup[],
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

// ─── Context value ─────────────────────────────────────────────────────────────

export interface TrainingSessionContextValue {
  exercises: TrainingExercise[];
  supersets: SupersetGroup[];
  focusSteps: FocusStep[];
  displayGroups: DisplayGroup[];
  currentStepIdx: number;
  completedSetIds: Set<string>;
  elapsed: number;
  isRunning: boolean;
  phase: Phase;
  countdown: number | null;
  viewMode: ViewMode;
  showSummary: boolean;
  workoutName: string;

  // Derived
  currentStep: FocusStep | null;
  currentExercise: TrainingExercise | null;
  currentSet: TrainingSet | null;
  progress: number;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  togglePlayPause: () => void;
  stopSession: () => void;
  goNext: () => void;
  goPrev: () => void;
  toggleSetComplete: (exerciseIndex: number, setIndex: number) => void;
  updateSetField: (
    exerciseIndex: number,
    setIndex: number,
    field: keyof TrainingSet,
    value: number | string | null,
  ) => void;
  closeSummary: () => void;
}

// ─── Context ───────────────────────────────────────────────────────────────────

const TrainingSessionContext = createContext<TrainingSessionContextValue | null>(null);

export interface TrainingSessionProviderProps {
  sourceExercises: StrictExercise[];
  workoutName?: string;
  children: ReactNode;
}

export function TrainingSessionProvider({
  sourceExercises,
  workoutName = 'Treino',
  children,
}: TrainingSessionProviderProps) {
  const { trainingExercises: initialExercises, supersets } = useMemo(
    () => buildSupersetGroups(sourceExercises),
    [sourceExercises],
  );

  const [exercises, setExercises] = useState<TrainingExercise[]>(initialExercises);
  const displayGroups = useMemo(
    () => buildDisplayGroups(exercises, supersets),
    [exercises, supersets],
  );
  const focusSteps = useMemo(() => buildFocusSteps(exercises, supersets), [exercises, supersets]);

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [completedSetIds, setCompletedSetIds] = useState<Set<string>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [phase, setPhase] = useState<Phase>('work');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Refs for use inside callbacks
  const stateRef = useRef({ currentStepIdx, focusSteps, phase, countdown, isRunning });
  stateRef.current = { currentStepIdx, focusSteps, phase, countdown, isRunning };
  const exercisesRef = useRef(exercises);
  exercisesRef.current = exercises;

  // ── Elapsed timer ──
  useEffect(() => {
    if (!isRunning) return;
    const t = window.setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, [isRunning]);

  // ── Work phase countdown (duration type) ──
  useEffect(() => {
    if (phase !== 'work' || countdown === null || !isRunning) return;
    if (countdown <= 0) {
      // Auto-advance after duration ends
      setCountdown(null);
      return;
    }
    const t = window.setTimeout(() => setCountdown((v) => (v ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, isRunning]);

  // ── Rest countdown ──
  useEffect(() => {
    if (phase !== 'rest' || countdown === null || !isRunning) return;
    if (countdown <= 0) {
      setCountdown(null);
      setPhase('work');
      // start next step's duration if applicable
      const { focusSteps: fs, currentStepIdx: idx } = stateRef.current;
      const nextStep = fs[idx];
      if (nextStep && !nextStep.isRestStep) {
        const nextEx = exercisesRef.current[nextStep.exerciseIndex];
        const nextSet = nextEx?.sets[nextStep.setIndex];
        if (nextSet?.duration && nextEx?.type === 'duration') {
          setCountdown(parseDurationToSeconds(nextSet.duration));
        }
      }
      return;
    }
    const t = window.setTimeout(() => setCountdown((v) => (v ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, isRunning]);

  // ── Navigation ──
  const goToStep = useCallback((idx: number) => {
    const { focusSteps: fs } = stateRef.current;
    if (idx < 0 || idx >= fs.length) return;
    setCurrentStepIdx(idx);
    setPhase('work');
    setCountdown(null);

    const step = fs[idx];
    if (step.isRestStep && step.restStepDuration) {
      setPhase('rest');
      setCountdown(step.restStepDuration);
      return;
    }

    const ex = exercisesRef.current[step.exerciseIndex];
    const set = ex?.sets[step.setIndex];
    if (set?.duration && ex?.type === 'duration') {
      setCountdown(parseDurationToSeconds(set.duration));
    }
  }, []);

  const goNext = useCallback(() => {
    const { currentStepIdx: idx, focusSteps: fs, phase: ph, countdown: cd } = stateRef.current;

    // If currently resting, skip rest
    if (ph === 'rest') {
      setCountdown(null);
      setPhase('work');
      const nextStep = fs[idx];
      if (nextStep && !nextStep.isRestStep) {
        const ex = exercisesRef.current[nextStep.exerciseIndex];
        const set = ex?.sets[nextStep.setIndex];
        if (set?.duration && ex?.type === 'duration') setCountdown(parseDurationToSeconds(set.duration));
      }
      return;
    }

    const currentStep = fs[idx];
    if (!currentStep) return;

    // Check if we should start a rest phase
    if (currentStep.restAfterStep > 0) {
      setPhase('rest');
      setCountdown(currentStep.restAfterStep);
      // advance to next step
      const nextIdx = idx + 1;
      if (nextIdx < fs.length) {
        setCurrentStepIdx(nextIdx);
      }
      return;
    }

    const nextIdx = idx + 1;
    if (nextIdx >= fs.length) {
      setIsRunning(false);
      setShowSummary(true);
      return;
    }
    goToStep(nextIdx);
  }, [goToStep]);

  const goPrev = useCallback(() => {
    const { currentStepIdx: idx } = stateRef.current;
    if (idx > 0) goToStep(idx - 1);
  }, [goToStep]);

  const togglePlayPause = useCallback(() => setIsRunning((v) => !v), []);

  const stopSession = useCallback(() => {
    setIsRunning(false);
    setShowSummary(true);
  }, []);

  const toggleSetComplete = useCallback((exerciseIndex: number, setIndex: number) => {
    setExercises((prev) => {
      const next = [...prev];
      const ex = { ...next[exerciseIndex] };
      const sets = [...ex.sets];
      sets[setIndex] = { ...sets[setIndex], completed: !sets[setIndex].completed };
      ex.sets = sets;
      next[exerciseIndex] = ex;
      return next;
    });
    setExercises((prev) => {
      const setId = prev[exerciseIndex]?.sets[setIndex]?.id;
      if (!setId) return prev;
      setCompletedSetIds((ids) => {
        const next = new Set(ids);
        if (next.has(setId)) next.delete(setId);
        else next.add(setId);
        return next;
      });
      return prev;
    });
  }, []);

  const updateSetField = useCallback(
    (
      exerciseIndex: number,
      setIndex: number,
      field: keyof TrainingSet,
      value: number | string | null,
    ) => {
      setExercises((prev) => {
        const next = [...prev];
        const ex = { ...next[exerciseIndex] };
        const sets = [...ex.sets];
        sets[setIndex] = { ...sets[setIndex], [field]: value };
        ex.sets = sets;
        next[exerciseIndex] = ex;
        return next;
      });
    },
    [],
  );

  const currentStep = focusSteps[currentStepIdx] ?? null;
  const currentExercise = currentStep ? exercises[currentStep.exerciseIndex] : null;
  const currentSet = currentExercise?.sets[currentStep?.setIndex ?? 0] ?? null;
  const progress = focusSteps.length > 0 ? currentStepIdx / focusSteps.length : 0;

  const value = useMemo<TrainingSessionContextValue>(
    () => ({
      exercises,
      supersets,
      focusSteps,
      displayGroups,
      currentStepIdx,
      completedSetIds,
      elapsed,
      isRunning,
      phase,
      countdown,
      viewMode,
      showSummary,
      workoutName,
      currentStep,
      currentExercise,
      currentSet,
      progress,
      setViewMode,
      togglePlayPause,
      stopSession,
      goNext,
      goPrev,
      toggleSetComplete,
      updateSetField,
      closeSummary: () => setShowSummary(false),
    }),
    [
      exercises, supersets, focusSteps, displayGroups, currentStepIdx, completedSetIds,
      elapsed, isRunning, phase, countdown, viewMode, showSummary, workoutName,
      currentStep, currentExercise, currentSet, progress,
      setViewMode, togglePlayPause, stopSession, goNext, goPrev,
      toggleSetComplete, updateSetField,
    ],
  );

  return (
    <TrainingSessionContext.Provider value={value}>
      {children}
    </TrainingSessionContext.Provider>
  );
}

export function useTrainingSession(): TrainingSessionContextValue {
  const ctx = useContext(TrainingSessionContext);
  if (!ctx) throw new Error('useTrainingSession must be inside <TrainingSessionProvider>');
  return ctx;
}
