/**
 * Shared in-quest combat encounter definitions (quest scene chrome swap).
 */

import { NPC_PORTRAIT_BY_ID } from '@/components/rpg/rpgArtAssignments';

export type CombatEncounterId = 'carl';

export type CombatEncounterDef = {
  id: CombatEncounterId;
  displayName: string;
  portraitSrc: string;
  portraitAlt: string;
  maxEnemyHp: number;
  enterLine: string;
  fleeLine: string;
  victoryLines: readonly string[];
};

export const COMBAT_ENCOUNTERS: Record<CombatEncounterId, CombatEncounterDef> = {
  carl: {
    id: 'carl',
    displayName: 'Carl',
    portraitSrc: NPC_PORTRAIT_BY_ID.carl,
    portraitAlt: 'Carl',
    maxEnemyHp: 100,
    enterLine: 'You raise your hand—Carl’s smile vanishes. Steel intent fills the threshold.',
    fleeLine: 'You break off and step back. Carl lowers his guard, watching.',
    victoryLines: [
      'Carl staggers, then steadies himself against the doorframe.',
      '“Enough,” he says. “You have the measure of it. Next time, choose your words first.”',
    ],
  },
};

export function getCombatEncounter(id: CombatEncounterId): CombatEncounterDef {
  return COMBAT_ENCOUNTERS[id];
}
