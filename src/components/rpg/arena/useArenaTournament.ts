import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNostr } from '@nostrify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { getCombatRating, rollFightWinner } from './combatRating';
import { buildArenaFighterSnapshot, simulateArenaMatch } from './arenaCombat';
import {
  arenaMatchFilter,
  arenaOpenFilter,
  buildMatchResultDraft,
  buildOpenRegistrationDraft,
  findMyOpenRegistration,
  findOldestOpponentOpen,
  getConsumedRegistrationIds,
  listActiveOpenRegistrations,
  parseArenaMatchResult,
  parseArenaOpenRegistration,
  type ArenaFighterSnapshot,
  type ArenaMatchResult,
  type ArenaOpenRegistration,
} from './arenaNostr';
import { buildMatchSummaryContent, winProbabilityForWinner } from './arenaRecord';
import type { QuestState } from '../quests/types';
import { NSG_ARENA_MATCH_KIND, NSG_ARENA_OPEN_KIND } from './constants';

const ARENA_FEED_KEY = ['arena-tournament-feed'] as const;
/** Give relays time to index before replacing good-faith local rows with a refetch. */
const RELAY_REFRESH_DELAY_MS = 8_000;

export type ArenaTournamentFeed = {
  openRegistrations: ArenaOpenRegistration[];
  matches: ArenaMatchResult[];
  consumedRegistrationIds: Set<string>;
  myOpen?: ArenaOpenRegistration;
};

async function fetchArenaFeed(nostr: { query: (filters: import('@nostrify/nostrify').NostrFilter[]) => Promise<unknown[]> }): Promise<ArenaTournamentFeed> {
  const allEvents = (await nostr.query([
    arenaOpenFilter(),
    arenaMatchFilter(),
  ])) as import('@nostrify/nostrify').NostrEvent[];

  const openEvents = allEvents.filter(e => e.kind === NSG_ARENA_OPEN_KIND);
  const matchEvents = allEvents.filter(e => e.kind === NSG_ARENA_MATCH_KIND);

  const matches = matchEvents
    .map(parseArenaMatchResult)
    .filter((m): m is ArenaMatchResult => m !== null)
    .sort((a, b) => b.atMs - a.atMs);

  const consumedRegistrationIds = getConsumedRegistrationIds(matches);
  const openRegistrations = listActiveOpenRegistrations(
    openEvents,
    consumedRegistrationIds
  );

  return {
    openRegistrations,
    matches,
    consumedRegistrationIds,
  };
}

function toArenaFighterRow(
  pubkey: string,
  name: string,
  combatRating: number
): ArenaFighterSnapshot {
  return { pubkey, name, combatRating };
}

type RegisterResult =
  | { action: 'queued'; openEvent: NostrEvent }
  | { action: 'matched'; matchEvent: NostrEvent };

function buildLocalPendingOpen(
  questState: QuestState,
  pubkey: string
): ArenaOpenRegistration {
  const playerName = questState.playerName.trim() || 'Stranger';
  return {
    eventId: `local-pending:${pubkey}:${Date.now()}`,
    pubkey,
    name: playerName,
    combatRating: getCombatRating(questState),
    createdAt: Math.floor(Date.now() / 1000),
    fighterSnapshot: buildArenaFighterSnapshot(questState, pubkey),
  };
}

function mergeLocalPendingIntoFeed(
  base: ArenaTournamentFeed,
  pendingOpen: ArenaOpenRegistration | null,
  pendingMatch: ArenaMatchResult | null
): ArenaTournamentFeed {
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

export function useArenaTournament(args: {
  enabled: boolean;
  questState: QuestState;
  myPubkey: string | undefined;
}) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutateAsync: publish } = useNostrPublish();
  const queryClient = useQueryClient();
  const [localPendingOpen, setLocalPendingOpen] = useState<ArenaOpenRegistration | null>(null);
  const [localPendingMatch, setLocalPendingMatch] = useState<ArenaMatchResult | null>(null);
  const relayRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const feedQuery = useQuery({
    queryKey: ARENA_FEED_KEY,
    queryFn: () => fetchArenaFeed(nostr),
    enabled: args.enabled,
    staleTime: Infinity,
  });

  const feed = useMemo((): ArenaTournamentFeed & { myOpen?: ArenaOpenRegistration } => {
    const base = feedQuery.data ?? {
      openRegistrations: [],
      matches: [],
      consumedRegistrationIds: new Set<string>(),
    };
    const merged = mergeLocalPendingIntoFeed(base, localPendingOpen, localPendingMatch);
    const myOpen = args.myPubkey
      ? findMyOpenRegistration(merged.openRegistrations, args.myPubkey)
      : undefined;
    return { ...merged, myOpen };
  }, [feedQuery.data, args.myPubkey, localPendingOpen, localPendingMatch]);

  useEffect(() => {
    if (!feedQuery.data || !args.myPubkey) return;

    if (localPendingOpen) {
      const relayMy = findMyOpenRegistration(feedQuery.data.openRegistrations, args.myPubkey);
      if (relayMy) setLocalPendingOpen(null);
    }

    if (localPendingMatch) {
      const onRelay = feedQuery.data.matches.some(
        (m) =>
          m.eventId === localPendingMatch.eventId ||
          ((m.fighterA.pubkey === args.myPubkey || m.fighterB.pubkey === args.myPubkey) &&
            Math.abs(m.atMs - localPendingMatch.atMs) < 60_000)
      );
      if (onRelay) setLocalPendingMatch(null);
    }
  }, [feedQuery.data, args.myPubkey, localPendingOpen, localPendingMatch]);

  useEffect(() => {
    return () => {
      if (relayRefreshTimerRef.current) clearTimeout(relayRefreshTimerRef.current);
    };
  }, []);

  const invalidateFeed = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ARENA_FEED_KEY });
  }, [queryClient]);

  const scheduleRelayRefresh = useCallback(() => {
    if (relayRefreshTimerRef.current) clearTimeout(relayRefreshTimerRef.current);
    relayRefreshTimerRef.current = setTimeout(() => {
      relayRefreshTimerRef.current = null;
      invalidateFeed();
    }, RELAY_REFRESH_DELAY_MS);
  }, [invalidateFeed]);

  const register = useMutation({
    mutationFn: async (): Promise<RegisterResult> => {
      if (!user?.pubkey) throw new Error('You must be logged in to register.');
      const playerName = args.questState.playerName.trim() || 'Stranger';
      const combatRating = getCombatRating(args.questState);
      const myFighterSnapshot = buildArenaFighterSnapshot(args.questState, user.pubkey);

      const latest = await fetchArenaFeed(nostr);
      const myOpen = findMyOpenRegistration(latest.openRegistrations, user.pubkey);
      if (myOpen) {
        throw new Error('Already waiting for an opponent.');
      }

      const opponent = findOldestOpponentOpen(latest.openRegistrations, user.pubkey);
      if (opponent) {
        const opponentSnapshot = opponent.fighterSnapshot;
        const fighterA = toArenaFighterRow(opponent.pubkey, opponent.name, opponent.combatRating);
        const fighterB = toArenaFighterRow(user.pubkey, playerName, combatRating);

        if (opponentSnapshot) {
          const payload = simulateArenaMatch(opponentSnapshot, myFighterSnapshot);
          const winnerPubkey = payload.winner;
          const winnerFighter = winnerPubkey === opponent.pubkey ? fighterA : fighterB;
          const loserFighter = winnerPubkey === opponent.pubkey ? fighterB : fighterA;
          const prob = 0.5;
          const summary = buildMatchSummaryContent(
            winnerFighter.name,
            loserFighter.name,
            winnerFighter.combatRating,
            loserFighter.combatRating,
            prob
          );
          payload.summary = summary;
          const matchEvent = await publish(
            buildMatchResultDraft({
              fighterA,
              fighterB,
              winnerPubkey,
              registrationEventId: opponent.eventId,
              summary,
              winProbabilityForWinner: prob,
              matchPayload: payload,
            })
          );
          return { action: 'matched', matchEvent };
        }

        const me = { pubkey: user.pubkey, name: playerName, combatRating };
        const winnerPubkey = rollFightWinner(me, opponent);
        const winnerFighter = winnerPubkey === opponent.pubkey ? opponent : me;
        const loserFighter = winnerPubkey === opponent.pubkey ? me : opponent;
        const prob = winProbabilityForWinner(winnerPubkey, fighterA, fighterB);
        const summary = buildMatchSummaryContent(
          winnerFighter.name,
          loserFighter.name,
          winnerFighter.combatRating,
          loserFighter.combatRating,
          prob
        );
        const matchEvent = await publish(
          buildMatchResultDraft({
            fighterA,
            fighterB,
            winnerPubkey,
            registrationEventId: opponent.eventId,
            summary,
            winProbabilityForWinner: prob,
          })
        );
        return { action: 'matched', matchEvent };
      }

      const openEvent = await publish(
        buildOpenRegistrationDraft({
          playerName,
          combatRating,
          fighterSnapshot: myFighterSnapshot,
        })
      );
      return { action: 'queued', openEvent };
    },
    onMutate: () => {
      if (!user?.pubkey) return;
      setLocalPendingMatch(null);
      setLocalPendingOpen(buildLocalPendingOpen(args.questState, user.pubkey));
    },
    onSuccess: (result) => {
      if (result.action === 'queued') {
        const parsed = parseArenaOpenRegistration(result.openEvent);
        if (parsed) setLocalPendingOpen(parsed);
      } else {
        setLocalPendingOpen(null);
        const parsed = parseArenaMatchResult(result.matchEvent);
        if (parsed) setLocalPendingMatch(parsed);
      }
      scheduleRelayRefresh();
    },
    onError: () => {
      setLocalPendingOpen(null);
      setLocalPendingMatch(null);
    },
  });

  return {
    feedQuery,
    feed,
    register,
    invalidateFeed,
  };
}
