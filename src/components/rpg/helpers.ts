import type { NostrEvent } from '@nostrify/nostrify';
import type { QuestState, WorldEventLogEntry, DialogueLogEntry } from './quests/types';
import { getSkillLevelUpLines } from './quests/engine';
import { parseQuestCheckpointPayload } from './gameProfile';
import {
  CLASS_UNLOCK_POINTS,
  GOLD_MODIFIER_KEYS,
  HIDDEN_CLASS_MODIFIER_KEYS,
  PRIMARY_STAT_MODIFIER_LABEL,
  QUEST_ORIGIN_ID,
} from './constants';

export function questStateHasRememberedName(state: QuestState): boolean {
  const name = state.playerName?.trim();
  if (!name) return false;
  if (state.flags.includes('quest001-complete')) return true;
  return Boolean(state.progressByQuestId[QUEST_ORIGIN_ID]?.isCompleted);
}

export function findFirstRememberedCheckpoint(
  events: NostrEvent[]
): { namedAt: number; displayName: string } | null {
  const sorted = [...events].sort((a, b) => a.created_at - b.created_at);
  for (const ev of sorted) {
    const payload = parseQuestCheckpointPayload(ev.content);
    if (!payload) continue;
    if (questStateHasRememberedName(payload.state)) {
      return { namedAt: ev.created_at, displayName: payload.state.playerName.trim() };
    }
  }
  return null;
}

export const appendUniqueWorldEntries = (
  existing: WorldEventLogEntry[],
  texts: string[],
  baseAtMs = Date.now()
): WorldEventLogEntry[] => {
  if (texts.length === 0) return existing;
  const seen = new Set(existing.map((e) => e.text));
  const next = [...existing];
  let offset = 0;
  for (const text of texts) {
    if (seen.has(text)) continue;
    seen.add(text);
    next.push({ text, atMs: baseAtMs + offset });
    offset += 1;
  }
  return next;
};

export const appendDialogue = (speaker: string, text: string): DialogueLogEntry => {
  const atMs = Date.now();
  return {
    id: `${speaker}-${atMs}-${Math.random().toString(36).slice(2, 8)}`,
    speaker,
    text,
    atMs,
  };
};

export const getGoldFromModifiers = (modifiers: Record<string, number>): number =>
  GOLD_MODIFIER_KEYS.reduce((total, key) => total + (modifiers[key] ?? 0), 0);

export const isItemModifierKey = (key: string): boolean => /^(item|items|inventory)[:_-]/i.test(key);

export type ModifierMessageKind = 'hidden_class' | 'primary_stat' | 'other';

export const getModifierMessageKind = (key: string): ModifierMessageKind => {
  if (HIDDEN_CLASS_MODIFIER_KEYS.includes(key as (typeof HIDDEN_CLASS_MODIFIER_KEYS)[number])) {
    return 'hidden_class';
  }
  if (PRIMARY_STAT_MODIFIER_LABEL[key]) {
    return 'primary_stat';
  }
  return 'other';
};

export const toItemLabel = (key: string): string =>
  key
    .replace(/^(item|items|inventory)[:_-]?/i, '')
    .replace(/[_-]/g, ' ')
    .trim() || 'supplies';

export const getRewardLines = (
  prevModifiers: Record<string, number>,
  nextModifiers: Record<string, number>
): string[] => {
  const rewardLines: string[] = [];
  const goldDelta = getGoldFromModifiers(nextModifiers) - getGoldFromModifiers(prevModifiers);
  if (goldDelta > 0) {
    rewardLines.push(`You gained ${goldDelta} gold.`);
  }

  const itemLines = Object.keys(nextModifiers)
    .filter((key) => isItemModifierKey(key))
    .map((key) => {
      const previous = prevModifiers[key] ?? 0;
      const current = nextModifiers[key] ?? 0;
      const delta = current - previous;
      if (delta <= 0) return null;
      return `You found ${delta} ${toItemLabel(key)}.`;
    })
    .filter((line): line is string => Boolean(line));

  return [...rewardLines, ...itemLines];
};

export const getModifierLevelUpLines = (prevState: QuestState, nextState: QuestState): string[] => {
  const lines: string[] = [];

  Object.keys(nextState.modifiers).forEach((key) => {
    if (isItemModifierKey(key) || GOLD_MODIFIER_KEYS.includes(key as (typeof GOLD_MODIFIER_KEYS)[number])) return;
    const kind = getModifierMessageKind(key);
    if (kind === 'hidden_class') return;
    const previous = prevState.modifiers[key] ?? 0;
    const current = nextState.modifiers[key] ?? 0;
    const delta = current - previous;
    if (delta <= 0) return;

    if (kind === 'primary_stat') {
      lines.push(`You gain ${delta} ${PRIMARY_STAT_MODIFIER_LABEL[key]}!`);
    }
  });

  return lines;
};

export const getLevelUpLines = (prevState: QuestState, nextState: QuestState): string[] => [
  ...getSkillLevelUpLines(prevState, nextState),
  ...getModifierLevelUpLines(prevState, nextState),
];

export const getCharacterClass = (modifiers: Record<string, number>): 'Warrior' | 'Rogue' | 'Mage' | 'Stranger' => {
  const classScores: Array<{ name: 'Warrior' | 'Rogue' | 'Mage'; score: number }> = [
    { name: 'Warrior', score: modifiers.WarriorClass ?? 0 },
    { name: 'Rogue', score: modifiers.RogueClass ?? 0 },
    { name: 'Mage', score: modifiers.MageClass ?? 0 },
  ];

  const unlocked = classScores.filter((entry) => entry.score >= CLASS_UNLOCK_POINTS);
  if (unlocked.length === 0) return 'Stranger';
  return unlocked.sort((a, b) => b.score - a.score)[0].name;
};
