import { useCallback, useMemo, useRef, useState } from 'react';
import { useNostr } from '@nostrify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { pubkeysEqual } from '@/lib/nostrPubkey';

import { buildFightMemoryDraft } from './blobbiCareerNostr';
import { buildFightMemoryContent } from './blobbiCombat';
import {
  publishBlobbiMatchFromBlobbi,
  publishBlobbiMatchFromOpenRegistration,
} from './blobbiMatchResolve';
import {
  blobbiFightMatchFilter,
  blobbiFightOpenFilter,
  buildOpenRegistrationDraft,
  findMyLatestMatch,
  findMyOpenRegistration,
  findOldestOpponentOpen,
  getConsumedRegistrationIds,
  listActiveOpenRegistrations,
  matchAlreadyExistsBetween,
  myFighterInMatch,
  opponentFighterInMatch,
  parseBlobbiFightMatchResult,
  shouldInitiateBlobbiMatch,
  type BlobbiFightMatchResult,
  type BlobbiFightOpenRegistration,
} from './blobbiFightNostr';
import type { BlobbiSnapshot } from './blobbiStateNostr';
import {
  BLOBBI_RELAY_SETTLE_MS,
  NSG_BLOBBI_FIGHT_MATCH_KIND,
  NSG_BLOBBI_FIGHT_OPEN_KIND,
} from './constants';

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
  myLatestMatch?: BlobbiFightMatchResult;
};

async function fetchBlobbiFightFeed(nostr: {
  query: (filters: import('@nostrify/nostrify').NostrFilter[]) => Promise<unknown[]>;
}): Promise<Omit<BlobbiFightFeed, 'myOpen' | 'myLatestMatch'>> {
  const allEvents = (await nostr.query([
    blobbiFightOpenFilter(),
    blobbiFightMatchFilter(),
  ])) as import('@nostrify/nostrify').NostrEvent[];

  const openEvents = allEvents.filter((e) => e.kind === NSG_BLOBBI_FIGHT_OPEN_KIND);
  const matchEvents = allEvents.filter((e) => e.kind === NSG_BLOBBI_FIGHT_MATCH_KIND);

  const matches = matchEvents
    .map(parseBlobbiFightMatchResult)
    .filter((m): m is BlobbiFightMatchResult => m !== null)
    .sort((a, b) => b.atMs - a.atMs);

  const consumedRegistrationIds = getConsumedRegistrationIds(matches);
  const openRegistrations = listActiveOpenRegistrations(
    openEvents,
    consumedRegistrationIds,
    matches
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

  const won = pubkeysEqual(args.match.winnerOwnerPubkey, args.myPubkey);
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
  onAfterFeedRefresh?: () => void;
}) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutateAsync: publish } = useNostrPublish();
  const queryClient = useQueryClient();
  const resolveInFlightRef = useRef(false);
  const [isResolvingMatch, setIsResolvingMatch] = useState(false);

  const feedQuery = useQuery({
    queryKey: BLOBBI_FIGHT_FEED_KEY,
    queryFn: () => fetchBlobbiFightFeed(nostr),
    enabled: false,
    staleTime: Infinity,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
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
    const myLatestMatch = args.myPubkey
      ? findMyLatestMatch(base.matches, args.myPubkey)
      : undefined;
    return { ...base, myOpen, myLatestMatch };
  }, [feedQuery.data, args.myPubkey]);

  const completeMatch = useCallback(
    async (parsedMatch: BlobbiFightMatchResult | null, myPubkey: string) => {
      if (parsedMatch) {
        await publishFightMemoryForMatch({
          publish,
          match: parsedMatch,
          myPubkey,
        });
      }
      await relaySettleDelay();
    },
    [publish]
  );

  const tryResolvePendingMatch = useCallback(
    async (rawFeed: Omit<BlobbiFightFeed, 'myOpen' | 'myLatestMatch'>) => {
      if (!user?.pubkey || resolveInFlightRef.current) return;

      const myOpen = findMyOpenRegistration(rawFeed.openRegistrations, user.pubkey);
      if (!myOpen) return;

      const opponent = findOldestOpponentOpen(rawFeed.openRegistrations, user.pubkey);
      if (!opponent) return;

      if (matchAlreadyExistsBetween(rawFeed.matches, user.pubkey, opponent.pubkey)) return;
      if (!shouldInitiateBlobbiMatch(myOpen, opponent)) return;

      resolveInFlightRef.current = true;
      setIsResolvingMatch(true);
      try {
        const parsedMatch = await publishBlobbiMatchFromOpenRegistration({
          publish,
          opponent,
          myOpen,
          myPubkey: user.pubkey,
        });
        await completeMatch(parsedMatch, user.pubkey);
      } catch (error) {
        console.warn('Blobbi match resolve failed.', error);
      } finally {
        resolveInFlightRef.current = false;
        setIsResolvingMatch(false);
        void queryClient.invalidateQueries({ queryKey: BLOBBI_FIGHT_FEED_KEY });
      }
    },
    [user?.pubkey, completeMatch, publish, queryClient]
  );

  const refreshFeed = useCallback(async () => {
    const result = await feedQuery.refetch();
    if (result.data) {
      await tryResolvePendingMatch(result.data);
    }
    args.onAfterFeedRefresh?.();
  }, [feedQuery, tryResolvePendingMatch, args.onAfterFeedRefresh]);

  const register = useMutation({
    mutationFn: async (selectedBlobbi: BlobbiSnapshot) => {
      if (!user?.pubkey) throw new Error('You must be logged in to find a match.');
      if (!selectedBlobbi) throw new Error('Select a Blobbi first.');

      const playerName = args.ownerName.trim() || 'Stranger';

      const latest = await fetchBlobbiFightFeed(nostr);
      const myOpen = findMyOpenRegistration(latest.openRegistrations, user.pubkey);
      if (myOpen) throw new Error('Already waiting for an opponent.');

      const opponent = findOldestOpponentOpen(latest.openRegistrations, user.pubkey);
      if (opponent) {
        if (matchAlreadyExistsBetween(latest.matches, user.pubkey, opponent.pubkey)) {
          await relaySettleDelay();
          return { action: 'matched' as const };
        }

        const parsedMatch = await publishBlobbiMatchFromBlobbi({
          publish,
          opponent,
          selectedBlobbi,
          myPubkey: user.pubkey,
          playerName,
        });
        await completeMatch(parsedMatch, user.pubkey);
        return { action: 'matched' as const };
      }

      const me = selectedBlobbi;
      await publish(
        buildOpenRegistrationDraft({
          ownerName: playerName,
          blobbiId: me.id,
          blobbiName: me.displayName,
          stage: me.stage,
          health: Math.max(1, me.health),
        })
      );
      await relaySettleDelay();
      return { action: 'queued' as const };
    },
    onSuccess: () => {
      void refreshFeed();
    },
  });

  return {
    feedQuery,
    feed,
    register,
    refreshFeed,
    isResolvingMatch,
  };
}
