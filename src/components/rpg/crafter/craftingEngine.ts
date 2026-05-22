import { applyDirectModifiersDelta } from '../quests/engine';
import type { ModifierMap, QuestState } from '../quests/types';
import {
  CRAFTER_ITEM_META,
  CRAFT_RECIPES,
  recipesForInput,
  type CraftRecipe,
} from './craftingConfig';

export type CrafterMaterialRow = {
  itemKey: string;
  label: string;
  quantity: number;
  recipes: CraftRecipe[];
};

export function listCrafterMaterials(state: QuestState): CrafterMaterialRow[] {
  const rows: CrafterMaterialRow[] = [];
  for (const [key, qty] of Object.entries(state.modifiers)) {
    if (qty <= 0 || !(key in CRAFTER_ITEM_META)) continue;
    const meta = CRAFTER_ITEM_META[key];
    rows.push({
      itemKey: key,
      label: meta.label,
      quantity: qty,
      recipes: recipesForInput(key),
    });
  }
  return rows.sort((a, b) => a.label.localeCompare(b.label));
}

export function canCraft(state: QuestState, recipe: CraftRecipe): boolean {
  return (state.modifiers[recipe.inputKey] ?? 0) >= recipe.inputQty;
}

export function craftModifierDelta(recipe: CraftRecipe): ModifierMap {
  return { [recipe.inputKey]: -recipe.inputQty, [recipe.outputKey]: recipe.outputQty };
}

export function applyCraft(
  state: QuestState,
  recipeId: string
): { state: QuestState } | { error: string } {
  const recipe = CRAFT_RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return { error: 'Unknown recipe.' };
  if (!canCraft(state, recipe)) {
    const meta = CRAFTER_ITEM_META[recipe.inputKey];
    return {
      error: `Need ${recipe.inputQty} ${meta?.label ?? recipe.inputKey}.`,
    };
  }

  let next = applyDirectModifiersDelta(state, { [recipe.inputKey]: -recipe.inputQty });
  next = applyDirectModifiersDelta(next, { [recipe.outputKey]: recipe.outputQty });
  return { state: next };
}
