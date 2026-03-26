import { Clock } from 'lucide-react';

const REST_PRESETS = [
  { label: 'OFF', value: 0 },
  { label: '10s', value: 10 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '2min', value: 120 },
  { label: '3min', value: 180 },
];
const PRESET_VALUES = new Set(REST_PRESETS.map((p) => p.value));

export function formatRest(seconds: number): string {
  if (seconds <= 0) return 'OFF';
  if (seconds >= 60) return `${Math.floor(seconds / 60)}min`;
  return `${seconds}s`;
}

export interface RestTimerBadgeProps {
  /** Rest duration in seconds. */
  value: number;
  /** If provided, renders an editable select. Otherwise read-only badge. */
  onChange?: (seconds: number) => void;
  variant?: 'light' | 'dark';
}

/**
 * Shows rest duration. When `onChange` is provided renders a select.
 * Supports preset values + custom entry via "Outro" option.
 */
export function RestTimerBadge({ value, onChange, variant = 'light' }: RestTimerBadgeProps) {
  const isDark = variant === 'dark';

  if (!onChange) {
    return (
      <span
        className={`flex items-center gap-1 text-sm font-medium ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}
      >
        <Clock size={12} />
        {formatRest(value)}
      </span>
    );
  }

  const isCustom = !PRESET_VALUES.has(value);

  return (
    <select
      aria-label="Tempo de descanso"
      value={isCustom ? value : value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`w-full text-center border rounded-lg py-2 text-xs font-medium focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all appearance-none cursor-pointer ${
        isDark
          ? 'bg-gray-800 border-gray-700 text-gray-300'
          : 'bg-white border-gray-200 text-gray-600'
      }`}
    >
      {REST_PRESETS.map((p) => (
        <option key={p.value} value={p.value}>
          {p.label}
        </option>
      ))}
      {isCustom && (
        <option value={value}>{formatRest(value)}</option>
      )}
      <option value={-1}>Outro…</option>
    </select>
  );
}
