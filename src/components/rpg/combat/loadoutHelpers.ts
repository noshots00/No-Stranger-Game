import {
  formatModifierKeyForCharacterSheet,
  isItemModifierKey,
} from '../helpers';
import type { QuestState } from '../quests/types';
import { isOtherEquipmentItemKey, isWeaponItemKey, listEquipmentKeys } from './equipmentRegistry';
import { isPassiveSkill, normalizeSkillId } from './skillRegistry';
import type { CombatLoadout } from './combatTypes';

export type LoadoutOption = { key: string; label: string; level?: number };

export function listOwnedWeaponOptions(state: QuestState): LoadoutOption[] {
  const modifiers = state.modifiers ?? {};
  const options: LoadoutOption[] = [];
  for (const key of listEquipmentKeys()) {
    if (!isWeaponItemKey(key)) continue;
    const qty = modifiers[key] ?? 0;
    if (qty >= 1) {
      options.push({ key, label: formatModifierKeyForCharacterSheet(key) });
    }
  }
  return options;
}

export function listOwnedOtherEquipmentOptions(state: QuestState): LoadoutOption[] {
  const modifiers = state.modifiers ?? {};
  const options: LoadoutOption[] = [];
  for (const key of listEquipmentKeys()) {
    if (!isOtherEquipmentItemKey(key)) continue;
    const qty = modifiers[key] ?? 0;
    if (qty >= 1) {
      options.push({ key, label: formatModifierKeyForCharacterSheet(key) });
    }
  }
  return options;
}

export function listActiveSkillOptions(
  state: QuestState,
  minMagnitude = 1
): LoadoutOption[] {
  const modifiers = state.modifiers ?? {};
  const options: LoadoutOption[] = [];
  for (const [key, value] of Object.entries(modifiers)) {
    if (!Number.isFinite(value) || value < minMagnitude) continue;
    if (isItemModifierKey(key)) continue;
    if (key.startsWith('stat:') || key.startsWith('trait:') || key.startsWith('race:')) continue;
    const canonical = normalizeSkillId(key);
    if (!canonical) continue;
    if (isPassiveSkill(canonical)) continue;
    if (!key.startsWith('skill:') && !/Skill$/i.test(key) && !/Spell$/i.test(key)) continue;
    options.push({
      key: canonical,
      label: formatModifierKeyForCharacterSheet(key),
      level: Math.floor(value),
    });
  }
  const seen = new Set<string>();
  return options.filter((o) => {
    if (seen.has(o.key)) return false;
    seen.add(o.key);
    return true;
  });
}

export function sanitizeLoadoutSelection(
  loadout: CombatLoadout,
  state: QuestState
): CombatLoadout {
  const weapons = new Set(listOwnedWeaponOptions(state).map((o) => o.key));
  const other = new Set(listOwnedOtherEquipmentOptions(state).map((o) => o.key));
  const skills = new Set(listActiveSkillOptions(state).map((o) => o.key));
  return {
    weapon: loadout.weapon && weapons.has(loadout.weapon) ? loadout.weapon : undefined,
    other: loadout.other && other.has(loadout.other) ? loadout.other : undefined,
    skillA: loadout.skillA && skills.has(loadout.skillA) ? loadout.skillA : undefined,
    skillB: loadout.skillB && skills.has(loadout.skillB) ? loadout.skillB : undefined,
  };
}

/** Equip-loadout tutorial: weapon or equipment slot plus an active skill slot. */
export function isEquipLoadoutQuestComplete(state: QuestState): boolean {
  const loadout = sanitizeLoadoutSelection(state.loadout ?? {}, state);
  const hasGear = Boolean(loadout.weapon || loadout.other);
  const hasSkill = Boolean(loadout.skillA || loadout.skillB);
  return hasGear && hasSkill;
}

const INSTINCT_LOADOUT_STEP_IDS = new Set(['loadout-intro', 'await-loadout']);

/** Instinct quest loadout phase — completes via Character tab, not a choice step. */
export function canCompleteInstinctViaLoadout(state: QuestState, questId: string): boolean {
  const prog = state.progressByQuestId[questId];
  if (!prog || prog.isCompleted) return false;
  if (!INSTINCT_LOADOUT_STEP_IDS.has(prog.currentStepId)) return false;
  return isEquipLoadoutQuestComplete(state);
}
