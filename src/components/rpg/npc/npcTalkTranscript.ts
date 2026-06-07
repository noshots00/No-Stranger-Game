import type { TranscriptEntry } from '@/components/rpg/merchant/merchantDialogueTree';

/** Latest spoken NPC line (Carl reuses `merchant` role). */
export function getLatestNpcLine(transcript: readonly TranscriptEntry[]): string {
  for (let i = transcript.length - 1; i >= 0; i -= 1) {
    const entry = transcript[i];
    if (entry.role === 'merchant') return entry.text;
  }
  return '';
}
