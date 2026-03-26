import { parseDurationToSeconds } from '../../utils/formatTime';
import { ZONE_HEX } from '../aerobic-builder/ZoneBadge';
import type { BlockStep } from '../../types/aerobic';
import { useAerobicSession } from './AerobicSessionContext';

function formatStepDuration(step: BlockStep): string {
  if (step.durationType === 'DISTANCE') return `${step.duration}m`;
  const sec = parseDurationToSeconds(step.duration);
  if (sec >= 3600) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
  if (sec >= 60) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}min ${s}s` : `${m}min`;
  }
  return `${sec}s`;
}

/**
 * One-line preview of the next step (name, zone, duration).
 * Returns null when there is no next step.
 */
export function NextStepPreview() {
  const { nextStep } = useAerobicSession();
  if (!nextStep) return null;

  const color = ZONE_HEX[nextStep.step.intensity];

  return (
    <div className="text-center pb-4 px-4">
      <p className="text-xs text-gray-400">
        Próximo:{' '}
        <span className="font-bold text-gray-600">{nextStep.step.name}</span>
        {' — '}
        <span className="font-bold" style={{ color }}>
          Z{nextStep.step.intensity}
        </span>
        {' — '}
        {formatStepDuration(nextStep.step)}
      </p>
    </div>
  );
}
