import { Dumbbell, Tag } from 'lucide-react';
import type { StrictExercise } from '../types/workout';
import { MediaPreview } from './MediaPreview';
import { MuscleMap } from './MuscleMap';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg">{exercise.name}</DialogTitle>
          {(exercise.category || exercise.equipment) && (
            <div className="flex items-center gap-2 flex-wrap">
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
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">
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

          <MuscleMap category={exercise.category} />

          {exercise.orientacoes && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Orientações</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{exercise.orientacoes}</p>
            </div>
          )}

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
      </DialogContent>
    </Dialog>
  );
}
