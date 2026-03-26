import { ZONE_COLORS } from '../../types/aerobic';
import { useAerobicSession } from './AerobicSessionContext';

/**
 * Zone-colored segmented progress bar showing all steps.
 * Each segment fills as that step progresses.
 */
export function SegmentedProgressBar() {
  const { steps, currentIndex, isTimeStep, stepDurationSec, timer } = useAerobicSession();

  return (
    <div className="px-4 py-3">
      <div className="flex gap-0.5">
        {steps.map((s, i) => {
          let fillPercent = 0;
          if (i < currentIndex) {
            fillPercent = 100;
          } else if (i === currentIndex) {
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
  );
}
