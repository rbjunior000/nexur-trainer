import { ChevronRight } from 'lucide-react';
import type { StrictExercise, ExerciseType, StrictSet } from '../../types/workout';
import { MediaPreview } from '../MediaPreview';

function fmtDur(d?: string): string {
  if (!d) return '?';
  const parts = d.split(':').map(Number);
  const total = (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h${m > 0 ? m + 'm' : ''}`;
  if (m > 0 && s > 0) return `${m}m${s}s`;
  if (m > 0) return `${m}min`;
  return `${s}s`;
}

function summarizeSet(set: StrictSet, type: ExerciseType, repsMode?: string): string {
  if (type === 'weight_reps') {
    const reps =
      repsMode === 'range' && set.repsRange
        ? `${set.repsRange[0] ?? 0}-${set.repsRange[1] ?? 0}`
        : String(set.reps ?? '?');
    return set.weight ? `${reps}×${set.weight}kg` : reps;
  }
  if (type === 'duration') return fmtDur(set.duration);
  if (type === 'distance') return set.distance ? `${set.distance}km` : '?';
  return '';
}

export interface ExerciseSummaryRowProps {
  exercise: StrictExercise;
  /** Called when the user taps the row to open the full editor. */
  onTap: () => void;
}

/**
 * Compact mobile row: thumbnail + name + type badge + set list preview.
 * Tap opens the full exercise editor sheet.
 */
export function ExerciseSummaryRow({ exercise, onTap }: ExerciseSummaryRowProps) {
  const typeColors: Record<string, { bg: string; text: string; label: string }> = {
    weight_reps: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Peso e Reps' },
    duration: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Duração' },
    distance: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Distância' },
  };
  const cfg = typeColors[exercise.type] ?? typeColors.weight_reps;

  return (
    <button
      type="button"
      onClick={onTap}
      className="flex items-start gap-2.5 flex-1 min-w-0 text-left py-0.5"
    >
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        <MediaPreview media={exercise.media1} alt={exercise.name} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate leading-tight">{exercise.name}</p>
        <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>
          {cfg.label}
        </span>
        {exercise.sets.length > 0 && (
          <div className="flex flex-col mt-0.5">
            {exercise.sets.slice(0, 5).map((s, i) => {
              const label = summarizeSet(s, exercise.type, exercise.repsMode);
              if (!label) return null;
              return (
                <span key={s.id} className="text-[11px] text-gray-500 leading-snug">
                  <span className="text-gray-300 mr-1">{i + 1}</span>
                  {label}
                </span>
              );
            })}
            {exercise.sets.length > 5 && (
              <span className="text-[11px] text-gray-400">+{exercise.sets.length - 5} séries</span>
            )}
          </div>
        )}
      </div>
      <ChevronRight size={14} className="text-gray-300 flex-shrink-0 mt-1" />
    </button>
  );
}
