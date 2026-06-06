import { useCallback, useMemo } from 'react';
import { useNostr } from '@nostrify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { getCombatRating, rollFightWinner } from './combatRating';
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
  type ArenaMatchResult,
  type ArenaOpenRegistration,
} from './arenaNostr';
import { buildMatchSummaryContent, winProbabilityForWinner } from './arenaRecord';
import type { QuestState } from '../quests/types';

const ARENA_FEED_KEY = ['arena-tournament-feed'] as const;

export type ArenaTournamentFeed = {
  openRegistrations: ArenaOpenRegistration[];
  matches: ArenaMatchResult[];
  consumedRegistrationIds: Set<string>;
  myOpen?: ArenaOpenRegistration;
};

async function fetchArenaFeed(nostr: { query: (f: ReturnType<typeof arenaOpenFilter>[]) => Promise<unknown[]> }): Promise<ArenaTournamentFeed> {
  const [openEvents, matchEvents] = await Promise.all([
    nostr.query([arenaOpenFilter()]),
    nostr.query([arenaMatchFilter()]),
  ]);

  const matches = (matchEvents as import('@nostrify/nostrify').NostrEvent[])
    .map(parseArenaMatchResult)
    .filter((m): m is ArenaMatchResult => m !== null)
    .sort((a, b) => b.atMs - a.atMs);

  const consumedRegistrationIds = getConsumedRegistrationIds(matches);
  const openRegistrations = listActiveOpenRegistrations(
    openEvents as import('@nostrify/nostrify').NostrEvent[],
    consumedRegistrationIds
  );

  return {
    openRegistrations,
    matches,
    consumedRegistrationIds,
  };
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
    const myOpen = args.myPubkey
      ? findMyOpenRegistration(base.openRegistrations, args.myPubkey)
      : undefined;
    return { ...base, myOpen };
  }, [feedQuery.data, args.myPubkey]);

  const invalidateFeed = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ARENA_FEED_KEY });
  }, [queryClient]);

  const register = useMutation({
    mutationFn: async () => {
      if (!user?.pubkey) throw new Error('You must be logged in to register.');
      const playerName = args.questState.playerName.trim() || 'Stranger';
      const combatRating = getCombatRating(args.questState);

      const latest = await fetchArenaFeed(nostr);
      const myOpen = findMyOpenRegistration(latest.openRegistrations, user.pubkey);
      if (myOpen) {
        throw new Error('Already waiting for an opponent.');
      }

      const opponent = findOldestOpponentOpen(latest.openRegistrations, user.pubkey);
      if (opponent) {
        const me = { pubkey: user.pubkey, name: playerName, combatRating };
        const winnerPubkey = rollFightWinner(me, opponent);
        const fighterA = opponent;
        const fighterB = me;
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
        await publish(
          buildMatchResultDraft({
            fighterA: opponent,
            fighterB: me,
            winnerPubkey,
            registrationEventId: opponent.eventId,
            summary,
            winProbabilityForWinner: prob,
          })
        );
        return { action: 'matched' as const };
      }

      await publish(
        buildOpenRegistrationDraft({
          playerName,
          combatRating,
        })
      );
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
