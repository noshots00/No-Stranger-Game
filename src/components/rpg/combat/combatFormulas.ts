import type { FighterState } from './combatTypes';
import { getEquipmentDamageBonus, getEquipmentDamageReduction } from './equipmentRegistry';

/** Max HP = (level + 10) + (CON × 10). */
export function getMaxHp(level: number, con: number): number {
  const safeLevel = Math.max(0, Math.floor(level));
  const safeCon = Math.max(1, Math.floor(con));
  return (safeLevel + 10) + safeCon * 10;
}

/** Base auto-attack damage = 1 + STR + DEX. */
export function getAutoAttackDamage(str: number, dex: number): number {
  return 1 + Math.max(0, Math.floor(str)) + Math.max(0, Math.floor(dex));
}

export function getConReduction(con: number): number {
  return Math.max(0, Math.floor(con) - 3);
}

export function getWisReduction(wis: number): number {
  return Math.max(0, Math.floor(wis) - 3);
}

/** Base crit = 2×; each DEX over 5 adds +20% crit damage. */
export function getCritMultiplier(dex: number): number {
  const extra = Math.max(0, Math.floor(dex) - 5) * 0.2;
  return 2 + extra;
}

export type DamageReductionInput = {
  rawDamage: number;
  defender: FighterState;
  isSpell: boolean;
};

/** Apply CON/WIS and equipment reductions to raw damage. */
export function applyDamageReduction({ rawDamage, defender, isSpell }: DamageReductionInput): number {
  let dmg = Math.max(0, Math.floor(rawDamage));
  if (!isSpell) {
    dmg -= getConReduction(defender.stats.con);
  }
  dmg -= getWisReduction(defender.stats.wis);
  dmg -= getEquipmentDamageReduction(defender.loadout.other);
  return Math.max(0, dmg);
}

export function getWeaponDamageBonus(fighter: FighterState): number {
  return getEquipmentDamageBonus(fighter.loadout.weapon);
}
