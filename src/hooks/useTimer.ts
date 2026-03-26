import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseTimerReturn {
  elapsed: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  toggle: () => void;
}

/** Generic ascending timer. Returns elapsed seconds, play/pause controls. */
export function useTimer(): UseTimerReturn {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => setElapsed((v) => v + 1), 1000);
    } else {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
  }, []);
  const toggle = useCallback(() => setIsRunning((v) => !v), []);

  return { elapsed, isRunning, start, pause, reset, toggle };
}
