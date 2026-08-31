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