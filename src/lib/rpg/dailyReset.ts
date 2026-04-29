import { getNextEstMidnight } from '@/utils/time';

export function getNextESTMidnight(nowMs: number = Date.now()): number {
  return getNextEstMidnight(nowMs);
}

export function getDayCountSince(startedAtMs: number, nowMs: number = Date.now()): number {
  const elapsed = Math.max(0, nowMs - startedAtMs);
  return Math.floor(elapsed / (1000 * 60 * 60 * 24)) + 1;
}
