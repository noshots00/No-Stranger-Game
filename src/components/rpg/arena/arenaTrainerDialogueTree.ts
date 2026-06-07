import type { TranscriptEntry } from '@/components/rpg/merchant/merchantDialogueTree';

function nextId(): string {
  return `trainer-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const TRAINER_OPENING_LINE =
  'I train anyone who steps into this ring. Spar with me if you want to learn—or leave if you are not ready.';

export const TRAINER_ATTACK_LABEL = 'Attack!';
export const TRAINER_LEAVE_LABEL = 'Leave';

export function seedArenaTrainerOpeningTranscript(): TranscriptEntry[] {
  return [
    {
      id: nextId(),
      role: 'merchant',
      text: TRAINER_OPENING_LINE,
    },
  ];
}
