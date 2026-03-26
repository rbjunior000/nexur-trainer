import type { IntensityZone } from '../../types/aerobic';
import { INTENSITY_LABELS } from '../../types/aerobic';
import { ZONE_HEX } from '../aerobic-builder/ZoneBadge';

export interface ZoneRingProps {
  zone: IntensityZone;
  progress: number;   // 0–1
  size?: number;
  strokeWidth?: number;
}

/**
 * SVG circular progress ring colored by intensity zone.
 * Center shows the short zone label (e.g. "Z3") and full zone name.
 */
export function ZoneRing({ zone, progress, size = 200, strokeWidth = 10 }: ZoneRingProps) {
  const color = ZONE_HEX[zone];
  const label = INTENSITY_LABELS[zone];
  const shortLabel = `Z${zone}`;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="-rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black tabular-nums" style={{ color }}>
          {shortLabel}
        </span>
        <span className="text-xs font-bold text-gray-400 uppercase">{label}</span>
      </div>
    </div>
  );
}
