/** Shared clock / reset formatting for the unified game header status strip. */

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Wall-clock time only (no calendar date). */
export function formatWallClockTime(now: Date): string {
  const hours = pad2(now.getHours());
  const minutes = pad2(now.getMinutes());
  const seconds = pad2(now.getSeconds());
  return `${hours}:${minutes}:${seconds}`;
}

export function formatRemainingUntilReset(remainingMs: number): { full: string; compact: string } {
  if (remainingMs < 120_000) {
    const m = Math.max(0, remainingMs / 60_000);
    const full = `Reset in ${m.toFixed(1)}m`;
    return { full, compact: `${m.toFixed(1)}m` };
  }
  if (remainingMs < 3_600_000) {
    const m = remainingMs / 60_000;
    const full = `Reset in ${m.toFixed(1)}m`;
    return { full, compact: `${m.toFixed(1)}m` };
  }
  const hours = remainingMs / 3_600_000;
  const full = `Reset in ${hours.toFixed(1)}h`;
  return { full, compact: `${hours.toFixed(1)}h` };
}

export function formatResetIn(nextResetMs: number | null, now: number): string {
  if (nextResetMs === null) return 'Reset in --';
  const remainingMs = Math.max(0, nextResetMs - now);
  return formatRemainingUntilReset(remainingMs).full;
}

/** Short label for narrow viewports (avoids clipping “Reset in …” on iOS). */
export function formatResetInCompact(nextResetMs: number | null, now: number): string {
  if (nextResetMs === null) return '—';
  const remainingMs = Math.max(0, nextResetMs - now);
  return formatRemainingUntilReset(remainingMs).compact;
}
