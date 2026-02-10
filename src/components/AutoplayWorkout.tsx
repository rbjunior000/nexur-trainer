import { useState, useEffect, useCallback, Fragment } from 'react';
import {
  Trash2,
  Plus,
  MoreHorizontal,
  Copy,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Timer,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DURATION_PRESETS,
  makeExerciseItem,
  makeRestItem,
} from '../types/autoplay';
import type { AutoplayItem } from '../types/autoplay';
import type { LibraryExercise } from '../App';

// --- Helpers ---

function formatDuration(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}min ${s}s` : `${m}min`;
  }
  return `${seconds}s`;
}

function presetLabel(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${m}min`;
  }
  return `${seconds}s`;
}

// --- Dropdown Menu (same as StrictWorkout) ---

type MenuAction = {
  icon: typeof Trash2;
  label: string;
  color?: string;
  danger?: boolean;
  onClick: () => void;
};

function DropdownMenu({
  actions,
  onClose,
}: {
  actions: MenuAction[];
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        transition={{ duration: 0.12 }}
        className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1 overflow-hidden"
      >
        {actions.map((action, i) => (
          <Fragment key={i}>
            {action.danger && i > 0 && (
              <div className="border-t border-gray-100 my-1" />
            )}
            <button
              onClick={() => {
                action.onClick();
                onClose();
              }}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                action.danger
                  ? 'text-red-500 hover:bg-red-50'
                  : `${action.color || 'text-gray-600'} hover:bg-gray-50`
              }`}
            >
              <action.icon size={16} />
              <span className="flex-1">{action.label}</span>
            </button>
          </Fragment>
        ))}
      </motion.div>
    </>
  );
}

// --- Confirm Dialog (same as StrictWorkout) ---

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
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
        className="bg-white rounded-2xl p-6 w-80 shadow-2xl"
      >
        <p className="text-sm text-gray-700 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
          >
            Remover
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Duration Presets (chips row) ---

function DurationChips({
  value,
  onChange,
}: {
  value: number;
  onChange: (d: number) => void;
}) {
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const isCustom = !DURATION_PRESETS.includes(value as typeof DURATION_PRESETS[number]);

  const commitCustom = () => {
    const v = parseInt(customValue);
    if (v > 0) onChange(v);
    setCustomMode(false);
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
        {DURATION_PRESETS.map((d) => (
          <button
            key={d}
            onClick={() => {
              onChange(d);
              setCustomMode(false);
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
              value === d
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {presetLabel(d)}
          </button>
        ))}
        {customMode || isCustom ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              value={isCustom && !customMode ? value : customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onBlur={commitCustom}
              onKeyDown={(e) => e.key === 'Enter' && commitCustom()}
              placeholder="seg"
              className="w-14 px-2 py-1 text-xs text-center border border-gray-200 rounded-full focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
              autoFocus={customMode}
            />
            <span className="text-xs text-gray-400">s</span>
          </div>
        ) : (
          <button
            onClick={() => setCustomMode(true)}
            className="px-3 py-1 text-xs text-gray-400 bg-gray-50 rounded-full border border-dashed border-gray-200 hover:border-gray-300 hover:text-gray-500 transition-colors whitespace-nowrap"
          >
            Custom
          </button>
        )}
    </div>
  );
}

// --- Rest Inserter (appears between exercise cards) ---

function RestInserter({ onClick }: { onClick: () => void }) {
  return (
    <div className="group relative flex items-center justify-center h-8 -my-1">
      {/* Line */}
      <div className="absolute inset-x-4 top-1/2 h-px bg-transparent group-hover:bg-gray-200 transition-colors" />
      {/* Button */}
      <button
        onClick={onClick}
        className="relative z-10 flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-gray-400 bg-white border border-transparent rounded-full opacity-0 group-hover:opacity-100 group-hover:border-gray-200 hover:!border-yellow-400 hover:!text-yellow-600 transition-all"
      >
        <Plus size={12} />
        Descanso
      </button>
    </div>
  );
}

// --- Exercise Card ---

function ExerciseCard({
  item,
  index,
  total,
  onUpdate,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: {
  item: AutoplayItem;
  index: number;
  total: number;
  onUpdate: (updates: Partial<AutoplayItem>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 py-4 rounded-lg bg-white">
      {/* Title row – with inline thumbnail on mobile */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 md:hidden">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop"
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="text-sm font-bold text-gray-900 truncate">{item.name}</h3>
      </div>

      {/* Content: form only on mobile, thumbnail + form on md+ */}
      <div className="flex gap-4">
        {/* Thumbnail – desktop only */}
        <div className="hidden md:block w-36 h-36 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop"
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Form fields */}
        <div className="flex-1 flex flex-col gap-y-3 min-w-0">
          {/* Duration */}
          <div className="flex flex-col gap-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">
              Duração
            </label>
            <DurationChips
              value={item.duration}
              onChange={(d) => onUpdate({ duration: d })}
            />
          </div>

          {/* Label / Observações */}
          <div className="flex flex-col gap-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">
              Observações
            </label>
            <textarea
              value={item.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Ex: Ritmo forte, sem pausa..."
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all resize-none h-16"
            />
          </div>
        </div>

        {/* Action buttons – vertical on md+, hidden on mobile (shown below) */}
        <div className="hidden md:grid grid-rows-3 items-center justify-center flex-shrink-0">
          <button
            onClick={() => {
              if (index > 0) onMoveUp();
              else if (index < total - 1) onMoveDown();
            }}
            className="flex items-center justify-center p-2 text-gray-300 cursor-grab hover:text-gray-500 transition-colors"
          >
            <GripVertical size={18} />
          </button>
          <button
            onClick={onRemove}
            className="flex items-center justify-center p-2 text-gray-300 hover:text-red-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={onDuplicate}
            className="flex items-center justify-center p-2 text-gray-300 hover:text-blue-500 transition-colors"
          >
            <Copy size={18} />
          </button>
        </div>
      </div>

      {/* Mobile action buttons – horizontal row */}
      <div className="flex md:hidden items-center justify-end gap-1 pt-1 border-t border-gray-100">
        <button
          onClick={() => {
            if (index > 0) onMoveUp();
            else if (index < total - 1) onMoveDown();
          }}
          className="flex items-center justify-center p-2 text-gray-300 cursor-grab hover:text-gray-500 transition-colors"
        >
          <GripVertical size={18} />
        </button>
        <button
          onClick={onDuplicate}
          className="flex items-center justify-center p-2 text-gray-300 hover:text-blue-500 transition-colors"
        >
          <Copy size={18} />
        </button>
        <button
          onClick={onRemove}
          className="flex items-center justify-center p-2 text-gray-300 hover:text-red-500 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

// --- Rest Card (compact) ---

function RestCard({
  item,
  index,
  total,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  item: AutoplayItem;
  index: number;
  total: number;
  onUpdate: (updates: Partial<AutoplayItem>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuActions: MenuAction[] = [];
  if (index > 0)
    menuActions.push({ icon: ArrowUp, label: 'Mover para cima', onClick: onMoveUp });
  if (index < total - 1)
    menuActions.push({ icon: ArrowDown, label: 'Mover para baixo', onClick: onMoveDown });
  menuActions.push({ icon: Trash2, label: 'Remover', danger: true, onClick: onRemove });

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-visible">
      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-200/60 flex-shrink-0">
            <Timer size={16} className="text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold text-gray-500 uppercase">Descanso</span>
              <span className="text-xs font-bold text-gray-400">{formatDuration(item.duration)}</span>
            </div>
            <input
              type="text"
              value={item.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Descanso ativo, alongamento..."
              className="w-full text-xs text-gray-500 bg-transparent border-none outline-none placeholder-gray-300"
            />
          </div>

          <div className="relative flex-shrink-0">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-gray-300 hover:text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>
            <AnimatePresence>
              {isMenuOpen && (
                <DropdownMenu
                  actions={menuActions}
                  onClose={() => setIsMenuOpen(false)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Duration quick buttons */}
        <div className="flex items-center gap-1 flex-wrap pl-11">
          {[10, 15, 20, 30, 60].map((d) => (
            <button
              key={d}
              onClick={() => onUpdate({ duration: d })}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                item.duration === d
                  ? 'bg-gray-300 text-gray-700'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              {presetLabel(d)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Empty State ---

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
        <Timer size={28} className="text-gray-300" />
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-2">
        Nenhum exercício adicionado
      </h3>
      <p className="text-sm text-gray-400 max-w-xs mb-6">
        Selecione exercícios na biblioteca ao lado para montar seu treino
      </p>
      <div className="flex items-center gap-2 text-xs text-gray-300">
        <span>Biblioteca</span>
        <ArrowRight size={14} />
      </div>
    </div>
  );
}

// --- Main Component ---

export function AutoplayWorkout({
  onRegisterAdd,
}: {
  onRegisterAdd?: (fn: (ex: LibraryExercise) => void) => void;
}) {
  const [items, setItems] = useState<AutoplayItem[]>([]);
  const [confirmAction, setConfirmAction] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const addFromLibrary = useCallback((ex: LibraryExercise) => {
    setItems((prev) => [
      ...prev,
      makeExerciseItem(ex.name, ex.category, ex.equipment),
    ]);
  }, []);

  useEffect(() => {
    onRegisterAdd?.(addFromLibrary);
  }, [onRegisterAdd, addFromLibrary]);

  const updateItem = (id: string, updates: Partial<AutoplayItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...updates } : it))
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const duplicateItem = (index: number) => {
    setItems((prev) => {
      const original = prev[index];
      const dup = makeExerciseItem(original.name, original.category, original.equipment);
      dup.duration = original.duration;
      dup.label = original.label;
      const next = [...prev];
      next.splice(index + 1, 0, dup);
      return next;
    });
  };

  const moveItem = (index: number, dir: -1 | 1) => {
    setItems((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const insertRestAfter = (index: number) => {
    setItems((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, makeRestItem());
      return next;
    });
  };

  if (items.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="pb-12">
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <Fragment key={item.id}>
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className={index > 0 && item.type === 'exercise' && items[index - 1]?.type !== 'rest' ? 'mt-4' : 'mt-2'}
            >
              {item.type === 'exercise' ? (
                <ExerciseCard
                  item={item}
                  index={index}
                  total={items.length}
                  onUpdate={(updates) => updateItem(item.id, updates)}
                  onRemove={() =>
                    setConfirmAction({
                      message: `Remover "${item.name}" do treino?`,
                      onConfirm: () => {
                        removeItem(index);
                        setConfirmAction(null);
                      },
                    })
                  }
                  onDuplicate={() => duplicateItem(index)}
                  onMoveUp={() => moveItem(index, -1)}
                  onMoveDown={() => moveItem(index, 1)}
                />
              ) : (
                <RestCard
                  item={item}
                  index={index}
                  total={items.length}
                  onUpdate={(updates) => updateItem(item.id, updates)}
                  onRemove={() => removeItem(index)}
                  onMoveUp={() => moveItem(index, -1)}
                  onMoveDown={() => moveItem(index, 1)}
                />
              )}
            </motion.div>

            {/* Rest inserter between items (only show between exercises or after exercise before next exercise) */}
            {item.type === 'exercise' &&
              index < items.length - 1 &&
              items[index + 1]?.type === 'exercise' && (
                <RestInserter onClick={() => insertRestAfter(index)} />
              )}
          </Fragment>
        ))}
      </AnimatePresence>

      {/* JSON Preview */}
      {items.length > 0 && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            JSON do treino
          </h3>
          <pre className="bg-gray-950 text-gray-300 text-xs rounded-xl p-4 overflow-x-auto max-h-96 overflow-y-auto">
            <code>{JSON.stringify(items, null, 2)}</code>
          </pre>
        </div>
      )}

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirmAction && (
          <ConfirmDialog
            message={confirmAction.message}
            onConfirm={confirmAction.onConfirm}
            onCancel={() => setConfirmAction(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
