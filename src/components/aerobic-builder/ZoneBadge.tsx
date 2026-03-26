import type { IntensityZone } from '../../types/aerobic';
import { INTENSITY_LABELS } from '../../types/aerobic';

const ZONE_HEX: Record<IntensityZone, string> = {
  '1': '#3b82f6',
  '2': '#14b8a6',
  '3': '#eab308',
  '4': '#f97316',
  '5': '#ef4444',
  '5a': '#ef4444',
  '5b': '#dc2626',
  '5c': '#b91c1c',
};

export interface ZoneBadgeProps {
  zone: IntensityZone;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

/**
 * Colored badge for an intensity zone (Z1–Z5c).
 * Used throughout the aerobic editor and execution.
 */
export function ZoneBadge({ zone, size = 'sm', showLabel = false }: ZoneBadgeProps) {
  const color = ZONE_HEX[zone];
  const label = INTENSITY_LABELS[zone] ?? `Z${zone}`;
  const shortLabel = `Z${zone}`;

  if (size === 'md') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {showLabel ? label : shortLabel}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {showLabel ? label : shortLabel}
    </span>
  );
}

export { ZONE_HEX };
