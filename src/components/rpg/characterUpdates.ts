import { appendDialogue, CHARACTER_UPDATE_SPEAKER } from './dialogueFormat';
import { getLevelUpLines, getRewardLines } from './helpers';
import { getCharacterLevel } from './quests/engine';
import type { CharacterUpdateKind, DialogueLogEntry, QuestState } from './quests/types';

export function formatNameUpdateLine(playerName: string): string {
  const name = playerName.trim() || 'Stranger';
  return `Your name is ${name}.`;
}

export function formatCharacterLevelUpdateLine(level: number): string {
  return `You reached Level ${level}!`;
}

type CharacterUpdateDraft = {
  text: string;
  characterUpdateKind?: CharacterUpdateKind;
};

/** Play-feed lines for character changes between two quest snapshots. */
export function collectCharacterUpdateDrafts(prev: QuestState, next: QuestState): CharacterUpdateDraft[] {
  const lines: CharacterUpdateDraft[] = [];

  if (prev.playerName.trim().length === 0 && next.playerName.trim().length > 0) {
    lines.push({
      text: formatNameUpdateLine(next.playerName),
      characterUpdateKind: 'player_name',
    });
  }

  const prevLevel = getCharacterLevel(prev);
  const nextLevel = getCharacterLevel(next);
  if (nextLevel > prevLevel) {
    lines.push({
      text: formatCharacterLevelUpdateLine(nextLevel),
      characterUpdateKind: 'character_level',
    });
  }

  for (const text of getRewardLines(prev.modifiers, next.modifiers)) {
    lines.push({ text });
  }
  for (const text of getLevelUpLines(prev, next)) {
    lines.push({ text });
  }

  const prevItems = new Set(prev.questItems);
  for (const label of next.questItems) {
    if (label.trim().length > 0 && !prevItems.has(label)) {
      lines.push({ text: `Quest item: ${label}` });
    }
  }

  return lines;
}

export function characterUpdateDialogueEntries(
  prev: QuestState,
  next: QuestState
): DialogueLogEntry[] {
  return collectCharacterUpdateDrafts(prev, next).map(({ text, characterUpdateKind }) =>
    appendDialogue(CHARACTER_UPDATE_SPEAKER, text, { characterUpdateKind })
  );
}

/** Append global Play-feed lines when `next` differs from `prev` on character sheet fields. */
export function appendCharacterUpdateDialogue(prev: QuestState, next: QuestState): QuestState {
  const entries = characterUpdateDialogueEntries(prev, next);
  if (entries.length === 0) return next;
  return { ...next, dialogueLog: [...next.dialogueLog, ...entries] };
}
