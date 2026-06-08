import { getPrimaryStatTotal } from '../helpers';
import type { ModifierMap, QuestProgress, QuestState } from '../quests/types';
import { getCharacterLevel } from '../quests/engine';
import { getMaxHp } from './combatFormulas';

function completedQuestCount(progressByQuestId: Record<string, QuestProgress>): number {
  return Object.values(progressByQuestId).filter((p) => p.isCompleted).length;
}

/** Absolute max HP from quest level + CON. */
export function getPlayerMaxHp(state: QuestState): number {
  const level = getCharacterLevel(state);
  const con = getPrimaryStatTotal(state.modifiers, 'Constitution');
  return getMaxHp(level, con);
}

export function getPlayerMaxHpFromParts(
  modifiers: ModifierMap,
  progressByQuestId: Record<string, QuestProgress>
): number {
  const level = completedQuestCount(progressByQuestId);
  const con = getPrimaryStatTotal(modifiers, 'Constitution');
  return getMaxHp(level, con);
}

/** Normalize saved health during checkpoint load (legacy 0–100 → absolute). */
export function normalizeSavedHealth(
  rawHealth: number,
  modifiers: ModifierMap,
  progressByQuestId: Record<string, QuestProgress>
): number {
  const maxHp = getPlayerMaxHpFromParts(modifiers, progressByQuestId);
  const safe = Number.isFinite(rawHealth) ? Math.floor(rawHealth) : maxHp;
  if (safe <= 100 && maxHp > 100) {
    return Math.max(0, Math.min(maxHp, Math.round((safe / 100) * maxHp)));
  }
  return Math.max(0, Math.min(maxHp, safe));
}

/** Clamp current HP to [0, maxHp]. */
export function clampPlayerHealth(state: QuestState, health: number): number {
  const maxHp = getPlayerMaxHp(state);
  if (!Number.isFinite(health)) return maxHp;
  return Math.max(0, Math.min(maxHp, Math.floor(health)));
}

/** Migrate legacy 0–100 placeholder health to absolute HP scale. */
export function migrateLegacyHealth(state: QuestState, rawHealth: number): number {
  const maxHp = getPlayerMaxHp(state);
  if (rawHealth <= 100 && maxHp > 100) {
    return Math.round((rawHealth / 100) * maxHp);
  }
  return Math.max(0, Math.min(maxHp, Math.floor(rawHealth)));
}
