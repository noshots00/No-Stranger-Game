import { useEffect, useState } from 'react';

/** Updates every `intervalMs` with current `Date.now()` for live clocks. */
export function useWallClock(intervalMs = 1000): number {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
