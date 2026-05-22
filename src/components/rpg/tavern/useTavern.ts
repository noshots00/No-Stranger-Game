import { useCallback } from 'react';
import { useNostr } from '@nostrify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { acceptWolfHidesQuest } from './wolfHidesDaily';
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
import { TAVERN_FEED_STALE_MS } from './constants';
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

export function useTavern(args: {
  enabled: boolean;
  questState: QuestState;
  myPubkey: string | undefined;
  setQuestState: React.Dispatch<React.SetStateAction<QuestState>>;
  persistQuestCheckpoint: (state: QuestState) => void | Promise<void>;
}) {
  const { nostr } = useNostr();
  const { mutateAsync: publish } = useNostrPublish();
  const queryClient = useQueryClient();

  const feedQuery = useQuery({
    queryKey: TAVERN_FEED_KEY,
    queryFn: () => fetchTavernFeed(nostr),
    enabled: args.enabled,
    staleTime: TAVERN_FEED_STALE_MS,
    refetchInterval: args.enabled ? TAVERN_FEED_STALE_MS : false,
  });

  const feed = feedQuery.data ?? { openQuests: [], allQuests: [] };

  const invalidateFeed = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: TAVERN_FEED_KEY });
  }, [queryClient]);

  const acceptWolfHides = useMutation({
    mutationFn: async () => {
      args.setQuestState((prev) => {
        const next = acceptWolfHidesQuest(prev);
        void args.persistQuestCheckpoint(next);
        return next;
      });
    },
  });

  const postQuest = useMutation({
    mutationFn: async (input: {
      title: string;
      description: string;
      bounty: string;
      rewards: PostRewardInput;
    }) => {
      if (!args.myPubkey) throw new Error('You must be logged in to post a quest.');

      const questId = newPlayerQuestId();
      const escrowOutcome = {
        error: null as string | null,
        next: null as QuestState | null,
        posterName: 'Stranger',
      };

      args.setQuestState((prev) => {
        escrowOutcome.posterName = prev.playerName.trim() || 'Stranger';
        const escrowResult = applyPostEscrow(prev, questId, input.rewards);
        if ('error' in escrowResult) {
          escrowOutcome.error = escrowResult.error;
          return prev;
        }
        escrowOutcome.next = escrowResult.state;
        return escrowResult.state;
      });

      if (escrowOutcome.error) throw new Error(escrowOutcome.error);
      if (!escrowOutcome.next) throw new Error('Failed to escrow reward.');
      const nextState = escrowOutcome.next;
      const posterName = escrowOutcome.posterName;

      const gold = input.rewards.goldAmount ?? 0;
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

      void args.persistQuestCheckpoint(nextState);
      return questId;
    },
    onSuccess: () => invalidateFeed(),
  });

  const cancelQuest = useMutation({
    mutationFn: async (quest: PlayerQuestView) => {
      if (!args.myPubkey || quest.pubkey !== args.myPubkey) {
        throw new Error('Only the poster can cancel this quest.');
      }
      const cancelOutcome = { next: null as QuestState | null };
      args.setQuestState((prev) => {
        cancelOutcome.next = refundEscrow(prev, quest.questId);
        return cancelOutcome.next;
      });
      if (!cancelOutcome.next) throw new Error('Failed to cancel quest.');
      void args.persistQuestCheckpoint(cancelOutcome.next);
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
      if (!args.myPubkey) throw new Error('You must be logged in to fulfill a quest.');
      if (quest.pubkey === args.myPubkey) throw new Error('You cannot fulfill your own quest.');

      const fulfillOutcome = { error: null as string | null, next: null as QuestState | null };
      args.setQuestState((prev) => {
        const bountyResult = applyFulfillBountyDeduction(prev, quest.bounty);
        if ('error' in bountyResult) {
          fulfillOutcome.error = bountyResult.error;
          return prev;
        }
        fulfillOutcome.next = applyFulfillRewardGrant(bountyResult.state, quest);
        return fulfillOutcome.next;
      });
      if (fulfillOutcome.error) throw new Error(fulfillOutcome.error);
      if (!fulfillOutcome.next) throw new Error('Failed to fulfill quest.');
      const next = fulfillOutcome.next;

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
          fulfillerPubkey: args.myPubkey,
          fulfillerName,
        })
      );

      void args.persistQuestCheckpoint(next);
    },
    onSuccess: () => invalidateFeed(),
  });

  return {
    feedQuery,
    feed,
    acceptWolfHides,
    postQuest,
    cancelQuest,
    fulfillQuest,
    invalidateFeed,
  };
}
