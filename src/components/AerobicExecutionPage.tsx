import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Square,
  Trophy,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AerobicWorkout, BlockStep, IntensityZone } from '../types/aerobic';
import { INTENSITY_LABELS, ZONE_COLORS, SPORT_LABELS } from '../types/aerobic';
import { formatTime, formatElapsed, parseDurationToSeconds } from '../utils/formatTime';

// --- Types ---
interface ExecutableStep {
  blockIndex: number;
  blockName: string;
  blockRepetition: number;
  totalBlockRepetitions: number;
  stepIndex: number;
  step: BlockStep;
  globalIndex: number;
}

interface AerobicExecutionPageProps {
  workout: AerobicWorkout;
  onBack: () => void;
  onFinish: () => void;
}

type Phase = 'running' | 'paused' | 'finished';

// --- Zone hex colors for SVG ---
const ZONE_HEX: Record<IntensityZone, string> = {
  '1': '#3b82f6',
  '2': '#14b8a6',
  '3': '#eab308',
  '4': '#f97316',
  '5': '#ef4444',
  '5a': '#ef4444',
  '5b': '#dc2626',
  '5c': '#b91c1c',
};

// --- Zone background colors ---
const ZONE_BG: Record<IntensityZone, string> = {
  '1': 'bg-blue-50',
  '2': 'bg-teal-50',
  '3': 'bg-yellow-50',
  '4': 'bg-orange-50',
  '5': 'bg-red-50',
  '5a': 'bg-red-50',
  '5b': 'bg-red-50',
  '5c': 'bg-red-50',
};

// --- Flatten blocks into executable steps ---
function flattenSteps(workout: AerobicWorkout): ExecutableStep[] {
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

// --- Progress ring SVG ---
function ProgressRing({
  progress,
  size = 200,
  strokeWidth = 10,
  color,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#f3f4f6"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-linear"
      />
    </svg>
  );
}

// --- Summary Modal ---
function SummaryModal({
  totalElapsed,
  blocksCompleted,
  stepsCompleted,
  totalSteps,
  zoneTime,
  onClose,
}: {
  totalElapsed: number;
  blocksCompleted: number;
  stepsCompleted: number;
  totalSteps: number;
  zoneTime: Record<string, number>;
  onClose: () => void;
}) {
  const maxZoneTime = Math.max(...Object.values(zoneTime), 1);
  const usedZones = (Object.entries(zoneTime) as [IntensityZone, number][]).filter(
    ([, t]) => t > 0
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
        className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy size={32} className="text-yellow-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Treino concluido!</h2>
        <p className="text-gray-500 text-sm mb-6">Parabens pelo treino de hoje</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-lg font-bold text-gray-900">{formatElapsed(totalElapsed)}</div>
            <div className="text-[10px] text-gray-400 uppercase font-bold">Duracao</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-lg font-bold text-gray-900">{blocksCompleted}</div>
            <div className="text-[10px] text-gray-400 uppercase font-bold">Blocos</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-lg font-bold text-gray-900">
              {stepsCompleted}/{totalSteps}
            </div>
            <div className="text-[10px] text-gray-400 uppercase font-bold">Steps</div>
          </div>
        </div>

        {/* Zone distribution */}
        {usedZones.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
              Tempo por zona
            </h3>
            <div className="space-y-2">
              {usedZones.map(([zone, time]) => (
                <div key={zone} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 w-10 text-right">
                    {INTENSITY_LABELS[zone]}
                  </span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${ZONE_COLORS[zone]}`}
                      style={{ width: `${(time / maxZoneTime) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-500 w-12 tabular-nums">
                    {formatElapsed(time)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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

// --- Main component ---
export function AerobicExecutionPage({
  workout,
  onBack,
  onFinish,
}: AerobicExecutionPageProps) {
  const steps = useMemo(() => flattenSteps(workout), [workout]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [phase, setPhase] = useState<Phase>('running');
  const [elapsed, setElapsed] = useState(0);
  const [stepsCompleted, setStepsCompleted] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  const initZoneTime = (): Record<IntensityZone, number> => ({
    '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '5a': 0, '5b': 0, '5c': 0,
  });
  const [zoneTime, setZoneTime] = useState<Record<IntensityZone, number>>(initZoneTime);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const currentStep = steps[currentIndex];
  const nextStep = currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;

  const isTimeStep = currentStep?.step.durationType === 'TIME';
  const stepDurationSec = isTimeStep ? parseDurationToSeconds(currentStep.step.duration) : 0;

  // Initialize timer for current step
  useEffect(() => {
    if (isTimeStep) {
      setTimer(stepDurationSec);
    } else {
      setTimer(0);
    }
  }, [currentIndex, isTimeStep, stepDurationSec]);

  // Countdown / count-up timer
  useEffect(() => {
    if (phase !== 'running' || !currentStep) return;
    const interval = setInterval(() => {
      if (isTimeStep) {
        setTimer((prev) => {
          if (prev <= 1) {
            // Step finished
            const idx = currentIndexRef.current;
            setStepsCompleted((c) => c + 1);
            if (idx >= steps.length - 1) {
              setPhase('finished');
              setShowSummary(true);
              return 0;
            }
            setCurrentIndex(idx + 1);
            return 0; // will be re-set by the useEffect above
          }
          return prev - 1;
        });
      } else {
        // Distance step: count up
        setTimer((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, isTimeStep, steps, currentStep]);

  // Elapsed timer + zone time tracking
  useEffect(() => {
    if (phase !== 'running' || !currentStep) return;
    const interval = setInterval(() => {
      setElapsed((e) => e + 1);
      setZoneTime((zt) => ({
        ...zt,
        [currentStep.step.intensity]: zt[currentStep.step.intensity] + 1,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, currentStep]);

  const handlePause = useCallback(() => {
    setPhase((p) => (p === 'running' ? 'paused' : 'running'));
  }, []);

  const advanceStep = useCallback(() => {
    setStepsCompleted((c) => c + 1);
    if (currentIndex >= steps.length - 1) {
      setPhase('finished');
      setShowSummary(true);
      return;
    }
    setCurrentIndex(currentIndex + 1);
  }, [currentIndex, steps]);

  const handlePrevStep = useCallback(() => {
    if (currentIndex <= 0) {
      if (isTimeStep) setTimer(stepDurationSec);
      else setTimer(0);
      return;
    }
    setCurrentIndex(currentIndex - 1);
  }, [currentIndex, isTimeStep, stepDurationSec]);

  const handleStop = useCallback(() => {
    setPhase('finished');
    setShowSummary(true);
  }, []);

  // Compute completed blocks
  const completedBlockIndices = useMemo(() => {
    const set = new Set<number>();
    steps.forEach((s, i) => {
      if (i < currentIndex || (i === currentIndex && phase === 'finished')) {
        set.add(s.blockIndex);
      }
    });
    return set;
  }, [steps, currentIndex, phase]);

  if (!currentStep || steps.length === 0) return null;

  const zone = currentStep.step.intensity;
  const zoneHex = ZONE_HEX[zone];
  const zoneBg = ZONE_BG[zone];
  const zoneLabel = INTENSITY_LABELS[zone];
  const zoneShort = zone.startsWith('5') && zone.length > 1 ? `Z${zone}` : `Z${zone}`;

  // Progress for TIME steps
  const progress = isTimeStep && stepDurationSec > 0 ? timer / stepDurationSec : 0;

  // Block context dots
  const currentBlock = workout.blocks[currentStep.blockIndex];
  const stepsInBlock = currentBlock?.steps.length ?? 0;

  const formatStepDuration = (s: BlockStep) => {
    if (s.durationType === 'DISTANCE') return `${s.duration}m`;
    const sec = parseDurationToSeconds(s.duration);
    if (sec >= 60) {
      const m = Math.floor(sec / 60);
      const rem = sec % 60;
      return rem > 0 ? `${m}min ${rem}s` : `${m}min`;
    }
    return `${sec}s`;
  };

  return (
    <motion.div
      animate={{ backgroundColor: undefined }}
      className={`min-h-screen flex justify-center transition-colors duration-500 ${zoneBg}`}
    >
     <div className="w-full max-w-lg flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-gray-900 text-base truncate">
                    {workout.workoutName}
                  </h1>
                  <span className="px-2 py-0.5 bg-gray-100 rounded-md text-[10px] font-bold text-gray-500 uppercase">
                    {SPORT_LABELS[workout.sport]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock size={12} />
                  <span className="tabular-nums">{formatElapsed(elapsed)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors"
            >
              <Square size={14} />
              Parar
            </button>
          </div>
        </div>
      </div>

      {/* Zone-colored segmented progress bar */}
      <div className="px-4 py-3">
        <div className="flex gap-0.5">
          {steps.map((s, i) => {
            let fillPercent = 0;
            if (i < currentIndex) fillPercent = 100;
            else if (i === currentIndex) {
              if (isTimeStep && stepDurationSec > 0) {
                fillPercent = ((stepDurationSec - timer) / stepDurationSec) * 100;
              }
            }
            return (
              <div
                key={s.globalIndex}
                className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden"
              >
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-linear ${ZONE_COLORS[s.step.intensity]}`}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Block context */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-3">
          <p className="text-xs font-bold text-gray-500">
            Bloco: {currentStep.blockName}
            {currentStep.totalBlockRepetitions > 1 && (
              <span className="text-gray-400">
                {' '}- Volta {currentStep.blockRepetition} de {currentStep.totalBlockRepetitions}
              </span>
            )}
          </p>
          <div className="flex gap-1">
            {Array.from({ length: stepsInBlock }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentStep.stepIndex
                    ? ZONE_COLORS[zone]
                    : i < currentStep.stepIndex
                    ? 'bg-gray-400'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Hero central */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center text-center w-full max-w-md"
          >
            {/* Zone circle */}
            <div className="relative w-[200px] h-[200px] mb-6">
              {isTimeStep ? (
                <ProgressRing progress={progress} size={200} strokeWidth={10} color={zoneHex} />
              ) : (
                <ProgressRing progress={1} size={200} strokeWidth={10} color={zoneHex} />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-3xl font-black tabular-nums"
                  style={{ color: zoneHex }}
                >
                  {zoneShort}
                </span>
                <span className="text-xs font-bold text-gray-400 uppercase">
                  {zoneLabel}
                </span>
              </div>
            </div>

            {/* Step name */}
            <h2 className="text-2xl font-black text-gray-900 mb-2">{currentStep.step.name}</h2>

            {/* Timer */}
            <div className="text-4xl font-black text-gray-900 tabular-nums mb-2">
              {isTimeStep ? formatTime(timer) : formatElapsed(timer)}
            </div>
            <p className="text-xs text-gray-400 mb-4">
              {isTimeStep ? 'Countdown' : 'Distancia: ' + currentStep.step.duration + 'm'}
            </p>

            {/* Step indicator */}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              {currentIndex + 1} de {steps.length}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Preview next step */}
      {nextStep && (
        <div className="text-center pb-4 px-4">
          <p className="text-xs text-gray-400">
            Proximo:{' '}
            <span className="font-bold text-gray-600">{nextStep.step.name}</span>
            {' - '}
            <span className="font-bold" style={{ color: ZONE_HEX[nextStep.step.intensity] }}>
              Z{nextStep.step.intensity}
            </span>
            {' - '}
            {formatStepDuration(nextStep.step)}
          </p>
        </div>
      )}

      {/* Controls bar */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-gray-100">
        <div className="px-4 py-4 flex items-center justify-center gap-6">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handlePrevStep}
            className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <SkipBack size={20} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handlePause}
            className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-white shadow-lg hover:bg-gray-800 transition-colors"
          >
            {phase === 'paused' ? <Play size={28} /> : <Pause size={28} />}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={advanceStep}
            className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <SkipForward size={20} />
          </motion.button>

          {/* Distance step: "Concluir Passo" button */}
          {!isTimeStep && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={advanceStep}
              className="px-5 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-colors"
              style={{ backgroundColor: zoneHex }}
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 size={18} />
                Concluir Passo
              </span>
            </motion.button>
          )}
        </div>
      </div>

     </div>
      {/* Summary modal */}
      <AnimatePresence>
        {showSummary && (
          <SummaryModal
            totalElapsed={elapsed}
            blocksCompleted={completedBlockIndices.size}
            stepsCompleted={stepsCompleted}
            totalSteps={steps.length}
            zoneTime={zoneTime}
            onClose={onFinish}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
