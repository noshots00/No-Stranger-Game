import { characterStats } from '../constants';
import { getPrimaryStatTotal } from '../helpers';
import { getCharacterLevel } from '../quests/engine';
import type { QuestState } from '../quests/types';
import { getRaceDefinition } from '../races';
import { getCharacterClass } from '../classArchetype';
import type { CombatEncounterDef } from './combatEncounters';
import { getMaxHp } from './combatFormulas';
import { normalizeSkillId } from './skillRegistry';
import type { CombatLoadout, FighterSnapshot, FighterState, FighterStats, PassiveSkillSlot } from './combatTypes';

function statsFromModifiers(modifiers: QuestState['modifiers']): FighterStats {
  const get = (label: string): number => {
    const total = getPrimaryStatTotal(modifiers, label);
    return Math.max(1, Math.floor(total));
  };
  return {
    str: get('Strength'),
    dex: get('Dexterity'),
    con: get('Constitution'),
    int: get('Intelligence'),
    wis: get('Wisdom'),
    cha: get('Charisma'),
  };
}

function buildSkillLevels(modifiers: QuestState['modifiers']): Record<string, number> {
  const levels: Record<string, number> = {};
  for (const [key, value] of Object.entries(modifiers)) {
    if (!Number.isFinite(value) || value < 1) continue;
    const canonical = normalizeSkillId(key);
    if (canonical && (key.startsWith('skill:') || /Skill$/i.test(key) || /Spell$/i.test(key))) {
      const prev = levels[canonical] ?? 0;
      levels[canonical] = Math.max(prev, Math.floor(value));
    }
  }
  return levels;
}

function sanitizeLoadout(loadout: CombatLoadout | undefined): CombatLoadout {
  if (!loadout) return {};
  return {
    weapon: typeof loadout.weapon === 'string' ? loadout.weapon : undefined,
    other: typeof loadout.other === 'string' ? loadout.other : undefined,
    skillA: typeof loadout.skillA === 'string' ? normalizeSkillId(loadout.skillA) : undefined,
    skillB: typeof loadout.skillB === 'string' ? normalizeSkillId(loadout.skillB) : undefined,
  };
}

export function buildFighterFromQuestState(
  state: QuestState,
  opts?: { id?: string; pubkey?: string; currentHp?: number }
): FighterState {
  const level = getCharacterLevel(state);
  const stats = statsFromModifiers(state.modifiers);
  const maxHp = getMaxHp(level, stats.con);
  const hp =
    typeof opts?.currentHp === 'number' && Number.isFinite(opts.currentHp)
      ? Math.max(0, Math.min(maxHp, Math.floor(opts.currentHp)))
      : maxHp;

  const race = state.assignedRaceSlug
    ? getRaceDefinition(state.assignedRaceSlug)?.displayName ?? state.assignedRaceSlug
    : undefined;
  const className = getCharacterClass(state.modifiers);

  return {
    id: opts?.id ?? 'player',
    name: state.playerName.trim() || 'Stranger',
    level,
    stats,
    hp,
    maxHp,
    loadout: sanitizeLoadout(state.loadout),
    passives: [],
    skillLevels: buildSkillLevels(state.modifiers),
    race,
    className,
    pubkey: opts?.pubkey,
  };
}

export function buildFighterFromEncounter(def: CombatEncounterDef): FighterState {
  const { fighter } = def;
  const maxHp = fighter.maxHp ?? getMaxHp(fighter.level, fighter.stats.con);
  const passives: PassiveSkillSlot[] = fighter.passives.map((p) => ({
    skillId: normalizeSkillId(p.skillId) ?? p.skillId,
    level: p.level,
  }));
  const skillLevels: Record<string, number> = { ...fighter.skillLevels };
  for (const p of passives) {
    skillLevels[p.skillId] = Math.max(skillLevels[p.skillId] ?? 0, p.level);
  }

  return {
    id: def.id,
    name: def.displayName,
    level: fighter.level,
    stats: { ...fighter.stats },
    hp: maxHp,
    maxHp,
    loadout: sanitizeLoadout(fighter.loadout),
    passives,
    skillLevels,
  };
}

export function fighterToSnapshot(fighter: FighterState): FighterSnapshot {
  return {
    id: fighter.id,
    name: fighter.name,
    level: fighter.level,
    stats: { ...fighter.stats },
    maxHp: fighter.maxHp,
    loadout: { ...fighter.loadout },
    passives: fighter.passives.map((p) => ({ ...p })),
    skillLevels: { ...fighter.skillLevels },
    race: fighter.race,
    className: fighter.className,
    pubkey: fighter.pubkey,
  };
}

export function snapshotToFighter(snapshot: FighterSnapshot, currentHp?: number): FighterState {
  const hp =
    typeof currentHp === 'number'
      ? Math.max(0, Math.min(snapshot.maxHp, Math.floor(currentHp)))
      : snapshot.maxHp;
  return {
    id: snapshot.id,
    name: snapshot.name,
    level: snapshot.level,
    stats: { ...snapshot.stats },
    hp,
    maxHp: snapshot.maxHp,
    loadout: sanitizeLoadout(snapshot.loadout),
    passives: snapshot.passives.map((p) => ({ ...p })),
    skillLevels: { ...snapshot.skillLevels },
    race: snapshot.race,
    className: snapshot.className,
    pubkey: snapshot.pubkey,
  };
}

/** Read primary stat totals for fight card display. */
export function getStatLabels(): readonly string[] {
  return characterStats.map((row) => row[0] as string);
}
