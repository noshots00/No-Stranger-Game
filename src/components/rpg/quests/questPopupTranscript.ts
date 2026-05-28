import type { TranscriptEntry } from '../merchant/merchantDialogueTree';
import {
  NARRATOR_RESPONSE_SPEAKER,
  PLAYER_ACTION_SPEAKER,
  QUEST_NARRATOR_PROMPT_SPEAKER,
} from '../dialogueFormat';
import type { DialogueLogEntry } from './types';

export function questDialogueToNpcTranscript(entries: readonly DialogueLogEntry[]): TranscriptEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    role:
      entry.speaker === PLAYER_ACTION_SPEAKER || entry.speaker === 'You'
        ? 'player'
        : entry.speaker === QUEST_NARRATOR_PROMPT_SPEAKER || entry.speaker === NARRATOR_RESPONSE_SPEAKER
          ? 'narrator'
          : 'merchant',
    text: entry.text,
  }));
}

/** When the engine has not logged lines yet, show the current step copy in the dialogue pane. */
export function npcTranscriptWithStepFallback(
  entries: readonly DialogueLogEntry[],
  narrativeText: string
): TranscriptEntry[] {
  const mapped = questDialogueToNpcTranscript(entries);
  if (mapped.length > 0) return mapped;
  const trimmed = narrativeText.trim();
  if (!trimmed) return mapped;
  return [{ id: 'quest-step-fallback', role: 'narrator', text: trimmed }];
}
