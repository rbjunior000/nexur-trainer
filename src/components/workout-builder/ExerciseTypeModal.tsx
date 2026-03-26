import { Dumbbell, Clock, ArrowRight, Check } from 'lucide-react';
import type { ExerciseType } from '../../types/workout';
import { BaseModal } from '../shared/BaseModal';

const TYPES: {
  type: ExerciseType;
  label: string;
  description: string;
  icon: React.ReactNode;
  bg: string;
  text: string;
}[] = [
  {
    type: 'weight_reps',
    label: 'Peso e Reps',
    description: 'Séries com peso e repetições',
    icon: <Dumbbell size={18} />,
    bg: 'bg-blue-100',
    text: 'text-blue-600',
  },
  {
    type: 'duration',
    label: 'Duração',
    description: 'Séries cronometradas (isometria, etc.)',
    icon: <Clock size={18} />,
    bg: 'bg-teal-100',
    text: 'text-teal-600',
  },
  {
    type: 'distance',
    label: 'Distância',
    description: 'Séries por distância (corrida, etc.)',
    icon: <ArrowRight size={18} />,
    bg: 'bg-rose-100',
    text: 'text-rose-600',
  },
];

export interface ExerciseTypeModalProps {
  open: boolean;
  current: ExerciseType;
  onSelect: (type: ExerciseType) => void;
  onClose: () => void;
}

/**
 * Modal for changing the exercise type (weight/reps, duration, distance).
 * Shows a card list with the current type highlighted.
 */
export function ExerciseTypeModal({ open, current, onSelect, onClose }: ExerciseTypeModalProps) {
  return (
    <BaseModal open={open} onClose={onClose} title="Tipo de exercício">
      <div className="p-4 space-y-2">
        {TYPES.map((t) => (
          <button
            key={t.type}
            type="button"
            onClick={() => {
              onSelect(t.type);
              onClose();
            }}
            className={`w-full flex items-center gap-4 p-3.5 rounded-xl border-2 transition-all text-left ${
              current === t.type
                ? 'border-yellow-400 bg-yellow-50'
                : 'border-gray-100 hover:border-gray-200 bg-gray-50'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${t.bg} ${t.text}`}>
              {t.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">{t.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
            </div>
            {current === t.type && <Check size={18} className="text-yellow-500 flex-shrink-0" />}
          </button>
        ))}
      </div>
    </BaseModal>
  );
}
