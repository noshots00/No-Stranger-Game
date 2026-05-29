import { QUEST_DYERS_CRYPT_ID, QUEST_FIRST_NIGHT_ID } from '@/components/rpg/constants';
import { getLevelUpLines, getRewardLines } from '../helpers';
import { recordModifiersAfterQuestComplete } from './engine';
import { buildFirstNightJournalSummary } from './quest-002-first-night-journal';
import {
  buildAbandonedShelterJournalEpilogue,
  buildDyersCryptJournalSummary,
} from './quest-003-dyers-crypt-journal';
import { interpolateStepText } from './engine';
import type { JournalLogEntry, QuestDefinition, QuestState } from './types';

const QUEST_ABANDONED_SHELTER_ID = 'quest-004-abandoned-shelter';

/** Join quest choice ids for `journalSummariesByChoicePath` keys (order = playthrough order). */
export const QUEST_JOURNAL_PATH_SEP = '|';

/**
 * Resolve Play-tab recap when a quest completes. Exact path key, then map entry `*`,
 * then `journalSummaryFallback`. Returns null if nothing configured.
 */
export function resolveJournalSummaryText(
  quest: QuestDefinition,
  choiceHistory: string[],
  playerName: string,
  flags: string[] = []
): string | null {
  if (quest.id === QUEST_FIRST_NIGHT_ID) {
    return interpolateStepText(buildFirstNightJournalSummary(choiceHistory), playerName);
  }

  if (quest.id === QUEST_DYERS_CRYPT_ID) {
    return interpolateStepText(buildDyersCryptJournalSummary(choiceHistory, flags), playerName);
  }

  const map = quest.journalSummariesByChoicePath;
  const pathKey = choiceHistory.join(QUEST_JOURNAL_PATH_SEP);
  let raw: string | undefined =
    pathKey.length > 0 ? map?.[pathKey] : undefined;

  if (!raw && map) {
    for (const choiceId of choiceHistory) {
      const candidate = map[choiceId];
      if (candidate && !choiceId.includes(QUEST_JOURNAL_PATH_SEP)) {
        raw = candidate;
        break;
      }
    }
  }

  raw = raw ?? map?.['*'] ?? quest.journalSummaryFallback ?? undefined;
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
  options?: { atMs?: number; completionRewards?: string[]; replaceText?: boolean }
): QuestState {
  const atMs = options?.atMs ?? Date.now();
  const completionRewards = options?.completionRewards?.filter((s) => s.trim().length > 0);
  const existingIndex = state.journalLog.findIndex((entry) => entry.questId === questId);
  if (existingIndex >= 0) {
    const existing = state.journalLog[existingIndex];
    const normalizedText = text.trim();
    const mergedText =
      options?.replaceText && normalizedText.length > 0
        ? normalizedText
        : normalizedText.length > 0 && !existing.text.includes(normalizedText)
          ? `${existing.text.trim()} ${normalizedText}`.trim()
          : existing.text;
    const mergedRewards = Array.from(
      new Set([...(existing.completionRewards ?? []), ...(completionRewards ?? [])])
    );
    const next = [...state.journalLog];
    next[existingIndex] = {
      ...existing,
      text: mergedText,
      atMs: options?.atMs ?? existing.atMs,
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
  const withSnapshot = recordModifiersAfterQuestComplete(nextState, quest.id);
  const history = withSnapshot.progressByQuestId[quest.id]?.choiceHistory ?? [];
  const text = resolveJournalSummaryText(quest, history, nextState.playerName, nextState.flags);
  const completionRewards = collectCompletionRewardLines(prevState, withSnapshot);
  const existingQuestEntry = withSnapshot.journalLog.find((row) => row.questId === quest.id);

  let result: QuestState;

  if (existingQuestEntry) {
    if (text) {
      result = appendJournalRecapEntry(withSnapshot, quest.id, text, {
        replaceText: true,
        completionRewards: completionRewards.length > 0 ? completionRewards : undefined,
      });
    } else if (completionRewards.length === 0) {
      result = withSnapshot;
    } else {
      result = appendJournalRecapEntry(withSnapshot, quest.id, '', {
        completionRewards,
      });
    }
  } else if (!text) {
    result = withSnapshot;
  } else {
    result = appendJournalRecapEntry(withSnapshot, quest.id, text, {
      completionRewards: completionRewards.length > 0 ? completionRewards : undefined,
    });
  }

  if (quest.id === QUEST_ABANDONED_SHELTER_ID) {
    result = appendDyersCryptShelterEpilogueIfNeeded(result);
  }

  return result;
}

function appendDyersCryptShelterEpilogueIfNeeded(state: QuestState): QuestState {
  const cryptEntry = state.journalLog.find((row) => row.questId === QUEST_DYERS_CRYPT_ID);
  if (!cryptEntry) return state;
  const epilogue = buildAbandonedShelterJournalEpilogue();
  if (cryptEntry.text.includes(epilogue)) return state;
  return appendJournalRecapEntry(state, QUEST_DYERS_CRYPT_ID, epilogue);
}
