/**
 * Shared in-quest combat encounter definitions (quest scene chrome swap).
 */

import { NPC_PORTRAIT_BY_ID } from '@/components/rpg/rpgArtAssignments';
import type { CombatLoadout, FighterStats, PassiveSkillSlot } from './combatTypes';

export type CombatEncounterId = 'carl' | 'trainer';

export type EncounterFighterDef = {
  level: number;
  stats: FighterStats;
  /** Optional override (Carl = 45 per design). */
  maxHp?: number;
  loadout: CombatLoadout;
  passives: PassiveSkillSlot[];
  skillLevels?: Record<string, number>;
};

export type CombatEncounterDef = {
  id: CombatEncounterId;
  displayName: string;
  portraitSrc: string;
  portraitAlt: string;
  fighter: EncounterFighterDef;
  enterLine: string;
  fleeLine: string;
  victoryLines: readonly string[];
  defeatLines: readonly string[];
  /** @deprecated Flavor-only; engine generates log lines. Kept for reference. */
  playerStrikeLines?: readonly string[];
  /** @deprecated Flavor-only; engine generates log lines. */
  enemyRetaliateLines?: readonly string[];
};

export const COMBAT_ENCOUNTERS: Record<CombatEncounterId, CombatEncounterDef> = {
  carl: {
    id: 'carl',
    displayName: 'Carl',
    portraitSrc: NPC_PORTRAIT_BY_ID.carl,
    portraitAlt: 'Carl',
    fighter: {
      level: 3,
      stats: { str: 4, dex: 3, con: 4, int: 2, wis: 2, cha: 2 },
      maxHp: 45,
      loadout: {
        skillA: 'skill:combat:bash',
        skillB: 'skill:combat:taunt',
      },
      passives: [{ skillId: 'skill:combat:parry', level: 2 }],
      skillLevels: {
        'skill:combat:bash': 1,
        'skill:combat:taunt': 1,
        'skill:combat:parry': 2,
      },
    },
    enterLine: "You raise your hand—Carl's smile vanishes. Steel intent fills the threshold.",
    fleeLine: 'You break off and step back. Carl lowers his guard, watching.',
    victoryLines: [
      'Carl staggers, then steadies himself against the doorframe.',
      '"Enough," he says. "You have the measure of it. Next time, choose your words first."',
    ],
    defeatLines: [
      'Your legs buckle—you hit the ground hard.',
      "Carl sheathes his intent. \"Rest. You're not ready for that yet.\"",
    ],
  },
  trainer: {
    id: 'trainer',
    displayName: 'The Trainer',
    portraitSrc: NPC_PORTRAIT_BY_ID.trainer,
    portraitAlt: 'Arena trainer',
    fighter: {
      level: 4,
      stats: { str: 5, dex: 4, con: 5, int: 2, wis: 3, cha: 2 },
      loadout: {
        skillA: 'skill:combat:bash',
        skillB: 'skill:combat:bash',
      },
      passives: [{ skillId: 'skill:combat:parry', level: 3 }],
      skillLevels: {
        'skill:combat:bash': 2,
        'skill:combat:parry': 3,
      },
    },
    enterLine: "The trainer rolls his shoulders and raises his guard. \"Show me what you've got.\"",
    fleeLine: 'You step out of the ring. The trainer lowers his hands and nods you off.',
    victoryLines: [
      'The trainer drops his guard and catches his breath.',
      '"Not bad," he says. "Come back when you want another round."',
    ],
    defeatLines: [
      'You drop to one knee, breath gone.',
      "The trainer offers a hand up. \"Again when you're ready.\"",
    ],
  },
};

export function getCombatEncounter(id: CombatEncounterId): CombatEncounterDef {
  return COMBAT_ENCOUNTERS[id];
}

/** @deprecated Use fighter.maxHp from encounter def. */
export function getEncounterMaxEnemyHp(id: CombatEncounterId): number {
  const def = COMBAT_ENCOUNTERS[id];
  return def.fighter.maxHp ?? def.fighter.stats.con * 10 + def.fighter.level + 10;
}
