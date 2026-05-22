import type { ModifierMap } from '../quests/types';
import { getCopperFromModifiers, splitCopperIntoCoins } from '../helpers';

export const GUILD_CREATE_COST_GOLD = 10;

export const GUILD_CREATE_GOLD_DELTA: ModifierMap = { gold: -GUILD_CREATE_COST_GOLD };

export function hasAtLeastGold(modifiers: ModifierMap, goldAmount: number): boolean {
  const split = splitCopperIntoCoins(getCopperFromModifiers(modifiers));
  return split.gold >= goldAmount;
}
