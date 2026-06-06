import { useCallback, useMemo } from 'react';
import { useNostr } from '@nostrify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';

import { buildFightMemoryDraft } from './blobbiCareerNostr';
import {
  blobbiToFighter,
  buildFightMemoryContent,
  buildMatchSummaryContent,
  getWinProbability,
  rollBlobbiWinner,
} from './blobbiCombat';
import {
  blobbiFightMatchFilter,
  blobbiFightOpenFilter,
  buildMatchResultDraft,
  buildOpenRegistrationDraft,
  findMyOpenRegistration,
  findOldestOpponentOpen,
  getConsumedRegistrationIds,
  listActiveOpenRegistrations,
  myFighterInMatch,
  opponentFighterInMatch,
  parseBlobbiFightMatchResult,
  type BlobbiFightMatchResult,
  type BlobbiFightOpenRegistration,
} from './blobbiFightNostr';
import type { BlobbiSnapshot } from './blobbiStateNostr';
import { BLOBBI_RELAY_SETTLE_MS } from './constants';

const BLOBBI_FIGHT_FEED_KEY = ['blobbi-fight-feed'] as const;

function relaySettleDelay(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, BLOBBI_RELAY_SETTLE_MS);
  });
}

export type BlobbiFightFeed = {
  openRegistrations: BlobbiFightOpenRegistration[];
  matches: BlobbiFightMatchResult[];
  consumedRegistrationIds: Set<string>;
  myOpen?: BlobbiFightOpenRegistration;
};

async function fetchBlobbiFightFeed(nostr: {
  query: (f: ReturnType<typeof blobbiFightOpenFilter>[]) => Promise<unknown[]>;
}): Promise<BlobbiFightFeed> {
  const [openEvents, matchEvents] = await Promise.all([
    nostr.query([blobbiFightOpenFilter()]),
    nostr.query([blobbiFightMatchFilter()]),
  ]);

  const matches = (matchEvents as import('@nostrify/nostrify').NostrEvent[])
    .map(parseBlobbiFightMatchResult)
    .filter((m): m is BlobbiFightMatchResult => m !== null)
    .sort((a, b) => b.atMs - a.atMs);

  const consumedRegistrationIds = getConsumedRegistrationIds(matches);
  const openRegistrations = listActiveOpenRegistrations(
    openEvents as import('@nostrify/nostrify').NostrEvent[],
    consumedRegistrationIds
  );

  return { openRegistrations, matches, consumedRegistrationIds };
}

export async function publishFightMemoryForMatch(args: {
  publish: (draft: Omit<import('@nostrify/nostrify').NostrEvent, 'id' | 'pubkey' | 'sig'>) => Promise<unknown>;
  match: BlobbiFightMatchResult;
  myPubkey: string;
}): Promise<void> {
  const me = myFighterInMatch(args.match, args.myPubkey);
  const opponent = opponentFighterInMatch(args.match, args.myPubkey);
  if (!me || !opponent) return;

  const won = args.match.winnerOwnerPubkey === args.myPubkey;
  await args.publish(
    buildFightMemoryDraft({
      blobbiId: me.blobbiId,
      blobbiName: me.blobbiName,
      won,
      opponentBlobbiId: opponent.blobbiId,
      opponentName: opponent.blobbiName,
      nsgMatchId: args.match.eventId,
      content: buildFightMemoryContent(me.blobbiName, won, opponent.blobbiName),
    })
  );
}

export function useBlobbiFight(args: {
  enabled: boolean;
  myPubkey: string | undefined;
  ownerName: string;
}) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutateAsync: publish } = useNostrPublish();
  const queryClient = useQueryClient();

  const feedQuery = useQuery({
    queryKey: BLOBBI_FIGHT_FEED_KEY,
    queryFn: () => fetchBlobbiFightFeed(nostr),
    enabled: args.enabled,
    staleTime: Infinity,
  });

  const feed = useMemo((): BlobbiFightFeed => {
    const base = feedQuery.data ?? {
      openRegistrations: [],
      matches: [],
      consumedRegistrationIds: new Set<string>(),
    };
    const myOpen = args.myPubkey
      ? findMyOpenRegistration(base.openRegistrations, args.myPubkey)
      : undefined;
    return { ...base, myOpen };
  }, [feedQuery.data, args.myPubkey]);

  const invalidateFeed = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: BLOBBI_FIGHT_FEED_KEY });
  }, [queryClient]);

  const register = useMutation({
    mutationFn: async (selectedBlobbi: BlobbiSnapshot) => {
      if (!user?.pubkey) throw new Error('You must be logged in to find a match.');
      if (!selectedBlobbi) throw new Error('Select a Blobbi first.');

      const playerName = args.ownerName.trim() || 'Stranger';
      const me = blobbiToFighter(selectedBlobbi, user.pubkey, playerName);

      const latest = await fetchBlobbiFightFeed(nostr);
      const myOpen = findMyOpenRegistration(latest.openRegistrations, user.pubkey);
      if (myOpen) throw new Error('Already waiting for an opponent.');

      const opponent = findOldestOpponentOpen(latest.openRegistrations, user.pubkey);
      if (opponent) {
        const opponentFighter = {
          ownerPubkey: opponent.pubkey,
          ownerName: opponent.ownerName,
          blobbiId: opponent.blobbiId,
          blobbiName: opponent.blobbiName,
          stage: opponent.stage,
          health: Math.max(1, opponent.health),
        };
        const fighterA = opponentFighter;
        const fighterB = me;
        const winnerOwnerPubkey = rollBlobbiWinner(fighterA, fighterB);
        const winnerFighter = winnerOwnerPubkey === fighterA.ownerPubkey ? fighterA : fighterB;
        const loserFighter = winnerOwnerPubkey === fighterA.ownerPubkey ? fighterB : fighterA;
        const prob = getWinProbability(winnerFighter.health, loserFighter.health);
        const summary = buildMatchSummaryContent(
          winnerFighter.blobbiName,
          loserFighter.blobbiName,
          winnerFighter.health,
          loserFighter.health,
          prob
        );

        const matchDraft = buildMatchResultDraft({
          fighterA,
          fighterB: me,
          winnerOwnerPubkey,
          registrationEventId: opponent.eventId,
          summary,
          winProbabilityForWinner: prob,
        });
        const matchEvent = await publish(matchDraft);

        const parsedMatch = parseBlobbiFightMatchResult(
          matchEvent as import('@nostrify/nostrify').NostrEvent
        );
        if (parsedMatch) {
          await publishFightMemoryForMatch({
            publish,
            match: parsedMatch,
            myPubkey: user.pubkey,
          });
        }

        await relaySettleDelay();
        return { action: 'matched' as const };
      }

      await publish(
        buildOpenRegistrationDraft({
          ownerName: playerName,
          blobbiId: me.blobbiId,
          blobbiName: me.blobbiName,
          stage: me.stage,
          health: me.health,
        })
      );
      await relaySettleDelay();
      return { action: 'queued' as const };
    },
    onSuccess: () => invalidateFeed(),
  });

  return {
    feedQuery,
    feed,
    register,
    invalidateFeed,
  };
}
