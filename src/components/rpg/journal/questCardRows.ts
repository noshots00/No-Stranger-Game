import type { QuestDefinition } from '../quests/types';

/** Quest cards for the Play feed — incomplete and completed (completed cards transform in place). */
export function getQuestCardRows(
  visibleQuests: readonly QuestDefinition[],
  _completedQuestIds: readonly string[],
  activeQuest: QuestDefinition | null | undefined
): QuestDefinition[] {
  const sorted = [...visibleQuests].sort((a, b) => a.createdAt - b.createdAt);
  if (activeQuest && !sorted.some((q) => q.id === activeQuest.id)) {
    return [activeQuest, ...sorted];
  }
  return sorted;
}
