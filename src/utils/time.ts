const EST_TIMEZONE = 'America/New_York';
const MAX_MIDNIGHT_LOOKAHEAD_MS = 48 * 60 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;

function getFormatter() {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: EST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function getEstNow(): Date {
  return new Date();
}

export function getEstDateParts(timestamp: number = Date.now()): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const parts = getFormatter().formatToParts(new Date(timestamp));
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
    second: read('second'),
  };
}

export function getEstDayId(timestamp: number = Date.now()): string {
  const parts = getEstDateParts(timestamp);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

export function getNextEstMidnight(nowTs: number = Date.now()): number {
  const start = nowTs - (nowTs % ONE_MINUTE_MS) + ONE_MINUTE_MS;
  const end = nowTs + MAX_MIDNIGHT_LOOKAHEAD_MS;

  for (let ts = start; ts <= end; ts += ONE_MINUTE_MS) {
    const parts = getEstDateParts(ts);
    if (parts.hour === 0 && parts.minute === 0) return ts;
  }

  return nowTs + 24 * 60 * 60 * 1000;
}

export function getCountdownToMidnight(targetTs: number): string {
  const now = Date.now();
  const diff = Math.max(0, targetTs - now);
  const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
  return `${h}:${m}:${s}`;
}
