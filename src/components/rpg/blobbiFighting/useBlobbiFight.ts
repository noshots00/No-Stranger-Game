import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNostr } from '@nostrify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';

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
  buildOpenRegistrationWithdrawDraft,
  findMatchForRegistration,
  findMyLatestMatch,
  findMyOpenRegistration,
  findOldestOpponentOpen,
  getConsumedRegistrationIds,
  isRegistrationConsumed,
  listActiveOpenRegistrations,
  myFighterInMatch,
  opponentFighterInMatch,
  parseBlobbiFightMatchResult,
  parseBlobbiFightOpenRegistration,
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
import { pubkeysEqual } from '@/lib/nostrPubkey';

const BLOBBI_FIGHT_FEED_KEY = ['blobbi-fight-feed'] as const;
/** Give relays time to index before replacing optimistic rows with a refetch. */
const RELAY_REFRESH_DELAY_MS = 8_000;

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
  ])) as NostrEvent[];

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

function buildLocalPendingOpen(
  selectedBlobbi: BlobbiSnapshot,
  pubkey: string,
  playerName: string
): BlobbiFightOpenRegistration {
  return {
    eventId: `local-pending:${pubkey}:${Date.now()}`,
    pubkey,
    ownerName: playerName,
    blobbiId: selectedBlobbi.id,
    blobbiName: selectedBlobbi.displayName,
    stage: selectedBlobbi.stage,
    health: Math.max(1, selectedBlobbi.health),
    createdAt: Math.floor(Date.now() / 1000),
  };
}

function mergeLocalPendingIntoFeed(
  base: Omit<BlobbiFightFeed, 'myOpen' | 'myLatestMatch'>,
  pendingOpen: BlobbiFightOpenRegistration | null,
  pendingMatch: BlobbiFightMatchResult | null
): Omit<BlobbiFightFeed, 'myOpen' | 'myLatestMatch'> {
  let { openRegistrations, matches, consumedRegistrationIds } = base;

  if (pendingMatch && !matches.some((m) => m.eventId === pendingMatch.eventId)) {
    matches = [pendingMatch, ...matches];
    consumedRegistrationIds = new Set([
      ...consumedRegistrationIds,
      pendingMatch.registrationEventId,
    ]);
    openRegistrations = openRegistrations.filter(
      (r) => r.eventId !== pendingMatch.registrationEventId
    );
  }

  if (pendingOpen && !findMyOpenRegistration(openRegistrations, pendingOpen.pubkey)) {
    openRegistrations = [...openRegistrations, pendingOpen].sort(
      (a, b) => a.createdAt - b.createdAt
    );
  }

  return { openRegistrations, matches, consumedRegistrationIds };
}

export async function publishFightMemoryForMatch(args: {
  publish: (draft: Omit<NostrEvent, 'id' | 'pubkey' | 'sig'>) => Promise<unknown>;
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

type RegisterResult =
  | { action: 'queued'; openEvent: NostrEvent }
  | { action: 'matched'; parsedMatch: BlobbiFightMatchResult | null };

export function useBlobbiFight(args: {
  enabled: boolean;
  myPubkey: string | undefined;
  ownerName: string;
  onAfterFeedRefresh?: () => void;
}) {
  const { enabled, myPubkey, ownerName, onAfterFeedRefresh } = args;
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutateAsync: publish } = useNostrPublish();
  const queryClient = useQueryClient();
  const resolveInFlightRef = useRef(false);
  const onAfterFeedRefreshRef = useRef(onAfterFeedRefresh);
  onAfterFeedRefreshRef.current = onAfterFeedRefresh;
  const relayRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localPendingOpen, setLocalPendingOpen] = useState<BlobbiFightOpenRegistration | null>(
    null
  );
  const [localPendingMatch, setLocalPendingMatch] = useState<BlobbiFightMatchResult | null>(null);
  const [isResolvingMatch, setIsResolvingMatch] = useState(false);
  const [lastResolveError, setLastResolveError] = useState<string | null>(null);

  const feedQuery = useQuery({
    queryKey: BLOBBI_FIGHT_FEED_KEY,
    queryFn: () => fetchBlobbiFightFeed(nostr),
    enabled: false,
    staleTime: Infinity,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  /** One relay fetch each time the pit opens (not interval polling). */
  const refetchFeedOnce = feedQuery.refetch;
  useEffect(() => {
    if (!enabled) return;
    void refetchFeedOnce();
  }, [enabled, refetchFeedOnce]);

  const feed = useMemo((): BlobbiFightFeed => {
    const base = feedQuery.data ?? {
      openRegistrations: [],
      matches: [],
      consumedRegistrationIds: new Set<string>(),
    };
    const merged = mergeLocalPendingIntoFeed(base, localPendingOpen, localPendingMatch);
    const myOpen = myPubkey ? findMyOpenRegistration(merged.openRegistrations, myPubkey) : undefined;
    const myLatestMatch = myPubkey ? findMyLatestMatch(merged.matches, myPubkey) : undefined;
    return { ...merged, myOpen, myLatestMatch };
  }, [feedQuery.data, myPubkey, localPendingOpen, localPendingMatch]);

  useEffect(() => {
    if (!feedQuery.data || !myPubkey) return;

    if (localPendingOpen) {
      const relayMy = findMyOpenRegistration(feedQuery.data.openRegistrations, myPubkey);
      if (relayMy) setLocalPendingOpen(null);
    }

    if (localPendingMatch) {
      const onRelay = feedQuery.data.matches.some(
        (m) =>
          m.eventId === localPendingMatch.eventId ||
          (matchInvolvesMyPubkey(m, myPubkey) &&
            Math.abs(m.atMs - localPendingMatch.atMs) < 60_000)
      );
      if (onRelay) setLocalPendingMatch(null);
    }
  }, [feedQuery.data, myPubkey, localPendingOpen, localPendingMatch]);

  useEffect(() => {
    return () => {
      if (relayRefreshTimerRef.current) clearTimeout(relayRefreshTimerRef.current);
    };
  }, []);

  const canInitiateMatch = useMemo(() => {
    if (!feed.myOpen || !myPubkey) return false;
    const opponent = findOldestOpponentOpen(feed.openRegistrations, myPubkey);
    if (!opponent) return false;
    if (isRegistrationConsumed(feed.consumedRegistrationIds, opponent.eventId)) return false;
    return shouldInitiateBlobbiMatch(feed.myOpen, opponent);
  }, [feed.consumedRegistrationIds, feed.myOpen, feed.openRegistrations, myPubkey]);

  const scheduleRelayRefresh = useCallback(() => {
    if (relayRefreshTimerRef.current) clearTimeout(relayRefreshTimerRef.current);
    relayRefreshTimerRef.current = setTimeout(() => {
      relayRefreshTimerRef.current = null;
      void queryClient.invalidateQueries({ queryKey: BLOBBI_FIGHT_FEED_KEY });
    }, RELAY_REFRESH_DELAY_MS);
  }, [queryClient]);

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

      if (isRegistrationConsumed(rawFeed.consumedRegistrationIds, opponent.eventId)) return;
      if (!shouldInitiateBlobbiMatch(myOpen, opponent)) return;

      resolveInFlightRef.current = true;
      setIsResolvingMatch(true);
      setLastResolveError(null);
      try {
        const parsedMatch = await publishBlobbiMatchFromOpenRegistration({
          publish,
          opponent,
          myOpen,
          myPubkey: user.pubkey,
        });
        if (parsedMatch) setLocalPendingMatch(parsedMatch);
        setLocalPendingOpen(null);
        await completeMatch(parsedMatch, user.pubkey);
        scheduleRelayRefresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Could not publish blobbi match.';
        setLastResolveError(message);
        console.warn('Blobbi match resolve failed.', error);
      } finally {
        resolveInFlightRef.current = false;
        setIsResolvingMatch(false);
        void queryClient.invalidateQueries({ queryKey: BLOBBI_FIGHT_FEED_KEY });
      }
    },
    [user?.pubkey, completeMatch, publish, queryClient, scheduleRelayRefresh]
  );

  const refreshFeed = useCallback(async () => {
    const result = await feedQuery.refetch();
    if (result.data) {
      await tryResolvePendingMatch(result.data);
    }
    onAfterFeedRefreshRef.current?.();
  }, [feedQuery, tryResolvePendingMatch]);

  const register = useMutation({
    mutationFn: async (selectedBlobbi: BlobbiSnapshot): Promise<RegisterResult> => {
      if (!user?.pubkey) throw new Error('You must be logged in to find a match.');
      if (!selectedBlobbi) throw new Error('Select a Blobbi first.');

      const playerName = ownerName.trim() || 'Stranger';

      const latest = await fetchBlobbiFightFeed(nostr);
      const myOpen = findMyOpenRegistration(latest.openRegistrations, user.pubkey);
      if (myOpen) throw new Error('Already waiting for an opponent.');

      const opponent = findOldestOpponentOpen(latest.openRegistrations, user.pubkey);
      if (opponent) {
        if (isRegistrationConsumed(latest.consumedRegistrationIds, opponent.eventId)) {
          return {
            action: 'matched',
            parsedMatch: findMatchForRegistration(latest.matches, opponent.eventId) ?? null,
          };
        }

        const parsedMatch = await publishBlobbiMatchFromBlobbi({
          publish,
          opponent,
          selectedBlobbi,
          myPubkey: user.pubkey,
          playerName,
        });
        await completeMatch(parsedMatch, user.pubkey);
        return { action: 'matched', parsedMatch };
      }

      const openEvent = (await publish(
        buildOpenRegistrationDraft({
          ownerName: playerName,
          blobbiId: selectedBlobbi.id,
          blobbiName: selectedBlobbi.displayName,
          stage: selectedBlobbi.stage,
          health: Math.max(1, selectedBlobbi.health),
        })
      )) as NostrEvent;

      await relaySettleDelay();
      const afterQueue = await fetchBlobbiFightFeed(nostr);
      const myOpenAfter = findMyOpenRegistration(afterQueue.openRegistrations, user.pubkey);
      const opponentAfter = findOldestOpponentOpen(afterQueue.openRegistrations, user.pubkey);
      if (myOpenAfter && opponentAfter) {
        if (isRegistrationConsumed(afterQueue.consumedRegistrationIds, opponentAfter.eventId)) {
          return {
            action: 'matched',
            parsedMatch:
              findMatchForRegistration(afterQueue.matches, opponentAfter.eventId) ?? null,
          };
        }
        if (shouldInitiateBlobbiMatch(myOpenAfter, opponentAfter)) {
          const parsedMatch = await publishBlobbiMatchFromOpenRegistration({
            publish,
            opponent: opponentAfter,
            myOpen: myOpenAfter,
            myPubkey: user.pubkey,
          });
          await completeMatch(parsedMatch, user.pubkey);
          return { action: 'matched', parsedMatch };
        }
      }

      return { action: 'queued', openEvent };
    },
    onMutate: (selectedBlobbi) => {
      if (!user?.pubkey) return;
      const playerName = ownerName.trim() || 'Stranger';
      setLocalPendingMatch(null);
      setLastResolveError(null);
      setLocalPendingOpen(buildLocalPendingOpen(selectedBlobbi, user.pubkey, playerName));
    },
    onSuccess: (result) => {
      if (result.action === 'matched') {
        setLocalPendingOpen(null);
        if (result.parsedMatch) setLocalPendingMatch(result.parsedMatch);
      } else {
        const parsed = parseBlobbiFightOpenRegistration(result.openEvent);
        if (parsed) setLocalPendingOpen(parsed);
      }
      scheduleRelayRefresh();
      void refreshFeed();
    },
    onError: () => {
      setLocalPendingOpen(null);
      setLocalPendingMatch(null);
    },
  });

  const withdrawFromQueue = useMutation({
    mutationFn: async () => {
      if (!user?.pubkey) throw new Error('You must be logged in to leave the queue.');
      const playerName = ownerName.trim() || 'Stranger';

      const latest = await fetchBlobbiFightFeed(nostr);
      const myOpen = findMyOpenRegistration(latest.openRegistrations, user.pubkey);
      if (!myOpen) throw new Error('Not in queue.');

      await publish(
        buildOpenRegistrationWithdrawDraft({
          ownerName: playerName,
        })
      );
      await relaySettleDelay();
    },
    onMutate: () => {
      setLocalPendingOpen(null);
      setLocalPendingMatch(null);
      setLastResolveError(null);
    },
    onSuccess: () => {
      scheduleRelayRefresh();
      void feedQuery.refetch();
    },
    onError: () => {
      void feedQuery.refetch();
    },
  });

  return {
    feedQuery,
    feed,
    register,
    withdrawFromQueue,
    refreshFeed,
    isResolvingMatch,
    canInitiateMatch,
    lastResolveError,
  };
}

function matchInvolvesMyPubkey(match: BlobbiFightMatchResult, myPubkey: string): boolean {
  return (
    pubkeysEqual(match.fighterA.ownerPubkey, myPubkey) ||
    pubkeysEqual(match.fighterB.ownerPubkey, myPubkey)
  );
}
