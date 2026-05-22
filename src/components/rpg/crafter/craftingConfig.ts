/** Items shown in Crafter's Corner material list (not finished gear). */
export type CrafterMaterialKind = 'raw' | 'crafting';

export type CrafterItemMeta = {
  label: string;
  kind: CrafterMaterialKind;
};

export const CRAFTER_ITEM_META: Record<string, CrafterItemMeta> = {
  'item:iron-ore': { label: 'Iron Ore', kind: 'raw' },
  'item:iron-ingot': { label: 'Iron Ingot', kind: 'crafting' },
  'item:wolf-hide': { label: 'Wolf Hide', kind: 'raw' },
  'item:wolf-pelt': { label: 'Wolf Pelt', kind: 'raw' },
};

export const IRON_INGOT_ITEM_KEY = 'item:iron-ingot';
export const SHORT_SWORD_ITEM_KEY = 'item:short-sword';

export type CraftRecipe = {
  id: string;
  inputKey: string;
  inputQty: number;
  outputKey: string;
  outputQty: number;
  outputLabel: string;
};

export const CRAFT_RECIPES: readonly CraftRecipe[] = [
  {
    id: 'iron-ore-to-ingot',
    inputKey: 'item:iron-ore',
    inputQty: 1,
    outputKey: IRON_INGOT_ITEM_KEY,
    outputQty: 1,
    outputLabel: 'Iron Ingot',
  },
  {
    id: 'ingot-to-short-sword',
    inputKey: IRON_INGOT_ITEM_KEY,
    inputQty: 3,
    outputKey: SHORT_SWORD_ITEM_KEY,
    outputQty: 1,
    outputLabel: 'Short Sword',
  },
] as const;

export function recipesForInput(inputKey: string): CraftRecipe[] {
  return CRAFT_RECIPES.filter((r) => r.inputKey === inputKey);
}

export function isCrafterListItem(itemKey: string): boolean {
  return itemKey in CRAFTER_ITEM_META;
}
