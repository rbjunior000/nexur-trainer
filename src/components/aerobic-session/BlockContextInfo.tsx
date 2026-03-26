import { ZONE_COLORS } from '../../types/aerobic';
import { useAerobicSession } from './AerobicSessionContext';

/**
 * Shows the current block name, repetition indicator, and step dots.
 */
export function BlockContextInfo() {
  const { currentStep, workout } = useAerobicSession();
  if (!currentStep) return null;

  const zone = currentStep.step.intensity;
  const block = workout.blocks[currentStep.blockIndex];
  const stepsInBlock = block?.steps.length ?? 0;

  return (
    <div className="px-4 pb-2 flex items-center gap-3">
      <p className="text-xs font-bold text-gray-500">
        Bloco: {currentStep.blockName}
        {currentStep.totalBlockRepetitions > 1 && (
          <span className="text-gray-400">
            {' '}— Volta {currentStep.blockRepetition} de {currentStep.totalBlockRepetitions}
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
  );
}
