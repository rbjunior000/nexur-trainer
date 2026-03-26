import { useState, useCallback } from 'react';
import { useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';

export interface UseDragSortReturn {
  activeId: string | null;
  sensors: ReturnType<typeof useSensors>;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
}

/**
 * Wrapper around @dnd-kit for vertical sortable lists.
 * Calls `onChange` with the reordered array after a drop.
 */
export function useDragSort<T extends { id: string }>(
  items: T[],
  onChange: (items: T[]) => void,
): UseDragSortReturn {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (over && active.id !== over.id) {
        const oldIndex = items.findIndex((i) => i.id === String(active.id));
        const newIndex = items.findIndex((i) => i.id === String(over.id));
        if (oldIndex !== -1 && newIndex !== -1) {
          onChange(arrayMove(items, oldIndex, newIndex));
        }
      }
    },
    [items, onChange],
  );

  return { activeId, sensors, handleDragStart, handleDragEnd };
}
