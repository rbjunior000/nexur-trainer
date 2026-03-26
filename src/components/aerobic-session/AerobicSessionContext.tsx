import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { AerobicWorkout, BlockStep, IntensityZone } from '../../types/aerobic';
import { parseDurationToSeconds } from '../../utils/formatTime';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ExecutableStep {
  blockIndex: number;
  blockName: string;
  blockRepetition: number;
  totalBlockRepetitions: number;
  stepIndex: number;
  step: BlockStep;
  globalIndex: number;
}

type Phase = 'running' | 'paused' | 'finished';

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function flattenSteps(workout: AerobicWorkout): ExecutableStep[] {
  const result: ExecutableStep[] = [];
  let globalIndex = 0;
  workout.blocks.forEach((block, blockIndex) => {
    for (let rep = 1; rep <= block.repetitions; rep++) {
      block.steps.forEach((step, stepIndex) => {
        result.push({
          blockIndex,
          blockName: block.name,
          blockRepetition: rep,
          totalBlockRepetitions: block.repetitions,
          stepIndex,
          step,
          globalIndex: globalIndex++,
        });
      });
    }
  });
  return result;
}

const INIT_ZONE_TIME = (): Record<IntensityZone, number> => ({
  '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '5a': 0, '5b': 0, '5c': 0,
});

// ─── Context value ──────────────────────────────────────────────────────────────

export interface AerobicSessionContextValue {
  workout: AerobicWorkout;
  steps: ExecutableStep[];
  currentIndex: number;
  currentStep: ExecutableStep | null;
  nextStep: ExecutableStep | null;

  timer: number;            // countdown (TIME) or count-up (DISTANCE)
  elapsed: number;          // total session elapsed seconds
  phase: Phase;
  zoneTime: Record<IntensityZone, number>;
  stepsCompleted: number;
  showSummary: boolean;

  // derived
  isTimeStep: boolean;
  stepDurationSec: number;
  progress: number;         // 0–1 for current TIME step
  completedBlockCount: number;

  togglePlayPause: () => void;
  goNext: () => void;
  goPrev: () => void;
  stop: () => void;
  closeSummary: () => void;
}

// ─── Context ───────────────────────────────────────────────────────────────────

const AerobicSessionContext = createContext<AerobicSessionContextValue | null>(null);

export interface AerobicSessionProviderProps {
  workout: AerobicWorkout;
  onFinish: () => void;
  children: ReactNode;
}

/** Context Provider for the aerobic execution session. */
export function AerobicSessionProvider({
  workout,
  onFinish,
  children,
}: AerobicSessionProviderProps) {
  const steps = useMemo(() => flattenSteps(workout), [workout]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [phase, setPhase] = useState<Phase>('running');
  const [elapsed, setElapsed] = useState(0);
  const [stepsCompleted, setStepsCompleted] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [zoneTime, setZoneTime] = useState<Record<IntensityZone, number>>(INIT_ZONE_TIME);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const currentStep = steps[currentIndex] ?? null;
  const nextStep = currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;

  const isTimeStep = currentStep?.step.durationType === 'TIME';
  const stepDurationSec = isTimeStep ? parseDurationToSeconds(currentStep!.step.duration) : 0;

  // Initialize timer when step changes
  useEffect(() => {
    setTimer(isTimeStep ? stepDurationSec : 0);
  }, [currentIndex, isTimeStep, stepDurationSec]);

  // Main timer tick
  useEffect(() => {
    if (phase !== 'running' || !currentStep) return;
    const id = setInterval(() => {
      if (isTimeStep) {
        setTimer((prev) => {
          if (prev <= 1) {
            const idx = currentIndexRef.current;
            setStepsCompleted((c) => c + 1);
            if (idx >= steps.length - 1) {
              setPhase('finished');
              setShowSummary(true);
              return 0;
            }
            setCurrentIndex(idx + 1);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setTimer((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, isTimeStep, steps, currentStep]);

  // Elapsed + zone time tracking
  useEffect(() => {
    if (phase !== 'running' || !currentStep) return;
    const id = setInterval(() => {
      setElapsed((e) => e + 1);
      setZoneTime((zt) => ({
        ...zt,
        [currentStep.step.intensity]: zt[currentStep.step.intensity] + 1,
      }));
    }, 1000);
    return () => clearInterval(id);
  }, [phase, currentStep]);

  const togglePlayPause = useCallback(() => {
    setPhase((p) => (p === 'running' ? 'paused' : 'running'));
  }, []);

  const goNext = useCallback(() => {
    setStepsCompleted((c) => c + 1);
    if (currentIndexRef.current >= steps.length - 1) {
      setPhase('finished');
      setShowSummary(true);
      return;
    }
    setCurrentIndex(currentIndexRef.current + 1);
  }, [steps]);

  const goPrev = useCallback(() => {
    if (currentIndexRef.current <= 0) {
      setTimer(isTimeStep ? stepDurationSec : 0);
      return;
    }
    setCurrentIndex(currentIndexRef.current - 1);
  }, [isTimeStep, stepDurationSec]);

  const stop = useCallback(() => {
    setPhase('finished');
    setShowSummary(true);
  }, []);

  const closeSummary = useCallback(() => {
    setShowSummary(false);
    onFinish();
  }, [onFinish]);

  const progress = isTimeStep && stepDurationSec > 0 ? timer / stepDurationSec : 0;

  const completedBlockCount = useMemo(() => {
    const set = new Set<number>();
    steps.forEach((s, i) => {
      if (i < currentIndex || (i === currentIndex && phase === 'finished')) {
        set.add(s.blockIndex);
      }
    });
    return set.size;
  }, [steps, currentIndex, phase]);

  const value = useMemo<AerobicSessionContextValue>(
    () => ({
      workout,
      steps,
      currentIndex,
      currentStep,
      nextStep,
      timer,
      elapsed,
      phase,
      zoneTime,
      stepsCompleted,
      showSummary,
      isTimeStep,
      stepDurationSec,
      progress,
      completedBlockCount,
      togglePlayPause,
      goNext,
      goPrev,
      stop,
      closeSummary,
    }),
    [
      workout, steps, currentIndex, currentStep, nextStep,
      timer, elapsed, phase, zoneTime, stepsCompleted, showSummary,
      isTimeStep, stepDurationSec, progress, completedBlockCount,
      togglePlayPause, goNext, goPrev, stop, closeSummary,
    ],
  );

  return (
    <AerobicSessionContext.Provider value={value}>
      {children}
    </AerobicSessionContext.Provider>
  );
}

export function useAerobicSession(): AerobicSessionContextValue {
  const ctx = useContext(AerobicSessionContext);
  if (!ctx) throw new Error('useAerobicSession must be inside <AerobicSessionProvider>');
  return ctx;
}
