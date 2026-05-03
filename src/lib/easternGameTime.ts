import { addDays, differenceInCalendarDays, subDays } from 'date-fns';
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

/** Whole Eastern calendar days from `startUtcMs` to `endUtcMs` (can be negative). */
export function easternCalendarDaysBetween(startUtcMs: number, endUtcMs: number): number {
  const a = formatInTimeZone(startUtcMs, EASTERN_GAME_TIMEZONE, 'yyyy-MM-dd');
  const b = formatInTimeZone(endUtcMs, EASTERN_GAME_TIMEZONE, 'yyyy-MM-dd');
  return differenceInCalendarDays(parseYmdAsUtcNoon(b), parseYmdAsUtcNoon(a));
}

export function subtractEasternCalendarDaysFromUtc(utcMs: number, calendarDays: number): number {
  if (calendarDays <= 0) return getEasternMidnightUtc(utcMs);
  const ymd = formatInTimeZone(utcMs, EASTERN_GAME_TIMEZONE, 'yyyy-MM-dd');
  const noonZoned = fromZonedTime(`${ymd}T12:00:00`, EASTERN_GAME_TIMEZONE);
  const shifted = subDays(noonZoned, calendarDays);
  const newYmd = formatInTimeZone(shifted, EASTERN_GAME_TIMEZONE, 'yyyy-MM-dd');
  return fromZonedTime(`${newYmd}T00:00:00`, EASTERN_GAME_TIMEZONE).getTime();
}

/**
 * In-game "day index" (1-based): either Eastern calendar days since the character's first Eastern
 * day, or 5-minute slots aligned to Eastern midnight but counted from the slot that contains
 * character creation (test mode).
 */
export function computeGameDayCounter(
  characterStartUtcMs: number,
  nowUtcMs: number,
  useFiveMinuteTestPeriods: boolean
): number {
  if (useFiveMinuteTestPeriods) {
    const anchor = getEasternMidnightUtc(characterStartUtcMs);
    const startSlot = Math.floor((characterStartUtcMs - anchor) / FIVE_MINUTE_GAME_PERIOD_MS);
    const nowSlot = Math.floor((nowUtcMs - anchor) / FIVE_MINUTE_GAME_PERIOD_MS);
    return Math.max(1, nowSlot - startSlot + 1);
  }
  return Math.max(1, easternCalendarDaysBetween(characterStartUtcMs, nowUtcMs) + 1);
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
export function computeNextGameResetUtc(
  characterStartUtcMs: number,
  afterUtcMs: number,
  useFiveMinuteTestPeriods: boolean
): number {
  if (useFiveMinuteTestPeriods) {
    const anchor = getEasternMidnightUtc(characterStartUtcMs);
    const rel = afterUtcMs - anchor;
    if (rel < 0) return anchor + FIVE_MINUTE_GAME_PERIOD_MS;
    const nextIdx = Math.floor(rel / FIVE_MINUTE_GAME_PERIOD_MS) + 1;
    return anchor + nextIdx * FIVE_MINUTE_GAME_PERIOD_MS;
  }
  return nextEasternMidnightStrictlyAfter(afterUtcMs);
}
