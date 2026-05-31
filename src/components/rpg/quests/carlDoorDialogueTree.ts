/**
 * Carl (quest 4b) — Talk tree; same choice/reply shapes as the merchant for reuse.
 */

import {
  appendPair,
  type DialogueChoice,
  type TranscriptEntry,
} from '@/components/rpg/merchant/merchantDialogueTree';

export type { DialogueChoice, TranscriptEntry };

function nextId(): string {
  return `carl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Opening narrator + player/Carl pair (replaces legacy `carl-intro` quest step). */
export function seedCarlOpeningTranscript(): TranscriptEntry[] {
  const n1: TranscriptEntry = {
    id: nextId(),
    role: 'narrator',
    text: 'The air here remembers old decisions—yours is only the latest.',
  };
  return [n1, ...appendPair('(You move closer to the threshold.)', carlWelcomeLine())];
}

function carlWelcomeLine(): string {
  return 'Framed by old timber, Carl studies you. “If you came this far,” he says, “you may speak. Choose your words.”';
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
