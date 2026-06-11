import { getEquipmentDef, isWeaponItemKey } from '../combat/equipmentRegistry';

/** Item name color tier — material (brown), weapon (red), equipment (blue), quest (gold). */
export type ItemNameCategory = 'material' | 'weapon' | 'equipment' | 'quest';

/** Tailwind classes — `!` wins over inherited / sibling text utilities on the same node. */
export const ITEM_NAME_COLOR_CLASS: Record<ItemNameCategory, string> = {
  material: '!text-[var(--rpg-item-material)]',
  weapon: '!text-[var(--loadout-slot-weapon)]',
  equipment: '!text-[var(--rpg-item-equipment)]',
  quest: '!text-[var(--rpg-item-quest)]',
};

export function getItemCategoryFromKey(itemKey: string): ItemNameCategory {
  if (isWeaponItemKey(itemKey)) return 'weapon';
  if (getEquipmentDef(itemKey)) return 'equipment';
  return 'material';
}

export function getItemCategoryFromInventoryOption(
  option: { kind: 'modifierItem'; key: string } | { kind: 'questItem' }
): ItemNameCategory {
  if (option.kind === 'questItem') return 'quest';
  return getItemCategoryFromKey(option.key);
}

export function itemNameClassName(category: ItemNameCategory): string {
  return `rpg-item-name ${ITEM_NAME_COLOR_CLASS[category]}`;
}

export function itemNameColorStyle(category: ItemNameCategory): { color: string } {
  switch (category) {
    case 'material':
      return { color: 'var(--rpg-item-material)' };
    case 'weapon':
      return { color: 'var(--loadout-slot-weapon)' };
    case 'equipment':
      return { color: 'var(--rpg-item-equipment)' };
    case 'quest':
      return { color: 'var(--rpg-item-quest)' };
  }
}
