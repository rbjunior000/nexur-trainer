import type { DurationType } from '../../types/aerobic';

export interface DurationInputProps {
  durationType: DurationType;
  duration: string;
  onChangeDurationType: (t: DurationType) => void;
  onChangeDuration: (value: string) => void;
}

/**
 * Input for workout step duration.
 * Switches between TIME (HH:MM:SS) and DISTANCE (meters) modes.
 */
export function DurationInput({
  durationType,
  duration,
  onChangeDurationType,
  onChangeDuration,
}: DurationInputProps) {
  const inputCls =
    'w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm font-medium focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 tabular-nums';

  // Parse TIME to h/m/s parts
  const parseParts = (d: string): [number, number, number] => {
    const parts = d.split(':').map(Number);
    if (parts.length === 3) return [parts[0], parts[1], parts[2]];
    if (parts.length === 2) return [0, parts[0], parts[1]];
    return [0, 0, parts[0] || 0];
  };

  const formatParts = (h: number, m: number, s: number): string =>
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const [h, m, s] = parseParts(duration);

  return (
    <div className="space-y-2">
      {/* Type switcher */}
      <div className="flex gap-1">
        {(['TIME', 'DISTANCE'] as DurationType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onChangeDurationType(t)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              durationType === t
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {t === 'TIME' ? 'Tempo' : 'Distância'}
          </button>
        ))}
      </div>

      {durationType === 'TIME' ? (
        <div className="flex items-center gap-1.5">
          <div className="flex-1">
            <label htmlFor="dur-h" className="block text-[10px] text-gray-400 mb-0.5 text-center">h</label>
            <input
              id="dur-h"
              type="number"
              min={0}
              max={99}
              value={h}
              onChange={(e) => onChangeDuration(formatParts(Number(e.target.value) || 0, m, s))}
              className={inputCls + ' text-center'}
            />
          </div>
          <span className="text-gray-400 text-lg font-bold mt-3">:</span>
          <div className="flex-1">
            <label htmlFor="dur-m" className="block text-[10px] text-gray-400 mb-0.5 text-center">min</label>
            <input
              id="dur-m"
              type="number"
              min={0}
              max={59}
              value={m}
              onChange={(e) => onChangeDuration(formatParts(h, Number(e.target.value) || 0, s))}
              className={inputCls + ' text-center'}
            />
          </div>
          <span className="text-gray-400 text-lg font-bold mt-3">:</span>
          <div className="flex-1">
            <label htmlFor="dur-s" className="block text-[10px] text-gray-400 mb-0.5 text-center">seg</label>
            <input
              id="dur-s"
              type="number"
              min={0}
              max={59}
              value={s}
              onChange={(e) => onChangeDuration(formatParts(h, m, Number(e.target.value) || 0))}
              className={inputCls + ' text-center'}
            />
          </div>
        </div>
      ) : (
        <div>
          <label htmlFor="dur-dist" className="block text-[10px] text-gray-400 mb-0.5">Metros</label>
          <input
            id="dur-dist"
            type="number"
            min={0}
            value={parseInt(duration) || 0}
            onChange={(e) => onChangeDuration(String(Number(e.target.value) || 0))}
            className={inputCls}
          />
        </div>
      )}
    </div>
  );
}
