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
  Dumbbell,
  Coffee,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AutoplayItem, AutoplayBlock } from '../types/autoplay';
import { formatTime, formatElapsed } from '../utils/formatTime';

interface FlatItem extends AutoplayItem {
  /** Which round of the block this item belongs to (1-indexed), or undefined if loose */
  blockRound?: number;
  /** Total rounds of the block, or undefined if loose */
  blockTotalRounds?: number;
  /** Block name if applicable */
  blockName?: string;
}

function flattenItems(items: AutoplayItem[], blocks: AutoplayBlock[]): FlatItem[] {
  const blockMap = new Map(blocks.map((b) => [b.id, b]));
  const result: FlatItem[] = [];

  // Group consecutive items by blockId, maintaining order
  type Segment =
    | { type: 'block'; block: AutoplayBlock; items: AutoplayItem[] }
    | { type: 'loose'; items: AutoplayItem[] };

  const segments: Segment[] = [];
  for (const item of items) {
    const bid = item.blockId;
    if (bid && blockMap.has(bid)) {
      const block = blockMap.get(bid)!;
      const last = segments[segments.length - 1];
      if (last && last.type === 'block' && last.block.id === bid) {
        last.items.push(item);
      } else {
        segments.push({ type: 'block', block, items: [item] });
      }
    } else {
      const last = segments[segments.length - 1];
      if (last && last.type === 'loose') {
        last.items.push(item);
      } else {
        segments.push({ type: 'loose', items: [item] });
      }
    }
  }

  for (const seg of segments) {
    if (seg.type === 'block') {
      const rounds = seg.block.rounds;
      for (let r = 1; r <= rounds; r++) {
        for (const item of seg.items) {
          const repeat = item.repeat ?? 1;
          for (let rep = 0; rep < repeat; rep++) {
            result.push({
              ...item,
              id: `${item.id}-r${r}-rep${rep}`,
              blockRound: r,
              blockTotalRounds: rounds,
              blockName: seg.block.name,
            });
          }
        }
      }
    } else {
      for (const item of seg.items) {
        const repeat = item.repeat ?? 1;
        for (let rep = 0; rep < repeat; rep++) {
          result.push({
            ...item,
            id: repeat > 1 ? `${item.id}-rep${rep}` : item.id,
          });
        }
      }
    }
  }

  return result;
}

interface AutoplayExecutionPageProps {
  items: AutoplayItem[];
  blocks: AutoplayBlock[];
  workoutName: string;
  onBack: () => void;
  onFinish: () => void;
}

type Phase = 'prestart' | 'running' | 'paused' | 'finished';

// --- Summary Modal ---
function SummaryModal({
  totalElapsed,
  exerciseTime,
  restTime,
  itemsCompleted,
  totalItems,
  onClose,
}: {
  totalElapsed: number;
  exerciseTime: number;
  restTime: number;
  itemsCompleted: number;
  totalItems: number;
  onClose: () => void;
}) {
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

        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-lg font-bold text-gray-900">{formatElapsed(totalElapsed)}</div>
            <div className="text-[10px] text-gray-400 uppercase font-bold">Tempo total</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-lg font-bold text-gray-900">
              {itemsCompleted}/{totalItems}
            </div>
            <div className="text-[10px] text-gray-400 uppercase font-bold">Itens</div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-3">
            <div className="text-lg font-bold text-yellow-700">{formatElapsed(exerciseTime)}</div>
            <div className="text-[10px] text-yellow-500 uppercase font-bold">Exercicio</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-lg font-bold text-gray-600">{formatElapsed(restTime)}</div>
            <div className="text-[10px] text-gray-400 uppercase font-bold">Descanso</div>
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

// --- Pre-start countdown overlay ---
function PreStartOverlay({ count }: { count: number }) {
  const label = count === 0 ? 'VAI!' : String(count);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-900/90 z-50 flex items-center justify-center"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={count}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="text-8xl font-black text-white"
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}

// --- Progress ring SVG ---
function ProgressRing({
  progress,
  size = 180,
  strokeWidth = 8,
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

// --- Main component ---
export function AutoplayExecutionPage({
  items,
  blocks,
  workoutName,
  onBack,
  onFinish,
}: AutoplayExecutionPageProps) {
  const flatItems = useMemo(() => flattenItems(items, blocks), [items, blocks]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(flatItems[0]?.duration ?? 0);
  const [phase, setPhase] = useState<Phase>('prestart');
  const [preStartCount, setPreStartCount] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [exerciseTime, setExerciseTime] = useState(0);
  const [restTime, setRestTime] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [itemsCompleted, setItemsCompleted] = useState(0);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const currentItem = flatItems[currentIndex];
  const nextItem = currentIndex < flatItems.length - 1 ? flatItems[currentIndex + 1] : null;
  const isExercise = currentItem?.type === 'exercise';
  const initialDuration = currentItem?.duration ?? 0;

  // Pre-start countdown
  useEffect(() => {
    if (phase !== 'prestart') return;
    if (preStartCount < 0) {
      setPhase('running');
      return;
    }
    const timer = setTimeout(() => setPreStartCount((c) => c - 1), 800);
    return () => clearTimeout(timer);
  }, [phase, preStartCount]);

  // Main countdown timer
  useEffect(() => {
    if (phase !== 'running') return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Item finished
          const idx = currentIndexRef.current;
          setItemsCompleted((c) => c + 1);
          if (idx >= flatItems.length - 1) {
            setPhase('finished');
            setShowSummary(true);
            return 0;
          }
          const nextIdx = idx + 1;
          setCurrentIndex(nextIdx);
          return flatItems[nextIdx].duration;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, flatItems]);

  // Elapsed timer
  useEffect(() => {
    if (phase !== 'running') return;
    const interval = setInterval(() => {
      setElapsed((e) => e + 1);
      if (flatItems[currentIndexRef.current]?.type === 'exercise') {
        setExerciseTime((t) => t + 1);
      } else {
        setRestTime((t) => t + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, flatItems]);

  const handlePause = useCallback(() => {
    setPhase((p) => (p === 'running' ? 'paused' : 'running'));
  }, []);

  const handleSkipForward = useCallback(() => {
    if (currentIndex >= flatItems.length - 1) {
      setItemsCompleted((c) => c + 1);
      setPhase('finished');
      setShowSummary(true);
      return;
    }
    setItemsCompleted((c) => c + 1);
    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);
    setCountdown(flatItems[nextIdx].duration);
  }, [currentIndex, flatItems]);

  const handleSkipBack = useCallback(() => {
    if (currentIndex <= 0) {
      setCountdown(flatItems[0]?.duration ?? 0);
      return;
    }
    const prevIdx = currentIndex - 1;
    setCurrentIndex(prevIdx);
    setCountdown(flatItems[prevIdx].duration);
  }, [currentIndex, flatItems]);

  const handleStop = useCallback(() => {
    setPhase('finished');
    setShowSummary(true);
  }, []);

  const formatDurationLabel = (seconds: number): string => {
    if (seconds >= 60) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return s > 0 ? `${m}min ${s}s` : `${m}min`;
    }
    return `${seconds}s`;
  };

  if (!currentItem) return null;

  const progress = initialDuration > 0 ? countdown / initialDuration : 0;
  const ringColor = isExercise ? '#facc15' : '#9ca3af';
  const bgClass = isExercise ? 'bg-yellow-50' : 'bg-gray-50';
  const badgeClass = isExercise
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-gray-200 text-gray-600';
  const badgeLabel = isExercise ? 'EXERCICIO' : 'DESCANSO';
  const BadgeIcon = isExercise ? Dumbbell : Coffee;

  return (
    <div className={`min-h-screen flex justify-center ${bgClass} transition-colors duration-500`}>
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
                <h1 className="font-bold text-gray-900 text-base truncate">{workoutName}</h1>
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

      {/* Segmented progress bar */}
      <div className="px-4 py-3">
        <div className="flex gap-1">
          {flatItems.map((item, i) => {
            let fillPercent = 0;
            if (i < currentIndex) fillPercent = 100;
            else if (i === currentIndex && initialDuration > 0) {
              fillPercent = ((initialDuration - countdown) / initialDuration) * 100;
            }
            const barColor = item.type === 'exercise' ? 'bg-yellow-400' : 'bg-gray-400';
            return (
              <div key={item.id} className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-linear ${barColor}`}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            );
          })}
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
            {/* Badge */}
            <div className="flex items-center gap-2 mb-4">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${badgeClass}`}>
                <BadgeIcon size={14} />
                {badgeLabel}
              </div>
              {currentItem.blockRound != null && (currentItem.blockTotalRounds ?? 1) > 1 && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700">
                  Round {currentItem.blockRound}/{currentItem.blockTotalRounds}
                </div>
              )}
            </div>

            {/* Name */}
            <h2 className="text-3xl font-black text-gray-900 mb-1">{currentItem.name}</h2>
            {isExercise && (currentItem.equipment || currentItem.category) && (
              <p className="text-sm text-gray-400 mb-6">
                {[currentItem.category, currentItem.equipment].filter(Boolean).join(' · ')}
              </p>
            )}
            {!isExercise && <div className="mb-6" />}

            {/* Ring + countdown */}
            <div className="relative w-[200px] h-[200px] mb-6">
              <ProgressRing progress={progress} size={200} strokeWidth={10} color={ringColor} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-black text-gray-900 tabular-nums">
                  {formatTime(countdown)}
                </span>
              </div>
            </div>

            {/* Label / notes */}
            {currentItem.label && (
              <p className="text-sm text-gray-500 bg-white/80 px-4 py-2 rounded-xl mb-4">
                {currentItem.label}
              </p>
            )}

            {/* Indicator */}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              {currentIndex + 1} de {flatItems.length}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Preview next item */}
      {nextItem && (
        <div className="text-center pb-4 px-4">
          <p className="text-xs text-gray-400">
            A seguir:{' '}
            <span className="font-bold text-gray-600">{nextItem.name}</span>
            {' - '}
            {formatDurationLabel(nextItem.duration)}
          </p>
        </div>
      )}

      {/* Controls bar */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-gray-100">
        <div className="px-4 py-4 flex items-center justify-center gap-6">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSkipBack}
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
            onClick={handleSkipForward}
            className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <SkipForward size={20} />
          </motion.button>
        </div>
      </div>

     </div>
      {/* Pre-start overlay */}
      <AnimatePresence>
        {phase === 'prestart' && preStartCount >= 0 && (
          <PreStartOverlay count={preStartCount} />
        )}
      </AnimatePresence>

      {/* Summary modal */}
      <AnimatePresence>
        {showSummary && (
          <SummaryModal
            totalElapsed={elapsed}
            exerciseTime={exerciseTime}
            restTime={restTime}
            itemsCompleted={itemsCompleted}
            totalItems={flatItems.length}
            onClose={onFinish}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
