import { applyDirectModifiersDelta } from '../quests/engine';
import { getCopperFromModifiers, splitCopperIntoCoins, toItemLabel } from '../helpers';
import { COPPER_PER_GOLD } from '../constants';
import type { QuestState } from '../quests/types';
import type { PlayerQuestView } from './playerQuestNostr';
import { findBountyMatch } from './bountyMatch';

export type EscrowedReward =
  | { kind: 'gold'; amount: number }
  | { kind: 'modifierItem'; key: string; quantity: number }
  | { kind: 'questItem'; label: string };

export type TavernEscrowEntry = {
  questId: string;
  rewards: EscrowedReward[];
};

export type PostRewardInput = {
  goldAmount?: number;
  modifierItemKey?: string;
  modifierItemQty?: number;
  questItemLabel?: string;
};

export type RewardOption =
  | { kind: 'gold' }
  | { kind: 'modifierItem'; key: string; label: string; quantity: number }
  | { kind: 'questItem'; label: string };

export function listRewardOptions(state: QuestState): RewardOption[] {
  const out: RewardOption[] = [{ kind: 'gold' }];
  for (const [key, qty] of Object.entries(state.modifiers)) {
    if (!key.startsWith('item:') || qty <= 0) continue;
    out.push({ kind: 'modifierItem', key, label: toItemLabel(key), quantity: qty });
  }
  for (const label of state.questItems) {
    if (label.trim()) out.push({ kind: 'questItem', label });
  }
  return out;
}

function buildRewardsFromInput(input: PostRewardInput): EscrowedReward[] {
  const rewards: EscrowedReward[] = [];
  const gold = input.goldAmount ?? 0;
  if (gold > 0) rewards.push({ kind: 'gold', amount: Math.floor(gold) });
  if (input.modifierItemKey && (input.modifierItemQty ?? 0) > 0) {
    rewards.push({
      kind: 'modifierItem',
      key: input.modifierItemKey,
      quantity: Math.floor(input.modifierItemQty!),
    });
  }
  if (input.questItemLabel?.trim()) {
    rewards.push({ kind: 'questItem', label: input.questItemLabel.trim() });
  }
  return rewards;
}

function validateCanAfford(state: QuestState, rewards: EscrowedReward[]): string | null {
  for (const r of rewards) {
    if (r.kind === 'gold') {
      const split = splitCopperIntoCoins(getCopperFromModifiers(state.modifiers));
      if (split.gold < r.amount) return `Need ${r.amount} gold in escrow.`;
    }
    if (r.kind === 'modifierItem') {
      const have = state.modifiers[r.key] ?? 0;
      if (have < r.quantity) return `Not enough ${toItemLabel(r.key)}.`;
    }
    if (r.kind === 'questItem') {
      if (!state.questItems.includes(r.label)) return `You do not have "${r.label}".`;
    }
  }
  if (rewards.length === 0) return 'Choose a reward (gold and/or item).';
  return null;
}

function deductRewards(state: QuestState, rewards: EscrowedReward[]): QuestState {
  let next = state;
  for (const r of rewards) {
    if (r.kind === 'gold') {
      next = applyDirectModifiersDelta(next, { gold: -r.amount });
    }
    if (r.kind === 'modifierItem') {
      next = applyDirectModifiersDelta(next, { [r.key]: -r.quantity });
    }
    if (r.kind === 'questItem') {
      const idx = next.questItems.indexOf(r.label);
      if (idx >= 0) {
        next = {
          ...next,
          questItems: next.questItems.filter((_, i) => i !== idx),
        };
      }
    }
  }
  return next;
}

function restoreRewards(state: QuestState, rewards: EscrowedReward[]): QuestState {
  let next = state;
  for (const r of rewards) {
    if (r.kind === 'gold') {
      next = applyDirectModifiersDelta(next, { gold: r.amount });
    }
    if (r.kind === 'modifierItem') {
      next = applyDirectModifiersDelta(next, { [r.key]: r.quantity });
    }
    if (r.kind === 'questItem') {
      if (!next.questItems.includes(r.label)) {
        next = { ...next, questItems: [...next.questItems, r.label] };
      }
    }
  }
  return next;
}

export function applyPostEscrow(
  state: QuestState,
  questId: string,
  input: PostRewardInput
): { state: QuestState; rewards: EscrowedReward[] } | { error: string } {
  const rewards = buildRewardsFromInput(input);
  const err = validateCanAfford(state, rewards);
  if (err) return { error: err };

  const next = deductRewards(state, rewards);
  const escrow = { ...(next.tavernEscrowByQuestId ?? {}), [questId]: { questId, rewards } };
  return { state: { ...next, tavernEscrowByQuestId: escrow }, rewards };
}

export function refundEscrow(state: QuestState, questId: string): QuestState {
  const entry = state.tavernEscrowByQuestId?.[questId];
  if (!entry) return state;
  const next = restoreRewards(state, entry.rewards);
  const escrow = { ...(next.tavernEscrowByQuestId ?? {}) };
  delete escrow[questId];
  return { ...next, tavernEscrowByQuestId: escrow };
}

export function applyFulfillBountyDeduction(
  state: QuestState,
  bountyText: string
): { state: QuestState } | { error: string } {
  const match = findBountyMatch(state, bountyText);
  if (!match) return { error: 'You do not have the bounty item.' };

  if (match.kind === 'modifier') {
    return { state: applyDirectModifiersDelta(state, { [match.key]: -1 }) };
  }

  const idx = state.questItems.indexOf(match.label);
  if (idx < 0) return { error: 'You do not have the bounty item.' };
  return { state: { ...state, questItems: state.questItems.filter((_, i) => i !== idx) } };
}

export function applyFulfillRewardGrant(state: QuestState, quest: PlayerQuestView): QuestState {
  let next = state;
  if (quest.rewardGold > 0) {
    next = applyDirectModifiersDelta(next, { gold: quest.rewardGold });
  }
  if (quest.rewardItemKey && quest.rewardItemQty > 0) {
    next = applyDirectModifiersDelta(next, { [quest.rewardItemKey]: quest.rewardItemQty });
  } else if (quest.rewardItemLabel) {
    const label = quest.rewardItemLabel;
    if (!next.questItems.includes(label)) {
      next = { ...next, questItems: [...next.questItems, label] };
    }
  }
  return next;
}

export function formatRewardSummary(quest: PlayerQuestView): string {
  const parts: string[] = [];
  if (quest.rewardGold > 0) parts.push(`${quest.rewardGold}g`);
  if (quest.rewardItemLabel) parts.push(quest.rewardItemLabel);
  else if (quest.rewardItemKey) parts.push(toItemLabel(quest.rewardItemKey));
  return parts.length > 0 ? parts.join(' + ') : 'None';
}

export function goldCopperAmount(gold: number): number {
  return gold * COPPER_PER_GOLD;
}
