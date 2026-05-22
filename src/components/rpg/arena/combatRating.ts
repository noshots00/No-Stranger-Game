import { characterStats } from '../constants';
import { getPrimaryStatTotal } from '../helpers';
import { getCharacterLevel } from '../quests/engine';
import type { QuestState } from '../quests/types';

const COMBAT_RATING_FLOOR = 1;

/** Sum of six primary stat totals (base + `stat:*` modifiers). */
export function getPrimaryStatsSum(modifiers: QuestState['modifiers']): number {
  let sum = 0;
  for (const row of characterStats) {
    const label = row[0];
    if (typeof label === 'string') sum += getPrimaryStatTotal(modifiers, label);
  }
  return sum;
}

/** Level (three skill levels) + primary stat sum; floored at 1. */
export function getCombatRating(state: QuestState): number {
  const raw = getCharacterLevel(state) + getPrimaryStatsSum(state.modifiers);
  return Math.max(COMBAT_RATING_FLOOR, Math.floor(raw));
}

export function getWinProbability(myCr: number, theirCr: number): number {
  const a = Math.max(COMBAT_RATING_FLOOR, myCr);
  const b = Math.max(COMBAT_RATING_FLOOR, theirCr);
  return a / (a + b);
}

export function rollFightWinner(
  fighterA: { pubkey: string; combatRating: number },
  fighterB: { pubkey: string; combatRating: number }
): string {
  const crA = Math.max(COMBAT_RATING_FLOOR, fighterA.combatRating);
  const crB = Math.max(COMBAT_RATING_FLOOR, fighterB.combatRating);
  return Math.random() < crA / (crA + crB) ? fighterA.pubkey : fighterB.pubkey;
}
