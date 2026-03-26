import { useState, useCallback } from 'react';

export interface UseSetTrackerReturn {
  completed: Set<string>;
  isCompleted: (id: string) => boolean;
  toggle: (id: string) => void;
  markComplete: (id: string) => void;
  reset: () => void;
}

/** Tracks a set of completed IDs (e.g. training set completions). */
export function useSetTracker(): UseSetTrackerReturn {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const isCompleted = useCallback((id: string) => completed.has(id), [completed]);

  const toggle = useCallback((id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const markComplete = useCallback((id: string) => {
    setCompleted((prev) => new Set([...prev, id]));
  }, []);

  const reset = useCallback(() => setCompleted(new Set()), []);

  return { completed, isCompleted, toggle, markComplete, reset };
}
