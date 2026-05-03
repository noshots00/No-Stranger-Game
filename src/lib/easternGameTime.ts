import { addDays, differenceInCalendarDays } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

/** US Eastern civil time (EST/EDT per DST). */
export const EASTERN_GAME_TIMEZONE = 'America/New_York';

export const FIVE_MINUTE_GAME_PERIOD_MS = 5 * 60 * 1000;

function parseYmdAsUtcNoon(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
}

/** Start of the Eastern calendar day containing `utcMs` (that day's 00:00 in America/New_York). */
export function getEasternMidnightUtc(utcMs: number): number {
  const ymd = formatInTimeZone(utcMs, EASTERN_GAME_TIMEZONE, 'yyyy-MM-dd');
  return fromZonedTime(`${ymd}T00:00:00`, EASTERN_GAME_TIMEZONE).getTime();
}

/** Eastern midnight UTC for a calendar date string (`yyyy-MM-dd`) in America/New_York. */
export function getEasternMidnightUtcFromYmd(ymd: string): number {
  return fromZonedTime(`${ymd}T00:00:00`, EASTERN_GAME_TIMEZONE).getTime();
}

export function easternCalendarDaysBetweenYmd(startYmd: string, endYmd: string): number {
  return differenceInCalendarDays(parseYmdAsUtcNoon(endYmd), parseYmdAsUtcNoon(startYmd));
}

/**
 * In-game day index (1-based) from immutable Eastern creation date + current time.
 * Test mode: 5-minute steps from Eastern midnight on the creation date.
 */
export function computeGameDayCounterFromCreationYmd(
  creationDateEastern: string | null,
  nowUtcMs: number,
  useFiveMinuteTestPeriods: boolean
): number {
  if (!creationDateEastern) return 1;
  if (useFiveMinuteTestPeriods) {
    const anchor = getEasternMidnightUtcFromYmd(creationDateEastern);
    const rel = nowUtcMs - anchor;
    if (rel < 0) return 1;
    const nowSlot = Math.floor(rel / FIVE_MINUTE_GAME_PERIOD_MS);
    return Math.max(1, nowSlot + 1);
  }
  const todayYmd = formatInTimeZone(nowUtcMs, EASTERN_GAME_TIMEZONE, 'yyyy-MM-dd');
  return Math.max(1, easternCalendarDaysBetweenYmd(creationDateEastern, todayYmd) + 1);
}

function nextEasternMidnightStrictlyAfter(afterUtcMs: number): number {
  const dayStart = getEasternMidnightUtc(afterUtcMs);
  if (afterUtcMs < dayStart) return dayStart;
  const ymd = formatInTimeZone(afterUtcMs, EASTERN_GAME_TIMEZONE, 'yyyy-MM-dd');
  const nextYmd = formatInTimeZone(
    addDays(fromZonedTime(`${ymd}T12:00:00`, EASTERN_GAME_TIMEZONE), 1),
    EASTERN_GAME_TIMEZONE,
    'yyyy-MM-dd'
  );
  return fromZonedTime(`${nextYmd}T00:00:00`, EASTERN_GAME_TIMEZONE).getTime();
}

/** Next reset instant strictly after `afterUtcMs` in virtual time (UTC ms). */
export function computeNextGameResetUtcFromCreationYmd(
  creationDateEastern: string | null,
  afterUtcMs: number,
  useFiveMinuteTestPeriods: boolean
): number | null {
  if (!creationDateEastern) return null;
  if (useFiveMinuteTestPeriods) {
    const anchor = getEasternMidnightUtcFromYmd(creationDateEastern);
    const rel = afterUtcMs - anchor;
    if (rel < 0) return anchor + FIVE_MINUTE_GAME_PERIOD_MS;
    const nextIdx = Math.floor(rel / FIVE_MINUTE_GAME_PERIOD_MS) + 1;
    return anchor + nextIdx * FIVE_MINUTE_GAME_PERIOD_MS;
  }
  return nextEasternMidnightStrictlyAfter(afterUtcMs);
}
