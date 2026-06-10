type EquipmentDef = {
  displayName?: string;
  damageBonus?: number;
  damageReduction?: number;
  slot: 'weapon' | 'other';
};

const EQUIPMENT: Record<string, EquipmentDef> = {
  'item:short-sword': { slot: 'weapon', damageBonus: 2 },
  'item:iron-sword': { slot: 'weapon', damageBonus: 2 },
  'item:hatchet': { slot: 'weapon', damageBonus: 2 },
  'item:small-pickaxe': { slot: 'weapon', damageBonus: 2 },
  'item:blacksmith-hammer': { slot: 'weapon', damageBonus: 2, displayName: "Blacksmith's Hammer" },
  'item:stone-mason-chisel': { slot: 'other', damageBonus: 2 },
  'item:wooden-shield': { slot: 'other', damageReduction: 1 },
  'item:leather-armor': { slot: 'other', damageReduction: 2 },
};

export function getEquipmentDef(itemKey: string | undefined): EquipmentDef | undefined {
  if (!itemKey) return undefined;
  return EQUIPMENT[itemKey];
}

export function getEquipmentDisplayLabel(itemKey: string): string | undefined {
  return EQUIPMENT[itemKey]?.displayName;
}

export function getEquipmentDamageBonus(itemKey: string | undefined): number {
  return getEquipmentDef(itemKey)?.damageBonus ?? 0;
}

export function getEquipmentDamageReduction(itemKey: string | undefined): number {
  return getEquipmentDef(itemKey)?.damageReduction ?? 0;
}

export function isWeaponItemKey(key: string): boolean {
  const def = EQUIPMENT[key];
  return def?.slot === 'weapon';
}

export function isOtherEquipmentItemKey(key: string): boolean {
  const def = EQUIPMENT[key];
  return def?.slot === 'other';
}

export function listEquipmentKeys(): string[] {
  return Object.keys(EQUIPMENT);
}
