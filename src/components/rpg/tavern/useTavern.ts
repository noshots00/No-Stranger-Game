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
  const openQuests = allQuests.filter((q) => q.status === 'open');
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
      title: string;
      description: string;
      bounty: string;
      rewards: PostRewardInput;
    }) => {
      if (!myPubkey) throw new Error('You must be logged in to post a quest.');

      const questId = newPlayerQuestId();
      const beforePost = getQuestState();
      const posterName = beforePost.playerName.trim() || 'Stranger';
      const escrowResult = applyPostEscrow(beforePost, questId, input.rewards);
      if ('error' in escrowResult) throw new Error(escrowResult.error);

      const nextState = escrowResult.state;
      setQuestState(nextState);

      const gold = input.rewards.goldAmount ?? 0;
      try {
        await publish(
          buildPlayerQuestDraft({
            questId,
            title: input.title.trim(),
            description: input.description.trim(),
            bounty: input.bounty.trim(),
            posterName,
            rewardGold: gold,
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
      await publish(
        buildPlayerQuestDraft({
          questId: quest.questId,
          title: quest.title,
          description: quest.description,
          bounty: quest.bounty,
          posterName: quest.posterName,
          rewardGold: quest.rewardGold,
          rewardItemLabel: quest.rewardItemLabel || undefined,
          rewardItemKey: quest.rewardItemKey || undefined,
          rewardItemQty: quest.rewardItemQty || undefined,
          status: 'fulfilled',
          fulfillerPubkey: myPubkey,
          fulfillerName,
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
