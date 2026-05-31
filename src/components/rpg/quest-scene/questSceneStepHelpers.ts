import type { ModifierMap, QuestChoice } from '../quests/types';

export function choiceLockedByModifierMinimums(
  choice: QuestChoice,
  playerModifiers: ModifierMap
): boolean {
  const req = choice.disabledUnlessModifiersAtLeast;
  if (!req) return false;
  return Object.entries(req).some(([key, min]) => (playerModifiers[key] ?? 0) < min);
}

export function choiceIsVisible(choice: QuestChoice, playerFlags: Set<string>): boolean {
  const req = choice.enabledIfAnyFlags;
  if (!req || req.length === 0) return true;
  return req.some((flag) => playerFlags.has(flag));
}

export function choiceDisabledSuffix(
  choice: QuestChoice,
  locked: { byFlags: boolean; byModifiers: boolean; byEmptyQuestItems: boolean }
): string {
  if (locked.byEmptyQuestItems) return ' (nothing in your pack)';
  if (choice.disabledLabel !== undefined) return choice.disabledLabel;
  if (locked.byFlags) return ' (already explored)';
  if (locked.byModifiers) return ' (requirements not met)';
  return ' (unavailable)';
}

export function resolveChoiceLockState(
  choice: QuestChoice,
  playerFlags: Set<string>,
  playerModifiers: ModifierMap,
  questItems: readonly string[]
): {
  lockedByFlags: boolean;
  lockedByModifiers: boolean;
  lockedByEmptyQuestItems: boolean;
  isLocked: boolean;
} {
  const lockedByFlags = Boolean(choice.disabledIfAnyFlags?.some((flag) => playerFlags.has(flag)));
  const lockedByModifiers = choiceLockedByModifierMinimums(choice, playerModifiers);
  const lockedByEmptyQuestItems = choice.id === 'q2-well-throw' && questItems.length === 0;
  return {
    lockedByFlags,
    lockedByModifiers,
    lockedByEmptyQuestItems,
    isLocked: lockedByFlags || lockedByModifiers || lockedByEmptyQuestItems,
  };
}
