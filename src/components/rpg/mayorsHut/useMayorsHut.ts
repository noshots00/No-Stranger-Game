import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNostr } from '@nostrify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import {
  buildMayorCandidateDraft,
  buildMayorVoteDraft,
  buildMayorVoteWithdrawDraft,
  buildMayorElectionSnapshot,
  mayorCandidateFilter,
  mayorVoteFilter,
  type MayorElectionSnapshot,
} from './mayorElectionNostr';
import { NSG_MAYOR_CANDIDATE_KIND, NSG_MAYOR_VOTE_KIND } from './constants';
import type { QuestState } from '../quests/types';

const MAYORS_HUT_FEED_KEY = ['mayors-hut-election'] as const;

/** Block vote publishes briefly after candidacy changes (avoids touch "ghost click" on new Vote buttons). */
export const MAYOR_VOTE_GESTURE_BLOCK_MS = 1000;

async function fetchMayorElection(
  nostr: {
    query: (
      f: ReturnType<typeof mayorCandidateFilter>[] | ReturnType<typeof mayorVoteFilter>[]
    ) => Promise<unknown[]>;
  }
): Promise<MayorElectionSnapshot> {
  const events = (await nostr.query([mayorCandidateFilter(), mayorVoteFilter()])) as NostrEvent[];
  const candidateEvents = events.filter((e) => e.kind === NSG_MAYOR_CANDIDATE_KIND);
  const voteEvents = events.filter((e) => e.kind === NSG_MAYOR_VOTE_KIND);
  return buildMayorElectionSnapshot(candidateEvents, voteEvents);
}

/** Avoid replacing a good cached snapshot when relays time out and return no rows. */
export function shouldRejectEmptyElectionRefresh(
  prev: MayorElectionSnapshot | undefined,
  next: MayorElectionSnapshot
): boolean {
  if (!prev) return false;
  const hadData = prev.candidates.length > 0 || prev.votes.length > 0;
  const gotNothing = next.candidates.length === 0 && next.votes.length === 0;
  return hadData && gotNothing;
}

export function useMayorsHut(args: {
  enabled: boolean;
  questState: QuestState;
  myPubkey: string | undefined;
}) {
  const { nostr } = useNostr();
  const { mutateAsync: publish } = useNostrPublish();
  const queryClient = useQueryClient();
  const voteGesturesBlockedRef = useRef(false);
  const [voteGesturesBlocked, setVoteGesturesBlocked] = useState(false);
  const unblockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayName = args.questState.playerName.trim() || 'Stranger';

  const blockVoteGesturesBriefly = useCallback(() => {
    voteGesturesBlockedRef.current = true;
    setVoteGesturesBlocked(true);
    if (unblockTimerRef.current) clearTimeout(unblockTimerRef.current);
    unblockTimerRef.current = setTimeout(() => {
      voteGesturesBlockedRef.current = false;
      setVoteGesturesBlocked(false);
      unblockTimerRef.current = null;
    }, MAYOR_VOTE_GESTURE_BLOCK_MS);
  }, []);

  useEffect(
    () => () => {
      if (unblockTimerRef.current) clearTimeout(unblockTimerRef.current);
    },
    []
  );

  const refreshFeed = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: MAYORS_HUT_FEED_KEY });
  }, [queryClient]);

  const feedQuery = useQuery({
    queryKey: MAYORS_HUT_FEED_KEY,
    queryFn: async () => {
      const prev = queryClient.getQueryData<MayorElectionSnapshot>(MAYORS_HUT_FEED_KEY);
      const snapshot = await fetchMayorElection(nostr);
      if (shouldRejectEmptyElectionRefresh(prev, snapshot)) {
        return prev ?? snapshot;
      }
      return snapshot;
    },
    enabled: args.enabled,
    staleTime: Infinity,
    retry: false,
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
    onMutate: () => blockVoteGesturesBriefly(),
    onSuccess: () => {
      blockVoteGesturesBriefly();
      refreshFeed();
    },
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
    onMutate: () => blockVoteGesturesBriefly(),
    onSuccess: () => {
      blockVoteGesturesBriefly();
      refreshFeed();
    },
  });

  const castVote = useMutation({
    mutationFn: async (candidatePubkey: string) => {
      if (!args.myPubkey) throw new Error('You must be logged in to vote.');
      if (voteGesturesBlockedRef.current) {
        throw new Error('Wait a moment before voting.');
      }
      await publish(
        buildMayorVoteDraft({
          candidatePubkey,
          voterName: displayName,
        })
      );
    },
    onSuccess: () => refreshFeed(),
  });

  const retractVote = useMutation({
    mutationFn: async () => {
      if (!args.myPubkey) throw new Error('You must be logged in to retract your vote.');
      await publish(
        buildMayorVoteWithdrawDraft({
          voterName: displayName,
        })
      );
    },
    onSuccess: () => refreshFeed(),
  });

  return {
    feedQuery,
    election,
    myCandidate,
    myActiveCandidacy,
    myVote,
    voteGesturesBlocked,
    runForMayor,
    withdrawFromElection,
    castVote,
    retractVote,
    refreshFeed,
    invalidateFeed: refreshFeed,
  };
}
