import { useMemo } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { NSG_QUEST_STATE_D_TAG, NSG_QUEST_STATE_KIND, parseQuestCheckpointPayload } from '../gameProfile';

const STALE_MS = 60_000;
/** Relays may reject huge `authors` filters; cap batch size. */
const MAX_AUTHORS = 100;

/**
 * Resolves in-game character names from published quest checkpoints (kind 10032)
 * for the given pubkeys. Used for location/lobby chat where events only carry hex pubkeys.
 */
export function useRpgSpeakerNamesForPubkeys(pubkeys: readonly string[]) {
  const { nostr } = useNostr();

  const key = useMemo(() => {
    const unique = [...new Set(pubkeys)].filter(Boolean).sort();
    return unique.join('|');
  }, [pubkeys]);

  const authors = useMemo(() => {
    const unique = [...new Set(pubkeys)].filter(Boolean).sort();
    return unique.slice(0, MAX_AUTHORS);
  }, [pubkeys]);

  const query = useQuery({
    queryKey: ['rpg-chat-speaker-names', key],
    enabled: authors.length > 0,
    staleTime: STALE_MS,
    queryFn: async () => {
      const checkpoints = await nostr.query([
        {
          kinds: [NSG_QUEST_STATE_KIND],
          authors,
          '#d': [NSG_QUEST_STATE_D_TAG],
          limit: Math.max(20, authors.length * 2),
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

  return query.data ?? new Map<string, string>();
}
