import type { BlockStep } from '../../types/aerobic';
import { BaseModal } from '../shared/BaseModal';
import { DurationInput } from './DurationInput';
import { IntensityZoneDropdown } from './IntensityZoneDropdown';

export interface StepModalProps {
  open: boolean;
  step: BlockStep | null;
  onSave: (patch: Partial<BlockStep>) => void;
  onClose: () => void;
}

/**
 * Modal for creating or editing a workout block step.
 */
export function StepModal({ open, step, onSave, onClose }: StepModalProps) {
  if (!step) return null;

  return (
    <BaseModal open={open} onClose={onClose} title={step.name || 'Step'} className="max-w-sm">
      <div className="p-4 space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="step-name" className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Nome</label>
          <input
            id="step-name"
            type="text"
            defaultValue={step.name}
            onBlur={(e) => onSave({ name: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-yellow-400"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Duração</label>
          <DurationInput
            durationType={step.durationType}
            duration={step.duration}
            onChangeDurationType={(t) => onSave({ durationType: t })}
            onChangeDuration={(d) => onSave({ duration: d })}
          />
        </div>

        {/* Zone */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
            Zona de Intensidade
          </label>
          <IntensityZoneDropdown
            value={step.intensity}
            onChange={(zone) => onSave({ intensity: zone })}
          />
        </div>
      </div>

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-yellow-400 text-gray-900 font-bold hover:bg-yellow-500 transition-colors"
        >
          Fechar
        </button>
      </div>
    </BaseModal>
  );
}
