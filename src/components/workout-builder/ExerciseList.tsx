import {
  DndContext,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { StrictExercise } from '../../types/workout';
import { ExerciseCard } from './ExerciseCard';
import { RestCard } from './RestCard';
import { SupersetGroup } from './SupersetGroup';
import { useWorkoutBuilder } from './WorkoutBuilderContext';
import { useDragSort } from '../../hooks/useDragSort';

// ─── Sortable wrapper ──────────────────────────────────────────────────────────

function SortableItem({
  exercise,
  isPartOfSuperset,
  isLast,
  lockType,
}: {
  exercise: StrictExercise;
  isPartOfSuperset: boolean;
  isLast: boolean;
  lockType?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  if (exercise.type === 'rest') {
    return (
      <div ref={setNodeRef} style={style}>
        <RestCard exercise={exercise} />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style}>
      <ExerciseCard
        exercise={exercise}
        isPartOfSuperset={isPartOfSuperset}
        isLast={isLast}
        lockType={lockType}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isInSuperset(exercises: StrictExercise[], index: number): boolean {
  if (exercises[index].type === 'rest') return false;
  if (exercises[index].supersetWithNext) return true;
  if (index > 0 && exercises[index - 1].supersetWithNext) return true;
  return false;
}

function getSupersetLeadIndex(exercises: StrictExercise[], index: number): number {
  let i = index;
  while (i > 0 && exercises[i - 1].supersetWithNext) i--;
  return i;
}

// ─── Main component ────────────────────────────────────────────────────────────

export interface ExerciseListProps {
  lockType?: boolean;
}

/**
 * DnD-sortable list of exercise cards for the workout editor.
 * Renders rest cards, superset groups, and individual exercise cards.
 * Includes bulk action bar and fill modal.
 */
export function ExerciseList({ lockType }: ExerciseListProps) {
  const { exercises, setExercises } = useWorkoutBuilder();

  const { activeId, sensors, handleDragStart, handleDragEnd } = useDragSort(exercises, setExercises);

  // Build render groups: superset groups are rendered together
  const rendered = new Set<number>();
  const groups: Array<{ type: 'single' | 'superset' | 'rest'; indices: number[] }> = [];

  exercises.forEach((ex, i) => {
    if (rendered.has(i)) return;
    if (ex.type === 'rest') {
      rendered.add(i);
      groups.push({ type: 'rest', indices: [i] });
      return;
    }
    if (isInSuperset(exercises, i)) {
      const lead = getSupersetLeadIndex(exercises, i);
      if (lead !== i) return; // will be rendered as part of lead's group
      // collect all in this superset
      const ssIndices: number[] = [];
      let j = lead;
      while (j < exercises.length && (j === lead || exercises[j - 1].supersetWithNext) && exercises[j].type !== 'rest') {
        ssIndices.push(j);
        rendered.add(j);
        if (!exercises[j].supersetWithNext) break;
        j++;
      }
      groups.push({ type: 'superset', indices: ssIndices });
    } else {
      rendered.add(i);
      groups.push({ type: 'single', indices: [i] });
    }
  });

  const activeExercise = activeId ? exercises.find((e) => e.id === activeId) : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={exercises.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {groups.map((group, gi) => {
              if (group.type === 'rest') {
                const ex = exercises[group.indices[0]];
                return (
                  <SortableItem
                    key={ex.id}
                    exercise={ex}
                    isPartOfSuperset={false}
                    isLast={group.indices[0] === exercises.length - 1}
                  />
                );
              }

              if (group.type === 'superset') {
                const lead = exercises[group.indices[0]];
                return (
                  <SupersetGroup key={`ss-${gi}`} leadExercise={lead}>
                    {group.indices.map((idx, ki) => (
                      <SortableItem
                        key={exercises[idx].id}
                        exercise={exercises[idx]}
                        isPartOfSuperset
                        isLast={idx === exercises.length - 1}
                        lockType={lockType}
                      />
                    ))}
                  </SupersetGroup>
                );
              }

              const ex = exercises[group.indices[0]];
              return (
                <SortableItem
                  key={ex.id}
                  exercise={ex}
                  isPartOfSuperset={false}
                  isLast={group.indices[0] === exercises.length - 1}
                  lockType={lockType}
                />
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeExercise ? (
            <div className="opacity-80 shadow-2xl rounded-xl">
              <ExerciseCard exercise={activeExercise} isPartOfSuperset={false} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

    </>
  );
}
