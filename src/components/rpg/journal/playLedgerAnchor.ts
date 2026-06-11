import { isCharacterUpdateSpeaker } from '../dialogueFormat';
import { ORIGIN_QUEST_OPENED_FLAG, QUEST_ORIGIN_ID } from '../constants';
import type { QuestState } from '../quests/types';

function earliestQuestActivityAtMs(state: QuestState, questId: string): number | undefined {
  let min: number | undefined;
  for (const line of state.dialogueLog) {
    if (line.sourceQuestId !== questId) continue;
    min = min === undefined ? line.atMs : Math.min(min, line.atMs);
  }
  return min;
}

/** Legacy saves: infer card anchor times from flags, progress, and dialogue. */
export function migrateQuestFirstOpenedAtMs(state: QuestState): Record<string, number> {
  const next: Record<string, number> = { ...(state.questFirstOpenedAtMs ?? {}) };

  if (state.flags.includes(ORIGIN_QUEST_OPENED_FLAG) && next[QUEST_ORIGIN_ID] === undefined) {
    const originJournal = state.journalLog.find((row) => row.questId === QUEST_ORIGIN_ID);
    next[QUEST_ORIGIN_ID] =
      earliestQuestActivityAtMs(state, QUEST_ORIGIN_ID) ?? originJournal?.atMs ?? Date.now();
  }

  for (const questId of state.unveiledQuestIds) {
    if (next[questId] !== undefined) continue;
    const prog = state.progressByQuestId[questId];
    if (!prog) continue;
    const started =
      prog.isCompleted ||
      (prog.choiceHistory?.length ?? 0) > 0 ||
      state.activeQuestId === questId;
    if (!started) continue;

    const fromDialogue = earliestQuestActivityAtMs(state, questId);
    if (fromDialogue !== undefined) {
      next[questId] = fromDialogue;
    }
  }

  return next;
}

/** Record the first time a quest card was opened (Play timeline anchor). */
export function stampQuestFirstOpenedAtMs(state: QuestState, questId: string): QuestState {
  if (state.questFirstOpenedAtMs?.[questId] !== undefined) return state;
  return {
    ...state,
    questFirstOpenedAtMs: {
      ...(state.questFirstOpenedAtMs ?? {}),
      [questId]: Date.now(),
    },
  };
}

export function questScopedStorySortMs(
  atMs: number,
  sourceQuestId: string | undefined,
  questFirstOpenedAtMs: Readonly<Record<string, number>>
): number {
  if (!sourceQuestId) return atMs;
  const openMs = questFirstOpenedAtMs[sourceQuestId];
  if (openMs === undefined) return atMs;
  return Math.max(atMs, openMs + 1);
}
