import { useState, useCallback } from 'react';

export interface UseBulkSelectReturn {
  mode: boolean;
  selected: Set<string>;
  count: number;
  enter: () => void;
  exit: () => void;
  toggle: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clear: () => void;
}

/** Multi-select mode with enter/exit and per-item toggle. */
export function useBulkSelect(): UseBulkSelectReturn {
  const [mode, setMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const enter = useCallback(() => setMode(true), []);

  const exit = useCallback(() => {
    setMode(false);
    setSelected(new Set());
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelected(new Set(ids));
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  return { mode, selected, count: selected.size, enter, exit, toggle, selectAll, clear };
}
