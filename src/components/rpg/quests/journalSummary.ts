import { getLevelUpLines, getRewardLines } from '../helpers';
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

/** Reward/item/stat lines gained between quest-open snapshot (`prev`) and completion snapshot (`next`). */
export function collectCompletionRewardLines(prev: QuestState, next: QuestState): string[] {
  const modifierRewards = getRewardLines(prev.modifiers, next.modifiers);
  const levelUps = getLevelUpLines(prev, next);
  const prevItems = new Set(prev.questItems);
  const newItems = next.questItems.filter((label) => !prevItems.has(label));
  const itemLines = newItems.map((label) => `Quest item: ${label}`);
  return [...modifierRewards, ...levelUps, ...itemLines];
}

export function appendJournalRecapEntry(
  state: QuestState,
  questId: string,
  text: string,
  options?: { atMs?: number; completionRewards?: string[] }
): QuestState {
  const atMs = options?.atMs ?? Date.now();
  const completionRewards = options?.completionRewards?.filter((s) => s.trim().length > 0);
  const existingIndex = state.journalLog.findIndex((entry) => entry.questId === questId);
  if (existingIndex >= 0) {
    const existing = state.journalLog[existingIndex];
    const normalizedText = text.trim();
    const mergedText =
      normalizedText.length > 0 && !existing.text.includes(normalizedText)
        ? `${existing.text.trim()} ${normalizedText}`.trim()
        : existing.text;
    const mergedRewards = Array.from(
      new Set([...(existing.completionRewards ?? []), ...(completionRewards ?? [])])
    );
    const next = [...state.journalLog];
    next[existingIndex] = {
      ...existing,
      text: mergedText,
      atMs,
      ...(mergedRewards.length > 0 ? { completionRewards: mergedRewards } : {}),
    };
    return { ...state, journalLog: next };
  }
  const entry: JournalLogEntry = {
    id: `journal-${questId}-${atMs}-${Math.random().toString(36).slice(2, 8)}`,
    questId,
    text,
    atMs,
    ...(completionRewards && completionRewards.length > 0 ? { completionRewards } : {}),
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
  const existingQuestEntry = nextState.journalLog.find((row) => row.questId === quest.id);
  if (existingQuestEntry) {
    const completionRewards = collectCompletionRewardLines(prevState, nextState);
    if (completionRewards.length === 0) return nextState;
    return appendJournalRecapEntry(nextState, quest.id, '', {
      completionRewards,
    });
  }
  const history = nextState.progressByQuestId[quest.id]?.choiceHistory ?? [];
  const text = resolveJournalSummaryText(quest, history, nextState.playerName);
  if (!text) return nextState;
  const completionRewards = collectCompletionRewardLines(prevState, nextState);
  return appendJournalRecapEntry(nextState, quest.id, text, {
    completionRewards: completionRewards.length > 0 ? completionRewards : undefined,
  });
}
