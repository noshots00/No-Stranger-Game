const EST_OFFSET_HOURS = -5;

export function getNextESTMidnight(nowMs: number = Date.now()): number {
  const estNowMs = nowMs + (EST_OFFSET_HOURS * 60 * 60 * 1000);
  const estNow = new Date(estNowMs);
  const year = estNow.getUTCFullYear();
  const month = estNow.getUTCMonth();
  const day = estNow.getUTCDate();
  const nextEstMidnightUtcMs = Date.UTC(year, month, day + 1, 0 - EST_OFFSET_HOURS, 0, 0, 0);
  return nextEstMidnightUtcMs;
}

export function getDayCountSince(startedAtMs: number, nowMs: number = Date.now()): number {
  const elapsed = Math.max(0, nowMs - startedAtMs);
  return Math.floor(elapsed / (1000 * 60 * 60 * 24)) + 1;
}
