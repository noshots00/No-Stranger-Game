import { getDeterministicDailyRoll } from '@/lib/deterministicDailyRoll';
import { applyDirectModifiersDelta } from '../quests/engine';
import type { QuestState } from '../quests/types';
import { WOLF_HIDES_DAILY_FLAG, WOLF_HIDES_DAILY_ROLL_SEED, WOLF_HIDE_ITEM_KEY } from './constants';

/** Inclusive 1–10 hide count for a given game day. */
export function wolfHideGrantCountForDay(day: number): number {
  const roll = getDeterministicDailyRoll(day, WOLF_HIDES_DAILY_ROLL_SEED);
  return 1 + Math.floor(roll * 10);
}

export function isWolfHidesDailyActive(state: QuestState): boolean {
  return state.flags.includes(WOLF_HIDES_DAILY_FLAG);
}

export function acceptWolfHidesQuest(state: QuestState): QuestState {
  const flags = Array.from(new Set([...state.flags, WOLF_HIDES_DAILY_FLAG]));
  return { ...state, flags };
}

/** Grant hides for days since last grant while the side quest is active. */
export function applyWolfHideDailyGrants(
  state: QuestState,
  dayCounter: number
): { state: QuestState; grantedTotal: number; lines: string[] } {
  if (!isWolfHidesDailyActive(state)) {
    return { state, grantedTotal: 0, lines: [] };
  }

  const lastGrant = state.lastWolfHideGrantDay ?? 0;
  if (dayCounter <= lastGrant) {
    return { state, grantedTotal: 0, lines: [] };
  }

  let total = 0;
  const lines: string[] = [];
  let next = state;

  for (let day = lastGrant + 1; day <= dayCounter; day++) {
    const count = wolfHideGrantCountForDay(day);
    total += count;
    next = applyDirectModifiersDelta(next, { [WOLF_HIDE_ITEM_KEY]: count });
    lines.push(`The tavern trapper left ${count} wolf hide${count === 1 ? '' : 's'} for you.`);
  }

  return {
    state: { ...next, lastWolfHideGrantDay: dayCounter },
    grantedTotal: total,
    lines,
  };
}
