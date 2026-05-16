import type { ModifierMap } from '@/components/rpg/quests/types';

/** Stackable good for the forest merchant (shop + character inventory). */
export const WOLF_PELT_ITEM_KEY = 'item:wolf-pelt';

/**
 * One stipend is `1 gold` (240 coppers); 3 pelts per stipend at this price.
 * Balance: int repeat loop — revisit later.
 */
export const WOLF_PELT_PRICE_COPPER = 80;

/** Repeatable “I need gold” via merchant Talk — intentionally abusable for now (economy pass TBD). */
export const MERCHANT_GOLD_STIPEND_DELTA: ModifierMap = { gold: 1 };

export function buyWolfPeltDelta(): ModifierMap {
  return { copper: -WOLF_PELT_PRICE_COPPER, [WOLF_PELT_ITEM_KEY]: 1 };
}

export function sellWolfPeltDelta(): ModifierMap {
  return { copper: WOLF_PELT_PRICE_COPPER, [WOLF_PELT_ITEM_KEY]: -1 };
}
