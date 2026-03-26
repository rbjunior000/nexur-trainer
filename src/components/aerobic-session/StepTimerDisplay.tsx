import { formatTime, formatElapsed } from '../../utils/formatTime';
import { useAerobicSession } from './AerobicSessionContext';

/**
 * Large timer and step metadata below the ZoneRing.
 * Shows countdown for TIME steps, elapsed for DISTANCE steps.
 */
export function StepTimerDisplay() {
  const { currentStep, timer, isTimeStep, steps, currentIndex } = useAerobicSession();
  if (!currentStep) return null;

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-2xl font-black text-gray-900 mb-2">{currentStep.step.name}</h2>

      <div className="text-4xl font-black text-gray-900 tabular-nums mb-2">
        {isTimeStep ? formatTime(timer) : formatElapsed(timer)}
      </div>

      <p className="text-xs text-gray-400 mb-4">
        {isTimeStep
          ? 'Countdown'
          : `Distância: ${currentStep.step.duration}m`}
      </p>

      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
        {currentIndex + 1} de {steps.length}
      </p>
    </div>
  );
}
