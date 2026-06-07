import {
  QUEST_DISCOVER_CEMETERY_ID,
  QUEST_DISCOVER_MINE_ID,
  QUEST_DISCOVER_QUARRY_ID,
  QUEST_MAYOR_ID,
  QUEST_MAYOR_SHANNON_ID,
  QUEST_PICK_A_JOB_ID,
  QUEST_VILLAGE_ARRIVAL_ID,
} from '../constants';
import { getQuestListForUi } from '../quests/engine';
import type { QuestContext, QuestDefinition } from '../quests/types';

const VILLAGE_JOURNAL_QUEST_IDS = new Set<string>([
  QUEST_VILLAGE_ARRIVAL_ID,
  QUEST_MAYOR_SHANNON_ID,
  QUEST_DISCOVER_CEMETERY_ID,
  QUEST_DISCOVER_QUARRY_ID,
  QUEST_DISCOVER_MINE_ID,
  QUEST_PICK_A_JOB_ID,
  QUEST_MAYOR_ID,
]);

/** Quest cards shown in the village journal pane (day reports stay global). */
export function getVillageJournalQuests(
  quests: QuestDefinition[],
  context: QuestContext,
  unveiledQuestIds: string[],
  devUnlockAllQuests: boolean
): QuestDefinition[] {
  const visible = getQuestListForUi(quests, context, unveiledQuestIds, devUnlockAllQuests);
  return visible.filter(
    (q) => q.requiredPlayLocation === 'Village' || VILLAGE_JOURNAL_QUEST_IDS.has(q.id)
  );
}
