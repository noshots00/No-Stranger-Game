/**
 * Carl (quest 4b) — Talk tree; same choice/reply shapes as the merchant for reuse.
 */

import {
  DOOR_APPROACH_HIDE_FLAG,
  DOOR_APPROACH_KNOCK_FLAG,
  DOOR_APPROACH_YELL_FLAG,
} from '@/components/rpg/constants';
import {
  type DialogueChoice,
  type TranscriptEntry,
} from '@/components/rpg/merchant/merchantDialogueTree';

export type { DialogueChoice, TranscriptEntry };

function nextId(): string {
  return `carl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const CARL_OPENING_YELL = "Oit! Who be knockin' round me tree?";

function resolveDoorApproachPhrase(playerFlags: readonly string[]): string {
  const flags = new Set(playerFlags);
  if (flags.has(DOOR_APPROACH_YELL_FLAG)) return 'yell out "Is there anyone home?"';
  if (flags.has(DOOR_APPROACH_HIDE_FLAG)) return 'hide and wait to see if anyone comes';
  if (flags.has(DOOR_APPROACH_KNOCK_FLAG)) return 'knock on the door';
  return 'knock on the door';
}

/** Opening narrator line from the player's door approach (quest choice flags). */
export function seedCarlOpeningTranscript(playerFlags: readonly string[]): TranscriptEntry[] {
  const phrase = resolveDoorApproachPhrase(playerFlags);
  return [
    {
      id: nextId(),
      role: 'narrator',
      text: `You ${phrase} and someone yells out, "Oit, who be knockin' round me tree?" What do you do?`,
    },
  ];
}

/** Flat hub choices (topics are one-shot via UI state). */
export const CARL_MAIN_CHOICES: DialogueChoice[] = [
  {
    id: 'carl-attack',
    type: 'combat',
    label: 'Attack!',
  },
  {
    id: 'carl-ask-door',
    type: 'reply',
    label: 'Ask about the door',
    merchantText:
      'Carl rests a palm on the wood. “This door goes where you are ready to go—not a step sooner. Treat it as a question, not a promise.”',
  },
  {
    id: 'carl-ask-self',
    type: 'reply',
    label: 'Ask who he is',
    merchantText:
      'He smiles slightly. “I am Carl—caretaker, busybody, and occasionally a guide. I keep stories from stumbling into the wrong hands.”',
  },
];

export const CARL_FAREWELL_LABEL = 'Farewell';
