import type { Sport } from '../../types/aerobic';
import { SPORT_LABELS } from '../../types/aerobic';

export interface SportSelectorProps {
  value: Sport;
  onChange: (sport: Sport) => void;
}

const SPORTS: Sport[] = ['running', 'cycling', 'swimming'];

/**
 * Horizontal button group for selecting the workout sport.
 */
export function SportSelector({ value, onChange }: SportSelectorProps) {
  return (
    <div className="flex gap-1.5">
      {SPORTS.map((sport) => (
        <button
          key={sport}
          type="button"
          onClick={() => onChange(sport)}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            value === sport
              ? 'bg-yellow-400 text-gray-900'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {SPORT_LABELS[sport]}
        </button>
      ))}
    </div>
  );
}
