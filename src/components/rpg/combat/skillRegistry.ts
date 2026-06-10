import type { CombatRng } from './combatRng';
import type { FighterState } from './combatTypes';
import {
  applyDamageReduction,
  getAutoAttackDamage,
  getCritMultiplier,
  getWeaponDamageBonus,
} from './combatFormulas';

export type SkillKind = 'active' | 'passive' | 'defensive';

export type ActiveSkillResult = {
  hit: boolean;
  rawDamage: number;
  isCrit: boolean;
  isSpell: boolean;
  appliesDebuff?: { type: 'next_attack_half'; targetId: string };
  flavor?: string;
};

export type SkillDef = {
  id: string;
  displayName: string;
  kind: SkillKind;
  aliases?: string[];
};

const SKILL_DEFS: SkillDef[] = [
  { id: 'skill:combat:bash', displayName: 'Bash', kind: 'active', aliases: ['BashSkill', 'skill:bash'] },
  { id: 'skill:combat:taunt', displayName: 'Taunt', kind: 'active', aliases: ['TauntSkill'] },
  { id: 'spell:fireball', displayName: 'Fireball', kind: 'active', aliases: ['FireballSpell'] },
  { id: 'spell:spark', displayName: 'Spark', kind: 'active', aliases: ['SparkSpell'] },
  { id: 'skill:combat:dodge', displayName: 'Dodge', kind: 'defensive', aliases: ['DodgeSkill'] },
  { id: 'skill:combat:parry', displayName: 'Parry', kind: 'defensive', aliases: ['ParrySkill'] },
  { id: 'skill:combat:evasion', displayName: 'Evasion', kind: 'passive', aliases: ['Evasion'] },
];

const ALIAS_TO_ID = new Map<string, string>();
for (const def of SKILL_DEFS) {
  ALIAS_TO_ID.set(def.id, def.id);
  for (const alias of def.aliases ?? []) {
    ALIAS_TO_ID.set(alias, def.id);
  }
}

export function normalizeSkillId(key: string | undefined): string | undefined {
  if (!key) return undefined;
  return ALIAS_TO_ID.get(key) ?? ALIAS_TO_ID.get(key.toLowerCase()) ?? key;
}

export function getSkillDef(skillId: string): SkillDef | undefined {
  const canonical = normalizeSkillId(skillId);
  return SKILL_DEFS.find((d) => d.id === canonical);
}

export function getSkillDisplayName(skillId: string): string {
  return getSkillDef(skillId)?.displayName ?? skillId;
}

/** Known spell labels for prose highlighting (`Spark`, `Fireball`, …). */
export function listSpellDisplayNames(): string[] {
  return SKILL_DEFS.filter((def) => def.id.startsWith('spell:')).map((def) => def.displayName);
}

export function isPassiveSkill(skillId: string): boolean {
  const def = getSkillDef(skillId);
  return def?.kind === 'passive';
}

export function isSpellSkillId(skillId: string): boolean {
  if (/Spell$/i.test(skillId)) return true;
  const canonical = normalizeSkillId(skillId) ?? skillId;
  return canonical.startsWith('spell:');
}

export function getSkillLevel(fighter: FighterState, skillId: string): number {
  const canonical = normalizeSkillId(skillId) ?? skillId;
  for (const [key, level] of Object.entries(fighter.skillLevels)) {
    if (normalizeSkillId(key) === canonical) return Math.max(0, Math.floor(level));
  }
  for (const p of fighter.passives) {
    if (normalizeSkillId(p.skillId) === canonical) return Math.max(0, Math.floor(p.level));
  }
  return 0;
}

/** Passive Evasion: each level gives opponents 1% miss chance. */
export function getEvasionMissChance(defender: FighterState): number {
  const level = getSkillLevel(defender, 'skill:combat:evasion');
  return Math.min(100, level);
}

/** Dodge: level% chance to dodge incoming attacks. */
export function rollDodge(defender: FighterState, rng: CombatRng): boolean {
  const level = getSkillLevel(defender, 'skill:combat:dodge');
  if (level <= 0) return false;
  return rng.rollPercent() <= level;
}

/** Parry: level × 5% chance to negate. */
export function rollParry(defender: FighterState, rng: CombatRng): boolean {
  const level = getSkillLevel(defender, 'skill:combat:parry');
  if (level <= 0) return false;
  return rng.rollPercent() <= level * 5;
}

export function resolveActiveSkill(
  skillId: string,
  attacker: FighterState,
  defender: FighterState,
  rng: CombatRng,
  forceCrit = false
): ActiveSkillResult {
  const canonical = normalizeSkillId(skillId) ?? skillId;
  const level = getSkillLevel(attacker, canonical);

  switch (canonical) {
    case 'skill:combat:bash': {
      const base = getAutoAttackDamage(attacker.stats.str, attacker.stats.dex);
      const bonus = 5 * Math.max(1, level);
      const raw = base + bonus + getWeaponDamageBonus(attacker);
      return { hit: true, rawDamage: raw, isCrit: forceCrit, isSpell: false, flavor: 'Bash' };
    }
    case 'skill:combat:taunt':
      return {
        hit: true,
        rawDamage: 0,
        isCrit: false,
        isSpell: false,
        appliesDebuff: { type: 'next_attack_half', targetId: defender.id },
        flavor: 'Taunt',
      };
    case 'spell:fireball': {
      const min = 8;
      const max = 20;
      const raw = rng.randomInt(min, max);
      return { hit: true, rawDamage: raw, isCrit: forceCrit, isSpell: true, flavor: 'Fireball' };
    }
    case 'spell:spark':
      return { hit: true, rawDamage: 5, isCrit: forceCrit, isSpell: true, flavor: 'Spark' };
    default: {
      const base = getAutoAttackDamage(attacker.stats.str, attacker.stats.dex);
      return { hit: true, rawDamage: base + getWeaponDamageBonus(attacker), isCrit: forceCrit, isSpell: false };
    }
  }
}

export function resolveAutoAttack(
  attacker: FighterState,
  _defender: FighterState,
  forceCrit = false
): ActiveSkillResult {
  const raw =
    getAutoAttackDamage(attacker.stats.str, attacker.stats.dex) + getWeaponDamageBonus(attacker);
  return { hit: true, rawDamage: raw, isCrit: forceCrit, isSpell: false, flavor: 'strike' };
}

export type DefenseResult = {
  negated: boolean;
  defendedBy?: string;
};

/** Check passive/defensive skills against an incoming attack. */
export function resolveDefense(
  defender: FighterState,
  attacker: FighterState,
  rng: CombatRng
): DefenseResult {
  const evasion = getEvasionMissChance(defender);
  if (evasion > 0 && rng.rollPercent() <= evasion) {
    return { negated: true, defendedBy: 'Evasion' };
  }
  if (rollDodge(defender, rng)) {
    return { negated: true, defendedBy: 'Dodge' };
  }
  if (rollParry(defender, rng)) {
    return { negated: true, defendedBy: 'Parry' };
  }
  void attacker;
  return { negated: false };
}

export function finalizeDamage(
  rawDamage: number,
  attacker: FighterState,
  defender: FighterState,
  isCrit: boolean,
  isSpell: boolean,
  damageBonusPct = 0,
  damageMultiplier = 1
): number {
  let dmg = rawDamage;
  if (damageBonusPct > 0) {
    dmg = Math.floor(dmg * (1 + damageBonusPct / 100));
  }
  if (isCrit) {
    dmg = Math.floor(dmg * getCritMultiplier(attacker.stats.dex));
  }
  dmg = Math.floor(dmg * damageMultiplier);
  return applyDamageReduction({ rawDamage: dmg, defender, isSpell });
}
