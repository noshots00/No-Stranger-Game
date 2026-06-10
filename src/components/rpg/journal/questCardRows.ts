import type { QuestDefinition } from '../quests/types';

/** Incomplete quest cards shown at the bottom of the Play journal (matches JournalScreen). */
export function getQuestCardRows(
  visibleQuests: readonly QuestDefinition[],
  completedQuestIds: readonly string[],
  activeQuest: QuestDefinition | null | undefined
): QuestDefinition[] {
  const completedSet = new Set(completedQuestIds);
  const incomplete = visibleQuests.filter((q) => !completedSet.has(q.id));
  if (
    activeQuest &&
    !completedSet.has(activeQuest.id) &&
    !incomplete.some((q) => q.id === activeQuest.id)
  ) {
    return [activeQuest, ...incomplete];
  }
  return incomplete;
}
