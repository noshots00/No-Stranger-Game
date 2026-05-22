import { useCallback, useMemo } from 'react';
import { useNostr } from '@nostrify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import {
  buildMayorCandidateDraft,
  buildMayorVoteDraft,
  buildMayorElectionSnapshot,
  mayorCandidateFilter,
  mayorVoteFilter,
  type MayorElectionSnapshot,
} from './mayorElectionNostr';
import { MAYORS_HUT_FEED_STALE_MS } from './constants';
import type { QuestState } from '../quests/types';

const MAYORS_HUT_FEED_KEY = ['mayors-hut-election'] as const;

async function fetchMayorElection(
  nostr: {
    query: (
      f: ReturnType<typeof mayorCandidateFilter>[] | ReturnType<typeof mayorVoteFilter>[]
    ) => Promise<unknown[]>;
  }
): Promise<MayorElectionSnapshot> {
  const [candidateEvents, voteEvents] = await Promise.all([
    nostr.query([mayorCandidateFilter()]) as Promise<NostrEvent[]>,
    nostr.query([mayorVoteFilter()]) as Promise<NostrEvent[]>,
  ]);
  return buildMayorElectionSnapshot(candidateEvents, voteEvents);
}

export function useMayorsHut(args: {
  enabled: boolean;
  questState: QuestState;
  myPubkey: string | undefined;
}) {
  const { nostr } = useNostr();
  const { mutateAsync: publish } = useNostrPublish();
  const queryClient = useQueryClient();

  const feedQuery = useQuery({
    queryKey: MAYORS_HUT_FEED_KEY,
    queryFn: () => fetchMayorElection(nostr),
    enabled: args.enabled,
    staleTime: MAYORS_HUT_FEED_STALE_MS,
    refetchInterval: args.enabled ? MAYORS_HUT_FEED_STALE_MS : false,
  });

  const election = feedQuery.data ?? buildMayorElectionSnapshot([], []);

  const myCandidate = useMemo(
    () => (args.myPubkey ? election.candidates.find((c) => c.pubkey === args.myPubkey) : undefined),
    [election.candidates, args.myPubkey]
  );

  const myActiveCandidacy = myCandidate?.status === 'active';
  const myVote = useMemo(
    () => (args.myPubkey ? election.votes.find((v) => v.voterPubkey === args.myPubkey) : undefined),
    [election.votes, args.myPubkey]
  );

  const invalidateFeed = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: MAYORS_HUT_FEED_KEY });
  }, [queryClient]);

  const displayName = args.questState.playerName.trim() || 'Stranger';

  const runForMayor = useMutation({
    mutationFn: async () => {
      if (!args.myPubkey) throw new Error('You must be logged in to run for mayor.');
      await publish(
        buildMayorCandidateDraft({
          candidateName: displayName,
          status: 'active',
        })
      );
    },
    onSuccess: () => invalidateFeed(),
  });

  const withdrawFromElection = useMutation({
    mutationFn: async () => {
      if (!args.myPubkey) throw new Error('You must be logged in to withdraw.');
      await publish(
        buildMayorCandidateDraft({
          candidateName: displayName,
          status: 'withdrawn',
        })
      );
    },
    onSuccess: () => invalidateFeed(),
  });

  const castVote = useMutation({
    mutationFn: async (candidatePubkey: string) => {
      if (!args.myPubkey) throw new Error('You must be logged in to vote.');
      await publish(
        buildMayorVoteDraft({
          candidatePubkey,
          voterName: displayName,
        })
      );
    },
    onSuccess: () => invalidateFeed(),
  });

  return {
    feedQuery,
    election,
    myCandidate,
    myActiveCandidacy,
    myVote,
    runForMayor,
    withdrawFromElection,
    castVote,
    invalidateFeed,
  };
}
