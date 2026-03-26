import { Flame, CornerDownRight } from 'lucide-react';
import type { SetType } from '../../types/workout';

export interface SetTypeBadgeProps {
  /** Current set type. Defaults to 'normal'. */
  type?: SetType;
  /** 1-based set index shown for normal sets. */
  index: number;
  /** If provided, clicking cycles through Normal → Warmup → Dropset. */
  onChangeType?: (type: SetType) => void;
}

const CYCLE: SetType[] = ['normal', 'warmup', 'dropset'];

/**
 * Clickable badge that shows the set type.
 * - Normal: gray number
 * - Warmup: amber flame
 * - Dropset: orange corner-down-right
 */
export function SetTypeBadge({ type = 'normal', index, onChangeType }: SetTypeBadgeProps) {
  const handleClick = () => {
    if (!onChangeType) return;
    const next = CYCLE[(CYCLE.indexOf(type) + 1) % CYCLE.length];
    onChangeType(next);
  };

  const base =
    'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors shrink-0';

  if (type === 'warmup') {
    return (
      <button
        type="button"
        onClick={handleClick}
        title="Aquecimento — clique para mudar"
        className={`${base} bg-amber-100 text-amber-600 hover:bg-amber-200`}
      >
        <Flame size={14} />
      </button>
    );
  }

  if (type === 'dropset') {
    return (
      <button
        type="button"
        onClick={handleClick}
        title="Drop Set — clique para mudar"
        className={`${base} bg-orange-100 text-orange-600 hover:bg-orange-200`}
      >
        <CornerDownRight size={14} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Normal — clique para mudar"
      className={`${base} bg-gray-100 text-gray-600 hover:bg-gray-200`}
    >
      {index + 1}
    </button>
  );
}
