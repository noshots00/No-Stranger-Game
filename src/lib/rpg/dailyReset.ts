export function getNextESTMidnight(nowMs: number = Date.now()): number {
  const now = new Date(nowMs);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(24, 0, 0, 0);
  return tomorrow.getTime();
}

export function getDayCountSince(startedAtMs: number, nowMs: number = Date.now()): number {
  const elapsed = Math.max(0, nowMs - startedAtMs);
  return Math.floor(elapsed / (1000 * 60 * 60 * 24)) + 1;
}
