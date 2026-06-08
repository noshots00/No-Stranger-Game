import { useCallback, useEffect, useRef } from 'react';
import { useNostr } from '@nostrify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import {
  applyFulfillBountyDeduction,
  applyFulfillRewardGrant,
  applyPostEscrow,
  refundEscrow,
  type PostRewardInput,
} from './questEscrow';
import {
  buildPlayerQuestDraft,
  latestPlayerQuests,
  newPlayerQuestId,
  playerQuestFilter,
  type PlayerQuestView,
} from './playerQuestNostr';
import type { QuestState } from '../quests/types';

const TAVERN_FEED_KEY = ['tavern-player-quests'] as const;

export type TavernFeed = {
  openQuests: PlayerQuestView[];
  allQuests: PlayerQuestView[];
};

async function fetchTavernFeed(
  nostr: { query: (f: ReturnType<typeof playerQuestFilter>[]) => Promise<unknown[]> }
): Promise<TavernFeed> {
  const events = (await nostr.query([playerQuestFilter()])) as NostrEvent[];
  const allQuests = latestPlayerQuests(events);
  const openQuests = allQuests.filter((q) => q.status === 'open' && q.slotsRemaining > 0);
  return { openQuests, allQuests };
}

const UNPUBLISHED_ESCROW_RECOVERY_MS = 25_000;

export function useTavern(args: {
  enabled: boolean;
  questState: QuestState;
  myPubkey: string | undefined;
  getQuestState: () => QuestState;
  setQuestState: React.Dispatch<React.SetStateAction<QuestState>>;
  persistQuestCheckpoint: (state: QuestState) => void | Promise<void>;
}) {
  const { enabled, myPubkey, getQuestState, setQuestState, persistQuestCheckpoint } = args;

  const { nostr } = useNostr();
  const { mutateAsync: publish } = useNostrPublish();
  const queryClient = useQueryClient();

  const feedQuery = useQuery({
    queryKey: TAVERN_FEED_KEY,
    queryFn: () => fetchTavernFeed(nostr),
    enabled,
    staleTime: Infinity,
  });

  const feed = feedQuery.data ?? { openQuests: [], allQuests: [] };

  const invalidateFeed = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: TAVERN_FEED_KEY });
  }, [queryClient]);

  const publishedQuestIdsRef = useRef(new Set<string>());

  /** Refund escrow rows that never appeared on relays (e.g. after a failed publish). */
  useEffect(() => {
    if (!enabled || !feedQuery.isFetched || !myPubkey) return;

    const timer = window.setTimeout(() => {
      const myQuestIds = new Set(
        feed.allQuests.filter((q) => q.pubkey === myPubkey).map((q) => q.questId)
      );
      for (const id of publishedQuestIdsRef.current) myQuestIds.add(id);

      const escrowIds = Object.keys(getQuestState().tavernEscrowByQuestId ?? {});
      const orphans = escrowIds.filter((id) => !myQuestIds.has(id));
      if (orphans.length === 0) return;

      setQuestState((prev) => {
        let next = prev;
        for (const id of orphans) next = refundEscrow(next, id);
        if (next === prev) return prev;
        void persistQuestCheckpoint(next);
        return next;
      });
    }, UNPUBLISHED_ESCROW_RECOVERY_MS);

    return () => window.clearTimeout(timer);
  }, [
    enabled,
    myPubkey,
    getQuestState,
    setQuestState,
    persistQuestCheckpoint,
    feed.allQuests,
    feedQuery.isFetched,
    feedQuery.dataUpdatedAt,
  ]);

  const postQuest = useMutation({
    mutationFn: async (input: {
      bounty: string;
      rewards: PostRewardInput;
    }) => {
      if (!myPubkey) throw new Error('You must be logged in to post a quest.');

      const questId = newPlayerQuestId();
      const beforePost = getQuestState();
      const posterName = beforePost.playerName.trim() || 'Stranger';
      const bounty = input.bounty.trim();
      const slotCount = Math.max(1, input.rewards.slotCount ?? 1);
      const goldPerUnit =
        input.rewards.goldPerUnit ??
        (input.rewards.goldAmount && slotCount === 1 ? input.rewards.goldAmount : 0);

      const escrowResult = applyPostEscrow(beforePost, questId, {
        ...input.rewards,
        goldPerUnit: goldPerUnit > 0 ? goldPerUnit : undefined,
        slotCount: goldPerUnit > 0 ? slotCount : undefined,
      });
      if ('error' in escrowResult) throw new Error(escrowResult.error);

      const nextState = escrowResult.state;
      setQuestState(nextState);

      try {
        await publish(
          buildPlayerQuestDraft({
            questId,
            title: bounty,
            description: '',
            bounty,
            posterName,
            rewardGold: goldPerUnit,
            rewardSlots: slotCount,
            slotsRemaining: slotCount,
            rewardItemLabel: input.rewards.questItemLabel,
            rewardItemKey: input.rewards.modifierItemKey,
            rewardItemQty: input.rewards.modifierItemQty ?? 1,
            status: 'open',
          })
        );
      } catch (error) {
        const refunded = refundEscrow(nextState, questId);
        setQuestState(refunded);
        await persistQuestCheckpoint(refunded);
        throw error;
      }

      publishedQuestIdsRef.current.add(questId);
      await persistQuestCheckpoint(nextState);
      return questId;
    },
    onSuccess: () => invalidateFeed(),
  });

  const cancelQuest = useMutation({
    mutationFn: async (quest: PlayerQuestView) => {
      if (!myPubkey || quest.pubkey !== myPubkey) {
        throw new Error('Only the poster can cancel this quest.');
      }
      const refunded = refundEscrow(getQuestState(), quest.questId);
      setQuestState(refunded);
      await persistQuestCheckpoint(refunded);
      await publish(
        buildPlayerQuestDraft({
          questId: quest.questId,
          title: quest.title,
          description: quest.description,
          bounty: quest.bounty,
          posterName: quest.posterName,
          rewardGold: quest.rewardGold,
          rewardSlots: quest.rewardSlots,
          slotsRemaining: quest.slotsRemaining,
          rewardItemLabel: quest.rewardItemLabel || undefined,
          rewardItemKey: quest.rewardItemKey || undefined,
          rewardItemQty: quest.rewardItemQty || undefined,
          status: 'cancelled',
        })
      );
    },
    onSuccess: () => invalidateFeed(),
  });

  const fulfillQuest = useMutation({
    mutationFn: async (quest: PlayerQuestView) => {
      if (!myPubkey) throw new Error('You must be logged in to fulfill a quest.');
      if (quest.pubkey === myPubkey) throw new Error('You cannot fulfill your own quest.');

      const beforeFulfill = getQuestState();
      const bountyResult = applyFulfillBountyDeduction(beforeFulfill, quest.bounty);
      if ('error' in bountyResult) throw new Error(bountyResult.error);
      const next = applyFulfillRewardGrant(bountyResult.state, quest);
      setQuestState(next);

      const fulfillerName = next.playerName.trim() || 'Stranger';
      const remaining = Math.max(0, quest.slotsRemaining - 1);
      const fulfilled = remaining === 0;

      await publish(
        buildPlayerQuestDraft({
          questId: quest.questId,
          title: quest.title,
          description: quest.description,
          bounty: quest.bounty,
          posterName: quest.posterName,
          rewardGold: quest.rewardGold,
          rewardSlots: quest.rewardSlots,
          slotsRemaining: remaining,
          rewardItemLabel: quest.rewardItemLabel || undefined,
          rewardItemKey: quest.rewardItemKey || undefined,
          rewardItemQty: quest.rewardItemQty || undefined,
          status: fulfilled ? 'fulfilled' : 'open',
          fulfillerPubkey: fulfilled ? myPubkey : undefined,
          fulfillerName: fulfilled ? fulfillerName : undefined,
        })
      );

      await persistQuestCheckpoint(next);
    },
    onSuccess: () => invalidateFeed(),
  });

  return {
    feedQuery,
    feed,
    postQuest,
    cancelQuest,
    fulfillQuest,
    invalidateFeed,
  };
}
