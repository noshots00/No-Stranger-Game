import type { ModifierMap } from '@/components/rpg/quests/types';

export type MerchantTradeGood = {
  itemKey: string;
  label: string;
  /** Single price for both buy and sell (coppers, before canonical coin fold). */
  priceCopper: number;
};

/** All stackable goods the forest merchant deals in (tests multi-item shop + inventory). */
export const MERCHANT_TRADE_GOODS: readonly MerchantTradeGood[] = [
  { itemKey: 'item:wolf-pelt', label: 'Wolf pelt', priceCopper: 80 },
  { itemKey: 'item:glass-bead', label: 'Glass bead', priceCopper: 40 },
  { itemKey: 'item:iron-nail', label: 'Iron nail', priceCopper: 60 },
  { itemKey: 'item:dried-herb-bundle', label: 'Dried herb bundle', priceCopper: 100 },
] as const;

/** @deprecated use MERCHANT_TRADE_GOODS — kept for older imports */
export const WOLF_PELT_ITEM_KEY = 'item:wolf-pelt';
export const WOLF_PELT_PRICE_COPPER = 80;

/** Repeatable “I need gold” via merchant Talk — intentionally abusable for now (economy pass TBD). */
export const MERCHANT_GOLD_STIPEND_DELTA: ModifierMap = { gold: 1 };

export function buyTradeGoodDelta(good: MerchantTradeGood): ModifierMap {
  return { copper: -good.priceCopper, [good.itemKey]: 1 };
}

export function sellTradeGoodDelta(good: MerchantTradeGood): ModifierMap {
  return { copper: good.priceCopper, [good.itemKey]: -1 };
}
