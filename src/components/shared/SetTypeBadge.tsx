import { useState, useRef, useEffect } from 'react';
import { Flame, CornerDownRight, Dumbbell } from 'lucide-react';
import type { SetType } from '../../types/workout';

export interface SetTypeBadgeProps {
  /** Current set type. Defaults to 'normal'. */
  type?: SetType;
  /** 1-based set index shown for normal sets. */
  index: number;
  /** If provided, clicking opens a picker. */
  onChangeType?: (type: SetType) => void;
}

const OPTIONS: { type: SetType; label: string }[] = [
  { type: 'normal', label: 'Normal' },
  { type: 'warmup', label: 'Aquecimento' },
  { type: 'dropset', label: 'Drop Set' },
];

export function SetTypeBadge({ type = 'normal', index, onChangeType }: SetTypeBadgeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (t: SetType) => {
    onChangeType?.(t);
    setOpen(false);
  };

  const base =
    'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors shrink-0';

  const badgeClass =
    type === 'warmup'
      ? `${base} bg-amber-100 text-amber-600 hover:bg-amber-200`
      : type === 'dropset'
        ? `${base} bg-orange-100 text-orange-600 hover:bg-orange-200`
        : `${base} bg-gray-100 text-gray-600 hover:bg-gray-200`;

  const badgeContent =
    type === 'warmup' ? (
      <Flame size={14} />
    ) : type === 'dropset' ? (
      <CornerDownRight size={14} />
    ) : (
      index + 1
    );

  const title =
    type === 'warmup'
      ? 'Aquecimento'
      : type === 'dropset'
        ? 'Drop Set'
        : 'Normal';

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => onChangeType && setOpen((v) => !v)}
        title={`${title} — clique para mudar`}
        className={badgeClass}
      >
        {badgeContent}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[130px]">
          {OPTIONS.map((opt) => {
            const icon =
              opt.type === 'warmup' ? (
                <Flame size={13} className="text-amber-500" />
              ) : opt.type === 'dropset' ? (
                <CornerDownRight size={13} className="text-orange-500" />
              ) : (
                <Dumbbell size={13} className="text-gray-500" />
              );

            const active = opt.type === type;

            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => handleSelect(opt.type)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left transition-colors hover:bg-gray-50 ${active ? 'bg-yellow-50 text-yellow-700' : 'text-gray-700'}`}
              >
                {icon}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
