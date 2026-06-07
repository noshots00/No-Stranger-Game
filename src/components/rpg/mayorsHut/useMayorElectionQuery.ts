import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import {
  buildMayorElectionSnapshot,
  mayorCandidateFilter,
  mayorVoteFilter,
  mergeMayorElectionSnapshots,
  type MayorElectionSnapshot,
} from './mayorElectionNostr';
import { NSG_MAYOR_CANDIDATE_KIND, NSG_MAYOR_VOTE_KIND } from './constants';
import { keepQueryDataIfUnchanged, LEDGER_QUERY_OPTIONS } from '../ledgerQuery';

export const MAYORS_HUT_FEED_KEY = ['mayors-hut-election'] as const;

export async function fetchMayorElection(
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

export function useMayorElectionQuery(args: {
  enabled?: boolean;
  refetchOnMount?: boolean | 'always';
}) {
  const { nostr } = useNostr();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: MAYORS_HUT_FEED_KEY,
    queryFn: async () => {
      const prev = queryClient.getQueryData<MayorElectionSnapshot>(MAYORS_HUT_FEED_KEY);
      const snapshot = await fetchMayorElection(nostr);
      if (shouldRejectEmptyElectionRefresh(prev, snapshot)) {
        return prev ?? snapshot;
      }
      const merged = mergeMayorElectionSnapshots(prev, snapshot);
      return keepQueryDataIfUnchanged(prev, merged);
    },
    enabled: args.enabled ?? false,
    staleTime: LEDGER_QUERY_OPTIONS.staleTime,
    retry: LEDGER_QUERY_OPTIONS.retry,
    refetchOnMount: args.refetchOnMount ?? LEDGER_QUERY_OPTIONS.refetchOnMount,
    refetchOnReconnect: LEDGER_QUERY_OPTIONS.refetchOnReconnect,
    gcTime: LEDGER_QUERY_OPTIONS.gcTime,
  });
}
