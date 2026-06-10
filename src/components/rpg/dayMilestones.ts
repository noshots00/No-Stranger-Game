import { QUEST_ORIGIN_ID, WORLD_EVENT_PRINTS_ENABLED } from '@/components/rpg/constants';
import {
  formatCharacterLevelUpdateLine,
  formatNameUpdateLine,
} from './characterUpdates';
import { getCharacterLevel } from './quests/engine';
import { appendUniqueWorldEntries } from './helpers';
import type { QuestState } from './quests/types';

export function formatDayMarker(day: number): string {
  return `Day ${day}...`;
}

export function formatDayBeginsLine(day: number): string {
  return `Day ${day} begins`;
}

export function formatNameMilestoneLine(playerName: string): string {
  return formatNameUpdateLine(playerName);
}

export function formatReachedLevelMilestoneLine(level: number): string {
  return formatCharacterLevelUpdateLine(level);
}

export function appendWorldMilestone(state: QuestState, text: string): QuestState {
  if (!text.trim()) return state;
  return {
    ...state,
    worldEventLog: appendUniqueWorldEntries(state.worldEventLog, [text.trim()]),
  };
}

function appendJournalPlayMilestones(
  state: QuestState,
  questId: string,
  lines: string[]
): QuestState {
  const normalized = lines.map((line) => line.trim()).filter((line) => line.length > 0);
  if (normalized.length === 0) return state;

  const atMs = Date.now();
  const existingIndex = state.journalLog.findIndex((entry) => entry.questId === questId);
  if (existingIndex < 0) {
    const entry = {
      id: `journal-${questId}-${atMs}-${Math.random().toString(36).slice(2, 8)}`,
      questId,
      text: '',
      atMs,
      playMilestones: normalized,
    };
    return { ...state, journalLog: [...state.journalLog, entry] };
  }

  const existing = state.journalLog[existingIndex];
  const next = [...state.journalLog];
  next[existingIndex] = {
    ...existing,
    atMs: existing.atMs,
    playMilestones: [...(existing.playMilestones ?? []), ...normalized],
  };
  return { ...state, journalLog: next };
}

/** After quest completion, append Play-feed milestone lines under that quest's journal recap. */
export function applyQuestLevelMilestoneIfNeeded(
  prev: QuestState,
  next: QuestState,
  completedQuestId: string
): QuestState {
  if (!WORLD_EVENT_PRINTS_ENABLED) return next;

  const prevLevel = getCharacterLevel(prev);
  const nextLevel = getCharacterLevel(next);
  if (nextLevel <= prevLevel) return next;

  const lines: string[] = [];
  if (completedQuestId === QUEST_ORIGIN_ID) {
    lines.push(formatNameMilestoneLine(next.playerName));
  }
  lines.push(formatReachedLevelMilestoneLine(nextLevel));

  return appendJournalPlayMilestones(next, completedQuestId, lines);
}
