import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  Check,
  Clock,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  MessageSquare,
  RefreshCw,
  Zap,
  Trophy,
  Flame,
  Timer,
  Dumbbell,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface TrainingSet {
  id: string;
  reps?: number;
  weight?: number;
  duration?: string;
  distance?: number;
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
  restTime: number; // seconds
  notes: string;
  supersetId?: string;
}

interface SupersetGroup {
  id: string;
  label: string;
  exerciseIds: string[];
  rounds: number;
  restBetweenRounds: number;
}

// --- Mock Data ---
const MOCK_EXERCISES: TrainingExercise[] = [
  {
    id: '1',
    name: 'Supino Reto',
    thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop',
    category: 'Peito',
    equipment: 'Barra',
    typeLabel: 'Weight Reps',
    typeColor: 'text-blue-700',
    typeBg: 'bg-blue-100',
    restTime: 60,
    notes: '',
    sets: [
      { id: 's1', reps: 12, weight: 20, completed: false },
      { id: 's2', reps: 10, weight: 25, completed: false },
      { id: 's3', reps: 8, weight: 30, completed: false },
    ],
  },
  {
    id: '2a',
    name: 'Rosca Direta',
    thumbnail: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop',
    category: 'Biceps',
    equipment: 'Haltere',
    typeLabel: 'Weight Reps',
    typeColor: 'text-blue-700',
    typeBg: 'bg-blue-100',
    restTime: 0,
    notes: '',
    supersetId: 'ss1',
    sets: [
      { id: 's1', reps: 12, weight: 10, completed: false },
      { id: 's2', reps: 10, weight: 12, completed: false },
      { id: 's3', reps: 8, weight: 14, completed: false },
    ],
  },
  {
    id: '2b',
    name: 'Triceps Corda',
    thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
    category: 'Triceps',
    equipment: 'Cabo',
    typeLabel: 'Weight Reps',
    typeColor: 'text-blue-700',
    typeBg: 'bg-blue-100',
    restTime: 0,
    notes: '',
    supersetId: 'ss1',
    sets: [
      { id: 's1', reps: 12, weight: 15, completed: false },
      { id: 's2', reps: 10, weight: 20, completed: false },
      { id: 's3', reps: 8, weight: 20, completed: false },
    ],
  },
  {
    id: '3',
    name: 'Prancha',
    thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop',
    category: 'Core',
    equipment: 'Chao',
    typeLabel: 'Duration',
    typeColor: 'text-teal-700',
    typeBg: 'bg-teal-100',
    restTime: 30,
    notes: 'Manter coluna reta',
    sets: [
      { id: 's1', duration: '00:45', completed: false },
      { id: 's2', duration: '01:00', completed: false },
      { id: 's3', duration: '01:00', completed: false },
    ],
  },
  {
    id: '4',
    name: 'Agachamento Bulgaro',
    thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop',
    category: 'Pernas',
    equipment: 'Haltere',
    typeLabel: 'Weight Reps',
    typeColor: 'text-blue-700',
    typeBg: 'bg-blue-100',
    restTime: 90,
    notes: '',
    sets: [
      { id: 's1', reps: 10, weight: 12, completed: false },
      { id: 's2', reps: 8, weight: 14, completed: false },
      { id: 's3', reps: 8, weight: 16, completed: false },
    ],
  },
];



const MOCK_SUPERSETS: SupersetGroup[] = [
  {
    id: 'ss1',
    label: 'Superset A',
    exerciseIds: ['2a', '2b'],
    rounds: 3,
    restBetweenRounds: 90,
  },
];

// --- Helpers ---
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// --- Rest Timer Modal ---
function RestTimerModal({
  seconds,
  onSkip,
  onAddTime,
}: {
  seconds: number;
  onSkip: () => void;
  onAddTime: (s: number) => void;
}) {
  const progress = seconds > 0 ? 1 : 0;
  const circumference = 2 * Math.PI * 54;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white rounded-3xl p-8 w-80 text-center shadow-2xl"
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <Clock size={20} className="text-yellow-500" />
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Descanso
          </span>
        </div>

        <div className="relative w-32 h-32 mx-auto mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#f3f4f6" strokeWidth="6" />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#facc15"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-gray-900 tabular-nums">
              {formatTime(seconds)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={() => onAddTime(-15)}
            className="px-3 py-1.5 text-xs font-bold text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            -15s
          </button>
          <button
            onClick={() => onAddTime(15)}
            className="px-3 py-1.5 text-xs font-bold text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            +15s
          </button>
          <button
            onClick={() => onAddTime(30)}
            className="px-3 py-1.5 text-xs font-bold text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            +30s
          </button>
        </div>

        <button
          onClick={onSkip}
          className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          <SkipForward size={18} />
          Pular descanso
        </button>
      </motion.div>
    </motion.div>
  );
}


// --- Editable Set Value ---
function EditableValue({
  value,
  suffix,
  onChange,
}: {
  value: string | number;
  suffix?: string;
  onChange: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [tempVal, setTempVal] = useState(String(value));

  if (editing) {
    return (
      <input
        autoFocus
        type="text"
        value={tempVal}
        onChange={(e) => setTempVal(e.target.value)}
        onBlur={() => {
          onChange(tempVal);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onChange(tempVal);
            setEditing(false);
          }
        }}
        className="w-14 text-center bg-white border border-yellow-400 rounded-md py-0.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
      />
    );
  }

  return (
    <button
      onClick={() => {
        setTempVal(String(value));
        setEditing(true);
      }}
      className="text-sm font-bold text-gray-700 hover:text-yellow-600 transition-colors tabular-nums cursor-pointer"
    >
      {value}
      {suffix && <span className="text-xs text-gray-400 ml-0.5">{suffix}</span>}
    </button>
  );
}

// --- Exercise Actions Menu ---
function ExerciseActionsMenu({ onClose }: { onClose: () => void }) {
  const actions = [
    { icon: RefreshCw, label: 'Trocar exercicio', color: 'text-gray-600' },
    { icon: MessageSquare, label: 'Adicionar nota', color: 'text-gray-600' },
    { icon: SkipForward, label: 'Pular exercicio', color: 'text-orange-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-30 py-1 overflow-hidden"
    >
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={onClose}
          className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
        >
          <action.icon size={16} className={action.color} />
          <span className={action.color}>{action.label}</span>
        </button>
      ))}
    </motion.div>
  );
}

// --- Training Set Row ---
function TrainingSetRow({
  set,
  index,
  isActive,
  hasWeight,
  hasDuration,
  onToggle,
  onUpdateSet,
}: {
  set: TrainingSet;
  index: number;
  isActive: boolean;
  hasWeight: boolean;
  hasDuration: boolean;
  onToggle: () => void;
  onUpdateSet: (field: string, value: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group ${
        set.completed
          ? 'bg-green-50 border border-green-200'
          : isActive
          ? 'bg-yellow-50 border border-yellow-200'
          : 'bg-gray-50 border border-transparent hover:bg-gray-100'
      }`}
      onClick={onToggle}
    >
      {/* Check circle */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
          set.completed
            ? 'bg-green-500 text-white'
            : isActive
            ? 'border-2 border-yellow-400 bg-yellow-50'
            : 'border-2 border-gray-200 bg-white'
        }`}
      >
        {set.completed ? (
          <Check size={16} strokeWidth={3} />
        ) : (
          <span className="text-xs font-bold text-gray-400">{index + 1}</span>
        )}
      </div>

      {/* Set details */}
      <div className="flex-1 flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
        {hasWeight && set.weight !== undefined && (
          <div className="flex items-center gap-1">
            <EditableValue
              value={set.weight}
              suffix="kg"
              onChange={(v) => onUpdateSet('weight', v)}
            />
          </div>
        )}
        {set.reps !== undefined && (
          <div className="flex items-center gap-1">
            <EditableValue
              value={set.reps}
              suffix="reps"
              onChange={(v) => onUpdateSet('reps', v)}
            />
          </div>
        )}
        {hasDuration && set.duration && (
          <div className="flex items-center gap-1">
            <EditableValue
              value={set.duration}
              onChange={(v) => onUpdateSet('duration', v)}
            />
          </div>
        )}
      </div>

      {/* Status indicator */}
      <div
        className={`text-xs font-bold uppercase tracking-wide ${
          set.completed ? 'text-green-500' : 'text-gray-300'
        }`}
      >
        {set.completed ? 'Feito' : 'Toque'}
      </div>
    </motion.div>
  );
}

// --- Training Exercise Card ---
function TrainingExerciseCard({
  exercise,
  isExpanded,
  isActiveExercise,
  onToggleExpand,
  onToggleSet,
  onUpdateSet,
}: {
  exercise: TrainingExercise;
  isExpanded: boolean;
  isActiveExercise: boolean;
  onToggleExpand: () => void;
  onToggleSet: (setId: string) => void;
  onUpdateSet: (setId: string, field: string, value: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const completedSets = exercise.sets.filter((s) => s.completed).length;
  const totalSets = exercise.sets.length;
  const allDone = completedSets === totalSets;
  const hasWeight = exercise.sets.some((s) => s.weight !== undefined);
  const hasDuration = exercise.sets.some((s) => s.duration !== undefined);
  const nextSetIndex = exercise.sets.findIndex((s) => !s.completed);

  return (
    <motion.div
      layout
      className={`bg-white rounded-2xl border overflow-hidden transition-all ${
        isActiveExercise
          ? 'border-yellow-300 shadow-lg shadow-yellow-100/50'
          : allDone
          ? 'border-green-200 bg-green-50/30'
          : 'border-gray-100 shadow-sm'
      }`}
    >
      {/* Card Header - Always visible, clickable */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          <img
            src={exercise.thumbnail}
            alt={exercise.name}
            className={`w-full h-full object-cover ${allDone ? 'opacity-50' : ''}`}
          />
          {allDone && (
            <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
              <Check size={24} className="text-green-600" strokeWidth={3} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`font-bold text-base truncate ${
                allDone ? 'text-green-700 line-through decoration-2' : 'text-gray-900'
              }`}
            >
              {exercise.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${exercise.typeBg} ${exercise.typeColor}`}
            >
              {exercise.typeLabel}
            </span>
            <span className="text-xs text-gray-400">{exercise.equipment}</span>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className="text-sm font-bold text-gray-900">
              {completedSets}/{totalSets}
            </div>
            <div className="text-[10px] text-gray-400 uppercase">series</div>
          </div>
          <div className="relative w-10 h-10">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke={allDone ? '#22c55e' : '#facc15'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 15}
                strokeDashoffset={
                  2 * Math.PI * 15 * (1 - completedSets / totalSets)
                }
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {isExpanded ? (
                <ChevronUp size={14} className="text-gray-400" />
              ) : (
                <ChevronDown size={14} className="text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {/* Quick actions bar */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                <div className="flex items-center gap-2">
                  {exercise.restTime > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
                      <Timer size={12} className="text-gray-500" />
                      <span className="text-xs font-bold text-gray-600">
                        {exercise.restTime}s
                      </span>
                    </div>
                  )}
                  {exercise.notes && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-full">
                      <MessageSquare size={12} className="text-amber-500" />
                      <span className="text-xs font-medium text-amber-600 truncate max-w-[120px]">
                        {exercise.notes}
                      </span>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  <AnimatePresence>
                    {showMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setShowMenu(false)}
                        />
                        <ExerciseActionsMenu onClose={() => setShowMenu(false)} />
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Sets */}
              <div className="space-y-2">
                {exercise.sets.map((set, idx) => (
                  <TrainingSetRow
                    key={set.id}
                    set={set}
                    index={idx}
                    isActive={idx === nextSetIndex}
                    hasWeight={hasWeight}
                    hasDuration={hasDuration}
                    onToggle={() => onToggleSet(set.id)}
                    onUpdateSet={(field, value) =>
                      onUpdateSet(set.id, field, value)
                    }
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Superset Wrapper ---
function SupersetWrapper({
  superset,
  exercises,
  expandedId,
  activeExerciseId,
  onToggleExpand,
  onToggleSet,
  onUpdateSet,
}: {
  superset: SupersetGroup;
  exercises: TrainingExercise[];
  expandedId: string | null;
  activeExerciseId: string;
  onToggleExpand: (id: string) => void;
  onToggleSet: (exerciseId: string, setId: string) => void;
  onUpdateSet: (exerciseId: string, setId: string, field: string, value: string) => void;
}) {
  return (
    <div className="relative pl-4">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400 rounded-full" />
      <div className="flex items-center gap-2 mb-3 pl-1">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold uppercase tracking-wide">
          <Zap size={12} fill="currentColor" />
          {superset.label}
        </div>
        <span className="text-xs text-gray-400">
          {superset.rounds} rodadas · {superset.restBetweenRounds}s descanso
        </span>
      </div>
      <div className="space-y-3">
        {exercises.map((ex) => (
          <TrainingExerciseCard
            key={ex.id}
            exercise={ex}
            isExpanded={expandedId === ex.id}
            isActiveExercise={activeExerciseId === ex.id}
            onToggleExpand={() => onToggleExpand(ex.id)}
            onToggleSet={(setId) => onToggleSet(ex.id, setId)}
            onUpdateSet={(setId, field, value) =>
              onUpdateSet(ex.id, setId, field, value)
            }
          />
        ))}
      </div>
    </div>
  );
}

// --- Summary Modal ---
function SummaryModal({
  exercises,
  elapsed,
  onClose,
}: {
  exercises: TrainingExercise[];
  elapsed: number;
  onClose: () => void;
}) {
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );
  const totalVolume = exercises.reduce(
    (acc, ex) =>
      acc +
      ex.sets
        .filter((s) => s.completed)
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
            <div className="text-lg font-bold text-gray-900">
              {completedSets}/{totalSets}
            </div>
            <div className="text-[10px] text-gray-400 uppercase font-bold">Series</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-lg font-bold text-gray-900">
              {totalVolume > 1000
                ? `${(totalVolume / 1000).toFixed(1)}t`
                : `${totalVolume}kg`}
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

// --- Main Page ---
export function StrictTrainingPage({ onBack }: { onBack?: () => void }) {
  const [exercises, setExercises] = useState<TrainingExercise[]>(MOCK_EXERCISES);
  const [expandedId, setExpandedId] = useState<string | null>(MOCK_EXERCISES[0]?.id || null);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  // Find first non-completed exercise
  const activeExerciseId =
    exercises.find((ex) => ex.sets.some((s) => !s.completed))?.id || exercises[0]?.id || '';

  // Total progress
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );
  const progress = totalSets > 0 ? completedSets / totalSets : 0;

  // Elapsed timer
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Rest timer countdown
  useEffect(() => {
    if (restTimer === null || restTimer <= 0) return;
    const interval = setInterval(() => {
      setRestTimer((t) => {
        if (t === null || t <= 1) return null;
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [restTimer]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const toggleSet = useCallback(
    (exerciseId: string, setId: string) => {
      setExercises((prev) =>
        prev.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          const newSets = ex.sets.map((s) =>
            s.id === setId ? { ...s, completed: !s.completed } : s
          );
          // If we just completed a set and rest time > 0, show rest timer
          const set = ex.sets.find((s) => s.id === setId);
          if (set && !set.completed && ex.restTime > 0) {
            setRestTimer(ex.restTime);
          }
          return { ...ex, sets: newSets };
        })
      );
      // Auto-start timer on first interaction
      if (!isRunning) setIsRunning(true);
    },
    [isRunning]
  );

  const updateSet = useCallback(
    (exerciseId: string, setId: string, field: string, value: string) => {
      setExercises((prev) =>
        prev.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) =>
              s.id === setId
                ? {
                    ...s,
                    [field]: field === 'duration' ? value : Number(value) || 0,
                  }
                : s
            ),
          };
        })
      );
    },
    []
  );

  const handleFinish = () => {
    setIsRunning(false);
    setShowSummary(true);
  };

  // Group exercises: standalone vs superset
  const renderItems: React.ReactNode[] = [];
  const rendered = new Set<string>();

  exercises.forEach((ex) => {
    if (rendered.has(ex.id)) return;

    const superset = MOCK_SUPERSETS.find((ss) => ss.exerciseIds.includes(ex.id));
    if (superset) {
      superset.exerciseIds.forEach((id) => rendered.add(id));
      const ssExercises = superset.exerciseIds
        .map((id) => exercises.find((e) => e.id === id))
        .filter(Boolean) as TrainingExercise[];

      renderItems.push(
        <SupersetWrapper
          key={superset.id}
          superset={superset}
          exercises={ssExercises}
          expandedId={expandedId}
          activeExerciseId={activeExerciseId}
          onToggleExpand={toggleExpand}
          onToggleSet={toggleSet}
          onUpdateSet={updateSet}
        />
      );
    } else {
      rendered.add(ex.id);
      renderItems.push(
        <TrainingExerciseCard
          key={ex.id}
          exercise={ex}
          isExpanded={expandedId === ex.id}
          isActiveExercise={activeExerciseId === ex.id}
          onToggleExpand={() => toggleExpand(ex.id)}
          onToggleSet={(setId) => toggleSet(ex.id, setId)}
          onUpdateSet={(setId, field, value) => updateSet(ex.id, setId, field, value)}
        />
      );
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="font-bold text-gray-900 text-base">Treino Restrito</h1>
                <p className="text-xs text-gray-400">00 Novo treino 27 jan</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Timer */}
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${
                  isRunning
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {isRunning ? <Pause size={14} /> : <Play size={14} />}
                <span className="tabular-nums">{formatElapsed(elapsed)}</span>
              </button>

              {/* Finish button */}
              <button
                onClick={handleFinish}
                className="px-4 py-1.5 bg-gray-900 text-white text-sm font-bold rounded-full hover:bg-gray-800 transition-colors"
              >
                Finalizar
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-yellow-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs font-bold text-gray-500 tabular-nums min-w-[4ch] text-right">
              {Math.round(progress * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Exercise stats bar */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-6 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl border border-gray-100 shadow-sm flex-shrink-0">
            <Dumbbell size={14} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-600">
              {exercises.length} exercicios
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl border border-gray-100 shadow-sm flex-shrink-0">
            <Flame size={14} className="text-orange-400" />
            <span className="text-xs font-bold text-gray-600">
              {completedSets} de {totalSets} series
            </span>
          </div>
          {MOCK_SUPERSETS.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl border border-gray-100 shadow-sm flex-shrink-0">
              <Zap size={14} className="text-yellow-500" />
              <span className="text-xs font-bold text-gray-600">
                {MOCK_SUPERSETS.length} superset
              </span>
            </div>
          )}
        </div>

        {/* Exercise list */}
        <div className="space-y-4 pb-32">
          {renderItems}
        </div>
      </div>

      {/* Rest Timer Modal */}
      <AnimatePresence>
        {restTimer !== null && restTimer > 0 && (
          <RestTimerModal
            seconds={restTimer}
            onSkip={() => setRestTimer(null)}
            onAddTime={(s) =>
              setRestTimer((t) => Math.max(0, (t || 0) + s))
            }
          />
        )}
      </AnimatePresence>

      {/* Summary Modal */}
      <AnimatePresence>
        {showSummary && (
          <SummaryModal
            exercises={exercises}
            elapsed={elapsed}
            onClose={() => {
              setShowSummary(false);
              if (onBack) onBack();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
