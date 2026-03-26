import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseCountdownReturn {
  countdown: number | null;
  isRunning: boolean;
  start: (seconds: number) => void;
  stop: () => void;
}

/**
 * Countdown timer. Calls `onComplete` when it reaches zero.
 * Safe to call `start` again to restart with a new duration.
 */
export function useCountdown(onComplete?: () => void): UseCountdownReturn {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const callbackRef = useRef(onComplete);
  callbackRef.current = onComplete;

  useEffect(() => {
    if (!isRunning || countdown === null) return;
    if (countdown <= 0) {
      setIsRunning(false);
      callbackRef.current?.();
      return;
    }
    const t = window.setTimeout(() => setCountdown((v) => (v ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [isRunning, countdown]);

  const start = useCallback((seconds: number) => {
    setCountdown(seconds);
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    setCountdown(null);
  }, []);

  return { countdown, isRunning, start, stop };
}
