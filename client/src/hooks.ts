import { useEffect, useState } from 'react';
import { bus } from './lib/events';

/** Bump whenever any mutation happens anywhere (via the global bus). */
export function useBusRefresh(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => bus.on(() => setTick((t) => t + 1)), []);
  return tick;
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong';
}
/**
 * A retry token for failed loads.
 *
 * Clearing the data alone does not re-run a fetch effect whose dependencies
 * have not changed — the classic "Try again does nothing" bug. Views include
 * this token in their effect deps and call `retry` from the error action.
 */
export function useRefreshKey(): [number, () => void] {
  const [attempt, setAttempt] = useState(0);
  return [attempt, () => setAttempt((n) => n + 1)];
}
