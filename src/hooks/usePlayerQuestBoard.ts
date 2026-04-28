import { useMemo } from 'react';
import { useNostr } from '@nostrify/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';
import {
  QUEST_ACCEPT_KIND,
  QUEST_COMPLETE_KIND,
  QUEST_POST_KIND,
  QUEST_SETTLEMENT_KIND,
  buildQuestFromEvent,
  calculateMaxUnits,
  isQuestExpired,
  postingFee,
  validateEscrowMath,
  type PlayerQuestBounty,
} from '@/lib/rpg/playerQuests';

export interface PostQuestInput {
  title: string;
  description: string;
  requestedItem: string;
  bountyPerUnit: number;
  totalEscrow: number;
  alias?: string;
}

const BOARD_TAGS = ['no-stranger-game', 'quest-board'];

const countByQuestTag = (events: NostrEvent[]): Map<string, number> => {
  const map = new Map<string, number>();
  for (const event of events) {
    const questId = event.tags.find(([name]) => name === 'e')?.[1];
    if (!questId) continue;
    map.set(questId, (map.get(questId) ?? 0) + 1);
  }
  return map;
};

const completedUnitsByQuest = (events: NostrEvent[]): Map<string, number> => {
  const map = new Map<string, number>();
  for (const event of events) {
    const questId = event.tags.find(([name]) => name === 'e')?.[1];
    const qty = Number(event.tags.find(([name]) => name === 'quantity')?.[1] ?? 0);
    if (!questId || qty <= 0) continue;
    map.set(questId, (map.get(questId) ?? 0) + qty);
  }
  return map;
};

export function usePlayerQuestBoard() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  const boardQuery = useQuery({
    queryKey: ['nostr', 'quest-board'],
    refetchInterval: false,
    queryFn: async () => {
      const events = await nostr.query(
        [
          { kinds: [QUEST_POST_KIND], '#t': BOARD_TAGS, limit: 200 },
          { kinds: [QUEST_ACCEPT_KIND], '#t': BOARD_TAGS, limit: 400 },
          { kinds: [QUEST_COMPLETE_KIND], '#t': BOARD_TAGS, limit: 400 },
        ],
        { signal: AbortSignal.timeout(7000) },
      );

      const posts = events.filter((event) => event.kind === QUEST_POST_KIND);
      const accepts = events.filter((event) => event.kind === QUEST_ACCEPT_KIND);
      const completions = events.filter((event) => event.kind === QUEST_COMPLETE_KIND);
      const acceptsByQuest = countByQuestTag(accepts);
      const completedByQuest = completedUnitsByQuest(completions);

      const quests = posts
        .map((event) => buildQuestFromEvent(event, acceptsByQuest, completedByQuest))
        .filter((quest): quest is PlayerQuestBounty => Boolean(quest))
        .map((quest) => (isQuestExpired(quest) && quest.status === 'active' ? { ...quest, status: 'expired' as const } : quest))
        .sort((a, b) => b.createdAt - a.createdAt);

      return {
        quests,
        completions: completions
          .sort((a, b) => b.created_at - a.created_at)
          .slice(0, 8)
          .map((event) => ({
            questId: event.tags.find(([name]) => name === 'e')?.[1] ?? '',
            pubkey: event.pubkey,
            quantity: Number(event.tags.find(([name]) => name === 'quantity')?.[1] ?? 0),
            item: event.tags.find(([name]) => name === 'item')?.[1] ?? 'item',
          })),
      };
    },
  });

  const postQuest = useMutation({
    mutationFn: async (input: PostQuestInput) => {
      if (!user) throw new Error('You must be logged in.');
      if (!validateEscrowMath(input.totalEscrow, input.bountyPerUnit)) {
        throw new Error('Escrow must be divisible by bounty per unit.');
      }

      const event = await user.signer.signEvent({
        kind: QUEST_POST_KIND,
        content: JSON.stringify({
          title: input.title.trim(),
          description: input.description.trim(),
        }),
        tags: [
          ['d', `quest-${Date.now()}`],
          ['item', input.requestedItem],
          ['bounty', String(input.bountyPerUnit)],
          ['escrow', String(input.totalEscrow)],
          ['max', String(calculateMaxUnits(input.totalEscrow, input.bountyPerUnit))],
          ['expires', String(Date.now() + (1000 * 60 * 60 * 24 * 7))],
          ['fee', String(postingFee)],
          ['t', 'no-stranger-game'],
          ['t', 'quest-board'],
          ['alt', 'No Stranger Game player bounty quest'],
          ...(input.alias ? [['alias', input.alias]] : []),
        ],
        created_at: Math.floor(Date.now() / 1000),
      });

      await nostr.event(event, { signal: AbortSignal.timeout(7000) });
      return event;
    },
    onSuccess: () => boardQuery.refetch(),
  });

  const acceptQuest = useMutation({
    mutationFn: async (questId: string) => {
      if (!user) throw new Error('You must be logged in.');
      const event = await user.signer.signEvent({
        kind: QUEST_ACCEPT_KIND,
        content: '',
        tags: [
          ['e', questId],
          ['t', 'no-stranger-game'],
          ['t', 'quest-board'],
          ['alt', 'No Stranger Game quest acceptance signal'],
        ],
        created_at: Math.floor(Date.now() / 1000),
      });
      await nostr.event(event, { signal: AbortSignal.timeout(7000) });
      return event;
    },
    onSuccess: () => boardQuery.refetch(),
  });

  const completeQuest = useMutation({
    mutationFn: async ({ quest, quantity }: { quest: PlayerQuestBounty; quantity: number }) => {
      if (!user) throw new Error('You must be logged in.');
      if (quantity <= 0) throw new Error('Quantity must be positive.');
      const payout = quantity * quest.bountyPerUnit;
      const event = await user.signer.signEvent({
        kind: QUEST_COMPLETE_KIND,
        content: '',
        tags: [
          ['e', quest.id],
          ['item', quest.requestedItem],
          ['quantity', String(quantity)],
          ['payout', String(payout)],
          ['t', 'no-stranger-game'],
          ['t', 'quest-board'],
          ['alt', 'No Stranger Game quest completion proof'],
        ],
        created_at: Math.floor(Date.now() / 1000),
      });
      await nostr.event(event, { signal: AbortSignal.timeout(7000) });
      return event;
    },
    onSuccess: () => boardQuery.refetch(),
  });

  const settleExpiredQuest = useMutation({
    mutationFn: async (quest: PlayerQuestBounty) => {
      if (!user) throw new Error('You must be logged in.');
      const event = await user.signer.signEvent({
        kind: QUEST_SETTLEMENT_KIND,
        content: JSON.stringify({
          questId: quest.id,
          type: 'expired',
          refundedGold: quest.remainingEscrow + postingFee,
        }),
        tags: [
          ['e', quest.id],
          ['type', 'expired'],
          ['refund', String(quest.remainingEscrow + postingFee)],
          ['t', 'no-stranger-game'],
          ['t', 'quest-board'],
          ['alt', 'No Stranger Game quest settlement marker'],
        ],
        created_at: Math.floor(Date.now() / 1000),
      });
      await nostr.event(event, { signal: AbortSignal.timeout(7000) });
      return event;
    },
    onSuccess: () => boardQuery.refetch(),
  });

  const recentCompletions = useMemo(() => boardQuery.data?.completions ?? [], [boardQuery.data]);

  return {
    quests: boardQuery.data?.quests ?? [],
    recentCompletions,
    isLoading: boardQuery.isLoading,
    refreshBoard: () => boardQuery.refetch(),
    postQuest,
    acceptQuest,
    completeQuest,
    settleExpiredQuest,
  };
}
