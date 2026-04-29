export function getEstNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
}

export function getNextEstMidnight(): number {
  const est = getEstNow();
  const tomorrow = new Date(est);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(24, 0, 0, 0);
  return tomorrow.getTime();
}

export function getCountdownToMidnight(targetTs: number): string {
  const now = Date.now();
  const diff = Math.max(0, targetTs - now);
  const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
  return `${h}:${m}:${s}`;
}
