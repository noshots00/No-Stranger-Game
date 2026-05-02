import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { NSG_QUEST_STATE_D_TAG, NSG_QUEST_STATE_KIND, parseQuestCheckpointPayload } from '../gameProfile';
import { extractFollowPubkeysFromContactList, truncatePlaintext } from '../social/socialTags';
import { CHARACTER_START_D_TAG, CHARACTER_START_KIND, FOLLOW_LIST_KIND } from '../constants';
import { findFirstRememberedCheckpoint } from '../helpers';

export function useSocialQueries() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  const socialQuery = useQuery({
    queryKey: ['rpg-social-presence', user?.pubkey ?? 'anonymous'],
    enabled: Boolean(user),
    queryFn: async () => {
      const loginEvents = await nostr.query([
        {
          kinds: [CHARACTER_START_KIND],
          '#d': [CHARACTER_START_D_TAG],
          '#t': ['no-stranger-game'],
          limit: 200,
        },
      ]);

      const playerPubkeys = Array.from(new Set(loginEvents.map((event) => event.pubkey)));
      if (!user?.pubkey || playerPubkeys.length === 0) {
        return {
          totalPlayers: playerPubkeys.length,
          kindredSpirits: 0,
          kindredPubkeys: [] as string[],
        };
      }

      const contactListEvents = await nostr.query([
        {
          kinds: [FOLLOW_LIST_KIND],
          authors: Array.from(new Set([user.pubkey, ...playerPubkeys])),
          limit: Math.max(20, playerPubkeys.length + 5),
        },
      ]);

      const latestByAuthor = new Map<string, NostrEvent>();
      contactListEvents.forEach((event) => {
        const existing = latestByAuthor.get(event.pubkey);
        if (!existing || event.created_at > existing.created_at) {
          latestByAuthor.set(event.pubkey, event);
        }
      });

      const myFollows = extractFollowPubkeysFromContactList(latestByAuthor.get(user.pubkey));
      const kindredPubkeys = playerPubkeys.filter((pubkey) => {
        if (pubkey === user.pubkey) return false;
        if (!myFollows.has(pubkey)) return false;
        const theirFollows = extractFollowPubkeysFromContactList(latestByAuthor.get(pubkey));
        return theirFollows.has(user.pubkey);
      });

      return {
        totalPlayers: playerPubkeys.length,
        kindredSpirits: kindredPubkeys.length,
        kindredPubkeys,
      };
    },
    staleTime: 60_000,
  });

  const socialStats = socialQuery.data ?? {
    totalPlayers: 0,
    kindredSpirits: 0,
    kindredPubkeys: [] as string[],
  };

  const kindredPubkeysKey = [...(socialQuery.data?.kindredPubkeys ?? [])].sort().join('|');

  const socialActivityQuery = useQuery({
    queryKey: ['rpg-social-activity', 'remembered-name', NSG_QUEST_STATE_KIND, NSG_QUEST_STATE_D_TAG],
    staleTime: 60_000,
    queryFn: async () => {
      const checkpoints = await nostr.query([
        {
          kinds: [NSG_QUEST_STATE_KIND],
          '#t': ['no-stranger-game'],
          '#d': [NSG_QUEST_STATE_D_TAG],
          limit: 500,
        },
      ]);
      const byAuthor = new Map<string, NostrEvent[]>();
      for (const ev of checkpoints) {
        const list = byAuthor.get(ev.pubkey) ?? [];
        list.push(ev);
        byAuthor.set(ev.pubkey, list);
      }
      const rows: { pubkey: string; displayName: string; namedAt: number }[] = [];
      for (const [pubkey, events] of byAuthor) {
        const found = findFirstRememberedCheckpoint(events);
        if (!found) continue;
        rows.push({ pubkey, displayName: found.displayName, namedAt: found.namedAt });
      }
      rows.sort((a, b) => b.namedAt - a.namedAt);
      return rows.slice(0, 5);
    },
  });

  const socialKindredSignalsQuery = useQuery({
    queryKey: ['rpg-social-kindred-signals', user?.pubkey ?? '', kindredPubkeysKey],
    enabled: Boolean(user) && socialQuery.isSuccess,
    staleTime: 60_000,
    queryFn: async () => {
      const kindredPubkeys = [...(socialQuery.data?.kindredPubkeys ?? [])];
      if (kindredPubkeys.length === 0) return [];

      const checkpoints = await nostr.query([
        {
          kinds: [NSG_QUEST_STATE_KIND],
          '#t': ['no-stranger-game'],
          '#d': [NSG_QUEST_STATE_D_TAG],
          limit: 400,
        },
      ]);
      const byAuthor = new Map<string, NostrEvent[]>();
      for (const ev of checkpoints) {
        const list = byAuthor.get(ev.pubkey) ?? [];
        list.push(ev);
        byAuthor.set(ev.pubkey, list);
      }

      type SignalRow = { pubkey: string; name: string; text: string; latestAt: number };
      const candidates: SignalRow[] = [];
      for (const pubkey of kindredPubkeys) {
        const events = byAuthor.get(pubkey) ?? [];
        if (events.length === 0) continue;
        const latestEv = events.reduce((best, cur) => (cur.created_at > best.created_at ? cur : best));
        const payload = parseQuestCheckpointPayload(latestEv.content);
        if (!payload) continue;
        const { state } = payload;
        const name = state.playerName.trim() || 'Stranger';
        const world = state.worldEventLog;
        const last = world.length > 0 ? world[world.length - 1] : undefined;
        const rawText =
          last && typeof last === 'object' && last !== null && 'text' in last
            ? String((last as { text: string }).text)
            : '';
        const text = rawText.trim()
          ? truncatePlaintext(rawText, 220)
          : `${name} updated their journey.`;
        candidates.push({ pubkey, name, text, latestAt: latestEv.created_at });
      }
      candidates.sort((a, b) => b.latestAt - a.latestAt);
      return candidates.slice(0, 5);
    },
  });

  // The lobby chat itself moved to NIP-29 (see src/components/rpg/chat). We still
  // resolve display names for OTHER players' messages by looking up their kindred
  // checkpoint payload, since chat events only carry pubkeys.
  const lobbyNamesQuery = useQuery({
    queryKey: ['rpg-lobby-names', socialStats.kindredPubkeys.join('|')],
    enabled: socialStats.kindredPubkeys.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const authors = socialStats.kindredPubkeys;
      const checkpoints = await nostr.query([
        {
          kinds: [NSG_QUEST_STATE_KIND],
          authors,
          '#d': [NSG_QUEST_STATE_D_TAG],
          limit: authors.length * 2,
        },
      ]);
      const latest = new Map<string, NostrEvent>();
      for (const ev of checkpoints) {
        const existing = latest.get(ev.pubkey);
        if (!existing || ev.created_at > existing.created_at) {
          latest.set(ev.pubkey, ev);
        }
      }
      const nameMap = new Map<string, string>();
      for (const [pubkey, ev] of latest) {
        const payload = parseQuestCheckpointPayload(ev.content);
        const name = payload?.state?.playerName?.trim();
        if (name) nameMap.set(pubkey, name);
      }
      return nameMap;
    },
  });

  return {
    socialStats,
    socialActivityQuery,
    socialKindredSignalsQuery,
    lobbyNameMap: lobbyNamesQuery.data ?? new Map<string, string>(),
  };
}
