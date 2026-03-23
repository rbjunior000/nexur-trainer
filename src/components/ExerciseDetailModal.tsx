import { X, Dumbbell, Tag } from 'lucide-react';
import type { StrictExercise } from '../types/workout';
import { MediaPreview } from './MediaPreview';

export function ExerciseDetailModal({
  exercise,
  onClose,
}: {
  exercise: StrictExercise;
  onClose: () => void;
}) {
  const hasMedia1 = !!exercise.media1;
  const hasMedia2 = !!exercise.media2;
  const hasBoth = hasMedia1 && hasMedia2;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col shadow-xl">

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{exercise.name}</h2>
            {(exercise.category || exercise.equipment) && (
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {exercise.category && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    <Tag size={10} />
                    {exercise.category}
                  </span>
                )}
                {exercise.equipment && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    <Dumbbell size={10} />
                    {exercise.equipment}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 pb-6 space-y-4">

          {/* Media */}
          {(hasMedia1 || hasMedia2) && (
            <div className={hasBoth ? 'grid grid-cols-2 gap-2' : ''}>
              {hasMedia1 && (
                <div className="rounded-xl overflow-hidden bg-gray-100 aspect-square">
                  <MediaPreview media={exercise.media1} alt={exercise.name} className="w-full h-full object-cover" />
                </div>
              )}
              {hasMedia2 && (
                <div className="rounded-xl overflow-hidden bg-gray-100 aspect-square">
                  <MediaPreview media={exercise.media2} alt={`${exercise.name} 2`} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}

          {/* Orientações */}
          {exercise.orientacoes && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Orientações</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{exercise.orientacoes}</p>
            </div>
          )}

          {/* Notes (if any) */}
          {exercise.notes && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Notas do treino</p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{exercise.notes}</p>
            </div>
          )}

          {!hasMedia1 && !hasMedia2 && !exercise.orientacoes && !exercise.notes && (
            <p className="text-center text-gray-400 text-sm py-4">Nenhuma informação adicional.</p>
          )}
        </div>
      </div>
    </div>
  );
}
