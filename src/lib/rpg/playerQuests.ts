import type { NostrEvent } from '@nostrify/nostrify';
import type { MVPCharacter } from './utils';

export const QUEST_POST_KIND = 30101;
export const QUEST_ACCEPT_KIND = 30102;
export const QUEST_COMPLETE_KIND = 30103;
export const QUEST_SETTLEMENT_KIND = 30104;

export interface PlayerQuestBounty {
  id: string;
  posterPubkey: string;
  title: string;
  description: string;
  requestedItem: string;
  bountyPerUnit: number;
  totalEscrow: number;
  remainingEscrow: number;
  maxUnits: number;
  acceptedCount: number;
  completedUnits: number;
  createdAt: number;
  alias?: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
}

export interface QuestCompletionProof {
  questId: string;
  completerPubkey: string;
  itemsSubmitted: number;
  payout: number;
  createdAt: number;
}

export const postingFee = 1;

export const validateEscrowMath = (totalEscrow: number, bountyPerUnit: number): boolean => {
  if (bountyPerUnit <= 0 || totalEscrow <= 0) return false;
  return totalEscrow % bountyPerUnit === 0;
};

export const calculateMaxUnits = (totalEscrow: number, bountyPerUnit: number): number => {
  if (bountyPerUnit <= 0) return 0;
  return Math.floor(totalEscrow / bountyPerUnit);
};

const getTagValue = (event: NostrEvent, key: string): string | undefined => {
  return event.tags.find(([name]) => name === key)?.[1];
};

const parseQuestContent = (event: NostrEvent): { title: string; description: string } => {
  try {
    const parsed = JSON.parse(event.content) as { title?: string; description?: string };
    return {
      title: parsed.title?.trim() || 'Untitled Quest',
      description: parsed.description?.trim() || '',
    };
  } catch {
    return { title: 'Untitled Quest', description: event.content || '' };
  }
};

export const buildQuestFromEvent = (
  event: NostrEvent,
  acceptsByQuest: Map<string, number>,
  completedUnitsByQuest: Map<string, number>,
): PlayerQuestBounty | null => {
  const item = getTagValue(event, 'item');
  const bounty = Number(getTagValue(event, 'bounty') ?? 0);
  const escrow = Number(getTagValue(event, 'escrow') ?? 0);
  if (!item || !validateEscrowMath(escrow, bounty)) return null;

  const completedUnits = completedUnitsByQuest.get(event.id) ?? 0;
  const remainingEscrow = Math.max(0, escrow - (completedUnits * bounty));
  const maxUnits = calculateMaxUnits(escrow, bounty);

  const content = parseQuestContent(event);
  return {
    id: event.id,
    posterPubkey: event.pubkey,
    title: content.title,
    description: content.description,
    requestedItem: item,
    bountyPerUnit: bounty,
    totalEscrow: escrow,
    remainingEscrow,
    maxUnits,
    acceptedCount: acceptsByQuest.get(event.id) ?? 0,
    completedUnits,
    createdAt: event.created_at * 1000,
    alias: getTagValue(event, 'alias'),
    status: remainingEscrow > 0 ? 'active' : 'completed',
  };
};

export const applyPostedQuestToCharacter = (
  character: MVPCharacter,
  questId: string,
  escrow: number,
): MVPCharacter => {
  return {
    ...character,
    gold: Math.max(0, (character.gold ?? 0) - (postingFee + escrow)),
    escrowedGold: (character.escrowedGold ?? 0) + escrow,
    postedQuests: Array.from(new Set([...character.postedQuests, questId])),
    dailyLogs: [
      { tick: 'quest', line: `You posted a quest and escrowed ${escrow} gold.` },
      ...(character.dailyLogs ?? []),
    ].slice(0, 40),
  };
};

export const applyQuestCompletionToCharacter = (
  character: MVPCharacter,
  quest: PlayerQuestBounty,
  itemsSubmitted: number,
): MVPCharacter => {
  const payout = itemsSubmitted * quest.bountyPerUnit;
  const inventory = [...character.inventory];
  const idx = inventory.findIndex((entry) => entry.itemId === quest.requestedItem);
  if (idx >= 0) {
    inventory[idx] = { ...inventory[idx], quantity: Math.max(0, inventory[idx].quantity - itemsSubmitted) };
  }

  return {
    ...character,
    inventory: inventory.filter((entry) => entry.quantity > 0),
    gold: (character.gold ?? 0) + payout,
    completedQuests: Array.from(new Set([...character.completedQuests, quest.id])),
    dailyLogs: [
      { tick: 'quest', line: `Quest completed: +${payout} gold for ${itemsSubmitted} ${quest.requestedItem}.` },
      ...(character.dailyLogs ?? []),
    ].slice(0, 40),
  };
};
