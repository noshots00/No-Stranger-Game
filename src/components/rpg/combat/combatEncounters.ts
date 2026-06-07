/**
 * Shared in-quest combat encounter definitions (quest scene chrome swap).
 */

import { NPC_PORTRAIT_BY_ID } from '@/components/rpg/rpgArtAssignments';

export type CombatEncounterId = 'carl' | 'trainer';

export type CombatEncounterDef = {
  id: CombatEncounterId;
  displayName: string;
  portraitSrc: string;
  portraitAlt: string;
  maxEnemyHp: number;
  enterLine: string;
  fleeLine: string;
  victoryLines: readonly string[];
  defeatLines: readonly string[];
  playerStrikeLines: readonly string[];
  enemyRetaliateLines: readonly string[];
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
    defeatLines: [
      'Your legs buckle—you hit the ground hard.',
      'Carl sheathes his intent. “Rest. You’re not ready for that yet.”',
    ],
    playerStrikeLines: [
      'You strike Carl.',
      'You press the attack.',
      'Your blow lands—Carl shifts his footing.',
    ],
    enemyRetaliateLines: [
      'Carl parries and counters.',
      'Carl blocks, then answers with a sharp riposte.',
      'Carl meets your strike and gives ground only an inch.',
    ],
  },
  trainer: {
    id: 'trainer',
    displayName: 'The Trainer',
    portraitSrc: NPC_PORTRAIT_BY_ID.trainer,
    portraitAlt: 'Arena trainer',
    maxEnemyHp: 100,
    enterLine: 'The trainer rolls his shoulders and raises his guard. “Show me what you’ve got.”',
    fleeLine: 'You step out of the ring. The trainer lowers his hands and nods you off.',
    victoryLines: [
      'The trainer drops his guard and catches his breath.',
      '“Not bad,” he says. “Come back when you want another round.”',
    ],
    defeatLines: [
      'You drop to one knee, breath gone.',
      'The trainer offers a hand up. “Again when you’re ready.”',
    ],
    playerStrikeLines: [
      'You strike the trainer.',
      'You press the attack.',
      'Your blow lands—the trainer shifts his footing.',
    ],
    enemyRetaliateLines: [
      'The trainer parries and counters.',
      'The trainer blocks, then answers with a sharp riposte.',
      'The trainer meets your strike and gives ground only an inch.',
    ],
  },
};

export function getCombatEncounter(id: CombatEncounterId): CombatEncounterDef {
  return COMBAT_ENCOUNTERS[id];
}
