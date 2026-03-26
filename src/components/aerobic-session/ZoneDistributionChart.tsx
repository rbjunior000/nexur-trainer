import type { IntensityZone } from '../../types/aerobic';
import { INTENSITY_LABELS, ZONE_COLORS } from '../../types/aerobic';
import { formatElapsed } from '../../utils/formatTime';

export interface ZoneDistributionChartProps {
  zoneTime: Record<IntensityZone, number>;
}

/**
 * Horizontal bar chart showing time spent per intensity zone.
 * Only renders zones with time > 0.
 */
export function ZoneDistributionChart({ zoneTime }: ZoneDistributionChartProps) {
  const entries = (Object.entries(zoneTime) as [IntensityZone, number][]).filter(
    ([, t]) => t > 0,
  );
  if (entries.length === 0) return null;

  const maxTime = Math.max(...entries.map(([, t]) => t), 1);

  return (
    <div className="space-y-2">
      {entries.map(([zone, time]) => (
        <div key={zone} className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 w-10 text-right shrink-0">
            {INTENSITY_LABELS[zone]}
          </span>
          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${ZONE_COLORS[zone]}`}
              style={{ width: `${(time / maxTime) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-500 w-12 tabular-nums shrink-0">
            {formatElapsed(time)}
          </span>
        </div>
      ))}
    </div>
  );
}
