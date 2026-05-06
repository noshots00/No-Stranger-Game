import { interpolateStepText } from './engine';
import type { JournalLogEntry, QuestDefinition, QuestState } from './types';

/** Join quest choice ids for `journalSummariesByChoicePath` keys (order = playthrough order). */
export const QUEST_JOURNAL_PATH_SEP = '|';

/**
 * Resolve Play-tab recap when a quest completes. Exact path key, then map entry `*`,
 * then `journalSummaryFallback`. Returns null if nothing configured.
 */
export function resolveJournalSummaryText(
  quest: QuestDefinition,
  choiceHistory: string[],
  playerName: string
): string | null {
  const map = quest.journalSummariesByChoicePath;
  const pathKey = choiceHistory.join(QUEST_JOURNAL_PATH_SEP);
  const raw =
    (pathKey.length > 0 ? map?.[pathKey] : undefined) ??
    map?.['*'] ??
    quest.journalSummaryFallback ??
    null;
  if (!raw || raw.trim().length === 0) return null;
  return interpolateStepText(raw.trim(), playerName);
}

export function appendJournalRecapEntry(
  state: QuestState,
  questId: string,
  text: string,
  atMs = Date.now()
): QuestState {
  const entry: JournalLogEntry = {
    id: `journal-${questId}-${atMs}-${Math.random().toString(36).slice(2, 8)}`,
    questId,
    text,
    atMs,
  };
  return { ...state, journalLog: [...state.journalLog, entry] };
}

/** Call when `progressByQuestId[quest.id].isCompleted` flips false → true. */
export function mergeJournalRecapOnQuestComplete(
  prevState: QuestState,
  nextState: QuestState,
  quest: QuestDefinition
): QuestState {
  const wasCompleted = Boolean(prevState.progressByQuestId[quest.id]?.isCompleted);
  const isCompleted = Boolean(nextState.progressByQuestId[quest.id]?.isCompleted);
  if (wasCompleted || !isCompleted) return nextState;
  const history = nextState.progressByQuestId[quest.id]?.choiceHistory ?? [];
  const text = resolveJournalSummaryText(quest, history, nextState.playerName);
  if (!text) return nextState;
  return appendJournalRecapEntry(nextState, quest.id, text);
}
