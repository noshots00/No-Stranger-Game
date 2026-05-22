import type { ModifierMap } from '@/components/rpg/quests/types';
import { COPPER_PER_GOLD } from '../constants';

/** NPC village market stall — unlimited stock, fixed price, no Nostr listing. */
export type VillageSupplyGood = {
  itemKey: string;
  label: string;
  priceCopper: number;
};

export const IRON_ORE_ITEM_KEY = 'item:iron-ore';

export const VILLAGE_MARKET_SUPPLIES: readonly VillageSupplyGood[] = [
  { itemKey: IRON_ORE_ITEM_KEY, label: 'Iron Ore', priceCopper: COPPER_PER_GOLD },
  { itemKey: 'item:wolf-hide', label: 'Wolf Hide', priceCopper: COPPER_PER_GOLD },
  { itemKey: 'item:wolf-pelt', label: 'Wolf Pelt', priceCopper: COPPER_PER_GOLD },
] as const;

export function villageSupplyBuyDelta(good: VillageSupplyGood): ModifierMap {
  return { copper: -good.priceCopper, [good.itemKey]: 1 };
}
