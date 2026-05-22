import { isItemModifierKey, toItemLabel } from '../helpers';
import type { QuestState } from '../quests/types';

const normalize = (s: string): string => s.trim().toLowerCase();

export type BountyMatch =
  | { kind: 'modifier'; key: string; quantity: number }
  | { kind: 'questItem'; label: string };

/** First inventory row matching bounty text (substring, case-insensitive). */
export function findBountyMatch(state: QuestState, bountyText: string): BountyMatch | null {
  const needle = normalize(bountyText);
  if (!needle) return null;

  for (const [key, qty] of Object.entries(state.modifiers)) {
    if (!isItemModifierKey(key) || qty <= 0) continue;
    const label = toItemLabel(key);
    if (normalize(key).includes(needle) || normalize(label).includes(needle)) {
      return { kind: 'modifier', key, quantity: qty };
    }
  }

  for (const label of state.questItems) {
    if (normalize(label).includes(needle)) {
      return { kind: 'questItem', label };
    }
  }

  return null;
}

export function playerOwnsBounty(state: QuestState, bountyText: string): boolean {
  return findBountyMatch(state, bountyText) !== null;
}
