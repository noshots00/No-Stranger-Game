import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import {
  NSG_PLAYER_QUEST_KIND,
  PLAYER_QUEST_D_PREFIX,
  PLAYER_QUEST_QUERY_LIMIT,
  PLAYER_QUEST_TAG,
  TAVERN_COMMUNITY_TAG,
  type PlayerQuestStatus,
} from './constants';

export type PlayerQuestView = {
  questId: string;
  eventId: string;
  pubkey: string;
  title: string;
  description: string;
  bounty: string;
  status: PlayerQuestStatus;
  posterName: string;
  rewardGold: number;
  rewardItemLabel: string;
  rewardItemKey: string;
  rewardItemQty: number;
  fulfillerPubkey?: string;
  fulfillerName?: string;
  createdAt: number;
};

const tagValue = (event: NostrEvent, name: string): string | undefined =>
  event.tags.find(([n]) => n === name)?.[1];

export function newPlayerQuestId(): string {
  return `${PLAYER_QUEST_D_PREFIX}${crypto.randomUUID()}`;
}

export function parsePlayerQuest(event: NostrEvent): PlayerQuestView | null {
  if (event.kind !== NSG_PLAYER_QUEST_KIND) return null;
  const d = tagValue(event, 'd');
  if (!d?.startsWith(PLAYER_QUEST_D_PREFIX)) return null;
  if (!event.tags.some(([n, v]) => n === 't' && v === PLAYER_QUEST_TAG)) return null;

  const title = tagValue(event, 'title')?.trim();
  const bounty = tagValue(event, 'bounty')?.trim();
  const posterName = tagValue(event, 'poster-name')?.trim() ?? 'Stranger';
  const statusRaw = tagValue(event, 'status');
  const status: PlayerQuestStatus =
    statusRaw === 'fulfilled' || statusRaw === 'cancelled' ? statusRaw : 'open';

  if (!title || !bounty) return null;

  const description = tagValue(event, 'desc')?.trim() ?? event.content.trim();
  const rewardGold = Number.parseInt(tagValue(event, 'reward-gold') ?? '0', 10);
  const rewardItemLabel = tagValue(event, 'reward-item')?.trim() ?? '';
  const rewardItemKey = tagValue(event, 'reward-item-key')?.trim() ?? '';
  const rewardItemQty = Number.parseInt(tagValue(event, 'reward-item-qty') ?? '1', 10);

  return {
    questId: d,
    eventId: event.id,
    pubkey: event.pubkey,
    title,
    description,
    bounty,
    status,
    posterName,
    rewardGold: Number.isFinite(rewardGold) ? Math.max(0, rewardGold) : 0,
    rewardItemLabel,
    rewardItemKey,
    rewardItemQty: Number.isFinite(rewardItemQty) ? Math.max(0, rewardItemQty) : 0,
    fulfillerPubkey: tagValue(event, 'fulfiller'),
    fulfillerName: tagValue(event, 'fulfiller-name'),
    createdAt: event.created_at,
  };
}

export const playerQuestFilter = (): NostrFilter => ({
  kinds: [NSG_PLAYER_QUEST_KIND],
  '#t': [PLAYER_QUEST_TAG],
  limit: PLAYER_QUEST_QUERY_LIMIT,
});

/** Latest event per quest `d` tag (replaceable). */
export function latestPlayerQuests(events: readonly NostrEvent[]): PlayerQuestView[] {
  const byD = new Map<string, { quest: PlayerQuestView; createdAt: number }>();
  for (const event of events) {
    const quest = parsePlayerQuest(event);
    if (!quest) continue;
    const prev = byD.get(quest.questId);
    if (!prev || event.created_at >= prev.createdAt) {
      byD.set(quest.questId, { quest, createdAt: event.created_at });
    }
  }
  return Array.from(byD.values())
    .map((e) => e.quest)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function buildPlayerQuestDraft(args: {
  questId: string;
  title: string;
  description: string;
  bounty: string;
  posterName: string;
  rewardGold: number;
  rewardItemLabel?: string;
  rewardItemKey?: string;
  rewardItemQty?: number;
  status?: PlayerQuestStatus;
  fulfillerPubkey?: string;
  fulfillerName?: string;
  createdAtSec?: number;
}): Omit<NostrEvent, 'id' | 'pubkey' | 'sig'> {
  const created_at = args.createdAtSec ?? Math.floor(Date.now() / 1000);
  const tags: string[][] = [
    ['d', args.questId],
    ['t', TAVERN_COMMUNITY_TAG],
    ['t', PLAYER_QUEST_TAG],
    ['title', args.title],
    ['desc', args.description.slice(0, 500)],
    ['bounty', args.bounty],
    ['status', args.status ?? 'open'],
    ['poster-name', args.posterName],
    ['reward-gold', String(Math.max(0, args.rewardGold))],
    ['alt', 'Player-posted tavern quest for No Stranger Game'],
  ];
  if (args.rewardItemLabel) tags.push(['reward-item', args.rewardItemLabel]);
  if (args.rewardItemKey) tags.push(['reward-item-key', args.rewardItemKey]);
  if (args.rewardItemQty !== undefined) tags.push(['reward-item-qty', String(args.rewardItemQty)]);

  if (args.fulfillerPubkey) tags.push(['fulfiller', args.fulfillerPubkey]);
  if (args.fulfillerName) tags.push(['fulfiller-name', args.fulfillerName]);

  return {
    kind: NSG_PLAYER_QUEST_KIND,
    content: '',
    created_at,
    tags,
  };
}

/**
 * MVP: quest events are author-published; escrow is enforced on the poster/fulfiller clients.
 */
