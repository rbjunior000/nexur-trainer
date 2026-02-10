import { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Repeat,
  Pencil,
  X,
  Clock,
  Layers,
  ChevronDown as ChevronDownIcon,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AerobicWorkout as AerobicWorkoutType,
  WorkoutBlock,
  BlockStep,
  IntensityZone,
  DurationType,
  Sport,
  DEFAULT_BLOCKS,
  INTENSITY_LABELS,
  SPORT_LABELS,
  ZONE_COLORS,
} from '../types/aerobic';

// --- Helpers ---
let _id = 200;
function uid() {
  return `aero-${++_id}`;
}

function formatDuration(step: BlockStep) {
  if (step.durationType === 'DISTANCE') return `${step.duration}m`;
  const parts = step.duration.split(':');
  if (parts.length === 3) {
    const m = parseInt(parts[1]);
    const s = parseInt(parts[2]);
    return s > 0 ? `${m}min ${s}s` : `${m}min`;
  }
  return step.duration;
}

function parseDuration(dur: string) {
  const parts = dur.split(':');
  if (parts.length === 3) return { h: parts[0], m: parts[1], s: parts[2] };
  return { h: '00', m: '00', s: '00' };
}

function parseDurationToSeconds(dur: string) {
  const parts = dur.split(':');
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }
  return 0;
}

function formatSeconds(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return s > 0 ? `${m}min ${s}s` : `${m}min`;
  return `${s}s`;
}

// --- Zone Badge ---
function ZoneBadge({ zone, size = 'sm' }: { zone: IntensityZone; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-bold text-white ${sizeClass} ${ZONE_COLORS[zone]}`}>
      Z{zone}
    </span>
  );
}

// --- Step Card ---
function StepCard({
  step,
  onEdit,
  onRemove,
  onDuplicate,
}: {
  step: BlockStep;
  onEdit: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  return (
    <div
      className="group flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2.5 hover:border-yellow-300 transition-colors cursor-pointer"
      onClick={onEdit}
    >
      <ZoneBadge zone={step.intensity} />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-900 truncate">{step.name}</span>
        <span className="ml-2 text-xs text-gray-400">{formatDuration(step)}</span>
      </div>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-1.5 text-gray-300 hover:text-gray-600 transition-colors"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="p-1.5 text-gray-300 hover:text-blue-500 transition-colors"
        >
          <Copy size={13} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// --- Block Card ---
function BlockCard({
  block,
  index,
  total,
  onUpdateBlock,
  onRemoveBlock,
  onDuplicateBlock,
  onMoveUp,
  onMoveDown,
  onEditStep,
  onAddStep,
}: {
  block: WorkoutBlock;
  index: number;
  total: number;
  onUpdateBlock: (block: WorkoutBlock) => void;
  onRemoveBlock: () => void;
  onDuplicateBlock: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEditStep: (step: BlockStep) => void;
  onAddStep: () => void;
}) {
  const removeStep = (stepId: string) => {
    onUpdateBlock({ ...block, steps: block.steps.filter((s) => s.id !== stepId) });
  };

  const duplicateStep = (step: BlockStep) => {
    const idx = block.steps.findIndex((s) => s.id === step.id);
    const copy: BlockStep = { ...step, id: uid(), name: `${step.name} (cópia)` };
    const newSteps = [...block.steps];
    newSteps.splice(idx + 1, 0, copy);
    onUpdateBlock({ ...block, steps: newSteps });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-visible"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex flex-col gap-0.5">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
          >
            <ChevronDown size={14} />
          </button>
        </div>

        <input
          value={block.name}
          onChange={(e) => onUpdateBlock({ ...block, name: e.target.value })}
          className="bg-transparent font-bold text-sm text-gray-900 border-none outline-none flex-1 min-w-[100px] max-w-[200px]"
        />

        <div className="flex items-center gap-1.5 ml-auto">
          <Repeat size={14} className="text-gray-400" />
          <input
            type="number"
            min={1}
            value={block.repetitions}
            onChange={(e) =>
              onUpdateBlock({ ...block, repetitions: Math.max(1, parseInt(e.target.value) || 1) })
            }
            className="w-12 h-7 text-sm text-center bg-white border border-gray-200 rounded-md focus:outline-none focus:border-yellow-400"
          />
        </div>

        <div className="flex gap-0.5">
          <button onClick={onDuplicateBlock} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
            <Copy size={14} />
          </button>
          <button onClick={onRemoveBlock} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="p-3 space-y-1.5">
        <AnimatePresence mode="popLayout">
          {block.steps.map((step) => (
            <motion.div
              key={step.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10, height: 0 }}
            >
              <StepCard
                step={step}
                onEdit={() => onEditStep(step)}
                onRemove={() => removeStep(step.id)}
                onDuplicate={() => duplicateStep(step)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          onClick={onAddStep}
          className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 border-dashed mt-2"
        >
          <Plus size={16} />
          Adicionar step
        </button>
      </div>
    </motion.div>
  );
}

// --- Step Modal ---
function StepModal({
  open,
  step,
  mode,
  onSave,
  onClose,
}: {
  open: boolean;
  step: BlockStep | null;
  mode: 'create' | 'edit';
  onSave: (step: BlockStep) => void;
  onClose: () => void;
}) {
  const defaultStep: BlockStep = {
    id: uid(),
    name: 'Novo Step',
    durationType: 'TIME',
    duration: '00:01:00',
    intensity: '1',
    level: 1,
  };

  const [draft, setDraft] = useState<BlockStep>(step || defaultStep);
  const [zoneOpen, setZoneOpen] = useState(false);
  const [durationTypeOpen, setDurationTypeOpen] = useState(false);

  // Sync when modal opens
  if (open && step && draft.id !== step.id) {
    setDraft({ ...step });
  }
  if (open && !step && draft.id.startsWith('aero-') && mode === 'create' && draft.name !== 'Novo Step') {
    setDraft({ ...defaultStep, id: uid() });
  }

  const draftTime = parseDuration(draft.duration);

  const handleSave = () => {
    onSave(draft);
    onClose();
    setDraft({ ...defaultStep, id: uid() });
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl w-[420px] shadow-2xl overflow-visible"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h3 className="text-base font-bold text-gray-900">
            {mode === 'create' ? 'Adicionar Step' : 'Editar Step'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-2 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Nome</label>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Duration Type */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Tipo de duração</label>
              <div className="relative">
                <button
                  onClick={() => setDurationTypeOpen(!durationTypeOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 hover:border-gray-300 transition-colors"
                >
                  {draft.durationType === 'TIME' ? 'Tempo' : 'Distância'}
                  <ChevronDownIcon size={14} className="text-gray-400" />
                </button>
                <AnimatePresence>
                  {durationTypeOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setDurationTypeOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-100 z-20 py-1"
                      >
                        {(['TIME', 'DISTANCE'] as DurationType[]).map((dt) => (
                          <button
                            key={dt}
                            onClick={() => {
                              setDraft({ ...draft, durationType: dt, duration: dt === 'TIME' ? '00:01:00' : '1000' });
                              setDurationTypeOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                              draft.durationType === dt ? 'text-gray-900 font-medium bg-gray-50' : 'text-gray-600'
                            }`}
                          >
                            {dt === 'TIME' ? 'Tempo' : 'Distância'}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Duration Value */}
            {draft.durationType === 'TIME' ? (
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Duração</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={parseInt(draftTime.m)}
                    onChange={(e) =>
                      setDraft({ ...draft, duration: `${draftTime.h}:${e.target.value.padStart(2, '0')}:${draftTime.s}` })
                    }
                    className="w-14 px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-yellow-400"
                  />
                  <span className="text-xs text-gray-400">min</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={parseInt(draftTime.s)}
                    onChange={(e) =>
                      setDraft({ ...draft, duration: `${draftTime.h}:${draftTime.m}:${e.target.value.padStart(2, '0')}` })
                    }
                    className="w-14 px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-yellow-400"
                  />
                  <span className="text-xs text-gray-400">seg</span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Distância (m)</label>
                <input
                  type="number"
                  min={0}
                  value={draft.duration}
                  onChange={(e) => setDraft({ ...draft, duration: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-400"
                />
              </div>
            )}
          </div>

          {/* Intensity Zone */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Intensidade</label>
            <div className="relative">
              <button
                onClick={() => setZoneOpen(!zoneOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 hover:border-gray-300 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ZoneBadge zone={draft.intensity} />
                  {INTENSITY_LABELS[draft.intensity]}
                </span>
                <ChevronDownIcon size={14} className="text-gray-400" />
              </button>
              <AnimatePresence>
                {zoneOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setZoneOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1 max-h-60 overflow-y-auto"
                    >
                      {(Object.keys(INTENSITY_LABELS) as IntensityZone[]).map((z) => (
                        <button
                          key={z}
                          onClick={() => { setDraft({ ...draft, intensity: z }); setZoneOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors ${
                            draft.intensity === z ? 'bg-gray-50 font-medium' : 'text-gray-600'
                          }`}
                        >
                          <ZoneBadge zone={z} />
                          {INTENSITY_LABELS[z]}
                          {draft.intensity === z && <Check size={14} className="ml-auto text-yellow-500" />}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 mt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 text-sm font-bold text-gray-900 bg-yellow-400 rounded-lg hover:bg-yellow-500 transition-colors"
          >
            {mode === 'create' ? 'Adicionar' : 'Salvar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Sport Selector ---
function SportSelector({ value, onChange }: { value: Sport; onChange: (s: Sport) => void }) {
  return (
    <div className="flex items-center gap-2">
      {(Object.keys(SPORT_LABELS) as Sport[]).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            value === s
              ? 'bg-yellow-400 text-gray-900'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {SPORT_LABELS[s]}
        </button>
      ))}
    </div>
  );
}

// --- Main Component ---
export function AerobicWorkout() {
  const [workout, setWorkout] = useState<AerobicWorkoutType>({
    workoutName: 'Novo Treino Aeróbico',
    workoutStartDate: '',
    workoutEndDate: '',
    workoutDescription: '',
    sport: 'running',
    blocks: DEFAULT_BLOCKS.map((b) => ({
      ...b,
      id: uid(),
      steps: b.steps.map((s) => ({ ...s, id: uid() })),
    })),
  });

  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<BlockStep | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [stepModalMode, setStepModalMode] = useState<'create' | 'edit'>('create');

  const updateWorkout = (updates: Partial<AerobicWorkoutType>) => {
    setWorkout((prev) => ({ ...prev, ...updates }));
  };

  const updateBlock = (blockId: string, updated: WorkoutBlock) => {
    setWorkout((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === blockId ? updated : b)),
    }));
  };

  const addBlock = () => {
    const newBlock: WorkoutBlock = {
      id: uid(),
      name: 'Novo Bloco',
      repetitions: 1,
      totalDuration: '00:05:00',
      steps: [{ id: uid(), name: 'Step 1', durationType: 'TIME', duration: '00:05:00', intensity: '1', level: 1 }],
    };
    setWorkout((prev) => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
  };

  const removeBlock = (blockId: string) => {
    setWorkout((prev) => ({ ...prev, blocks: prev.blocks.filter((b) => b.id !== blockId) }));
  };

  const duplicateBlock = (blockId: string) => {
    const idx = workout.blocks.findIndex((b) => b.id === blockId);
    const original = workout.blocks[idx];
    const copy: WorkoutBlock = {
      ...original,
      id: uid(),
      name: `${original.name} (cópia)`,
      steps: original.steps.map((s) => ({ ...s, id: uid() })),
    };
    const newBlocks = [...workout.blocks];
    newBlocks.splice(idx + 1, 0, copy);
    setWorkout((prev) => ({ ...prev, blocks: newBlocks }));
  };

  const moveBlock = (idx: number, direction: -1 | 1) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= workout.blocks.length) return;
    const newBlocks = [...workout.blocks];
    [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]];
    setWorkout((prev) => ({ ...prev, blocks: newBlocks }));
  };

  const openAddStep = (blockId: string) => {
    setActiveBlockId(blockId);
    setEditingStep(null);
    setStepModalMode('create');
    setStepModalOpen(true);
  };

  const openEditStep = (blockId: string, step: BlockStep) => {
    setActiveBlockId(blockId);
    setEditingStep(step);
    setStepModalMode('edit');
    setStepModalOpen(true);
  };

  const handleStepSave = (step: BlockStep) => {
    if (!activeBlockId) return;
    const block = workout.blocks.find((b) => b.id === activeBlockId);
    if (!block) return;

    if (stepModalMode === 'create') {
      updateBlock(activeBlockId, { ...block, steps: [...block.steps, step] });
    } else {
      updateBlock(activeBlockId, {
        ...block,
        steps: block.steps.map((s) => (s.id === step.id ? step : s)),
      });
    }
  };

  // Summary stats
  const totalSteps = workout.blocks.reduce((acc, b) => acc + b.steps.length, 0);
  const totalSeconds = workout.blocks.reduce((acc, b) => {
    const blockTime = b.steps.reduce((sa, step) => {
      if (step.durationType === 'TIME') return sa + parseDurationToSeconds(step.duration);
      return sa;
    }, 0);
    return acc + blockTime * b.repetitions;
  }, 0);

  return (
    <div className="pb-12">
      {/* Blocks Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Blocos</h2>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Layers size={13} /> {workout.blocks.length} blocos</span>
            <span className="flex items-center gap-1"><Repeat size={13} /> {totalSteps} steps</span>
            <span className="flex items-center gap-1"><Clock size={13} /> {formatSeconds(totalSeconds)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {workout.blocks.map((block, idx) => (
              <BlockCard
                key={block.id}
                block={block}
                index={idx}
                total={workout.blocks.length}
                onUpdateBlock={(updated) => updateBlock(block.id, updated)}
                onRemoveBlock={() => removeBlock(block.id)}
                onDuplicateBlock={() => duplicateBlock(block.id)}
                onMoveUp={() => moveBlock(idx, -1)}
                onMoveDown={() => moveBlock(idx, 1)}
                onEditStep={(step) => openEditStep(block.id, step)}
                onAddStep={() => openAddStep(block.id)}
              />
            ))}
          </AnimatePresence>
        </div>

        <button
          onClick={addBlock}
          className="mt-4 w-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 bg-white rounded-xl transition-colors border-2 border-dashed border-gray-200 hover:border-yellow-400"
        >
          <Plus size={18} />
          Adicionar Bloco
        </button>
      </div>

      {/* JSON Preview */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
          JSON do treino
        </h3>
        <pre className="bg-gray-950 text-gray-300 text-xs rounded-xl p-4 overflow-x-auto max-h-96 overflow-y-auto">
          <code>{JSON.stringify(workout, null, 2)}</code>
        </pre>
      </div>

      {/* Step Modal */}
      <AnimatePresence>
        {stepModalOpen && (
          <StepModal
            open={stepModalOpen}
            step={editingStep}
            mode={stepModalMode}
            onSave={handleStepSave}
            onClose={() => setStepModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
