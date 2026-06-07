import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import {
  buildMayorCandidateDraft,
  buildMayorVoteDraft,
  buildMayorVoteWithdrawDraft,
  buildMayorElectionSnapshot,
  applyMayorElectionEventToSnapshot,
} from './mayorElectionNostr';
import { MAYORS_HUT_FEED_KEY, useMayorElectionQuery } from './useMayorElectionQuery';
import type { QuestState } from '../quests/types';

/** Block vote publishes briefly after candidacy changes (avoids touch "ghost click" on new Vote buttons). */
export const MAYOR_VOTE_GESTURE_BLOCK_MS = 1000;

export { shouldRejectEmptyElectionRefresh } from './useMayorElectionQuery';

export function useMayorsHut(args: {
  enabled: boolean;
  questState: QuestState;
  myPubkey: string | undefined;
}) {
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

  const feedQuery = useMayorElectionQuery({ enabled: false });
  const townHallFeedStartedRef = useRef(false);

  useEffect(() => {
    if (!args.enabled) {
      townHallFeedStartedRef.current = false;
      return;
    }
    if (townHallFeedStartedRef.current) return;
    townHallFeedStartedRef.current = true;
    void feedQuery.refetch();
  }, [args.enabled, feedQuery.refetch]);

  const refreshFeed = useCallback(() => {
    void feedQuery.refetch();
  }, [feedQuery]);

  const applyLocalElectionEvent = useCallback(
    (event: NostrEvent) => {
      queryClient.setQueryData(MAYORS_HUT_FEED_KEY, (prev) =>
        applyMayorElectionEventToSnapshot(
          prev ?? buildMayorElectionSnapshot([], []),
          event
        )
      );
    },
    [queryClient]
  );

  const syncElectionAfterPublish = useCallback(
    (event: NostrEvent) => {
      applyLocalElectionEvent(event);
      window.setTimeout(() => {
        void feedQuery.refetch();
      }, 2500);
    },
    [applyLocalElectionEvent, feedQuery]
  );

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
      return publish(
        buildMayorCandidateDraft({
          candidateName: displayName,
          status: 'active',
        })
      );
    },
    onMutate: () => blockVoteGesturesBriefly(),
    onSuccess: (event) => {
      blockVoteGesturesBriefly();
      syncElectionAfterPublish(event);
    },
  });

  const withdrawFromElection = useMutation({
    mutationFn: async () => {
      if (!args.myPubkey) throw new Error('You must be logged in to withdraw.');
      return publish(
        buildMayorCandidateDraft({
          candidateName: displayName,
          status: 'withdrawn',
        })
      );
    },
    onMutate: () => blockVoteGesturesBriefly(),
    onSuccess: (event) => {
      blockVoteGesturesBriefly();
      syncElectionAfterPublish(event);
    },
  });

  const castVote = useMutation({
    mutationFn: async (candidatePubkey: string) => {
      if (!args.myPubkey) throw new Error('You must be logged in to vote.');
      if (voteGesturesBlockedRef.current) {
        throw new Error('Wait a moment before voting.');
      }
      return publish(
        buildMayorVoteDraft({
          candidatePubkey,
          voterName: displayName,
        })
      );
    },
    onSuccess: (event) => syncElectionAfterPublish(event),
  });

  const retractVote = useMutation({
    mutationFn: async () => {
      if (!args.myPubkey) throw new Error('You must be logged in to retract your vote.');
      return publish(
        buildMayorVoteWithdrawDraft({
          voterName: displayName,
        })
      );
    },
    onSuccess: (event) => syncElectionAfterPublish(event),
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
