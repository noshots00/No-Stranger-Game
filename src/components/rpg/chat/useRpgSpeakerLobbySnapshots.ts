import { useMemo } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { normalizePubkeyHex } from '@/lib/nostrPubkey';
import type { QuestState } from '@/components/rpg/quests/types';
import { NSG_QUEST_STATE_D_TAG, NSG_QUEST_STATE_KIND, parseQuestCheckpointPayload } from '../gameProfile';

const STALE_MS = 60_000;
const MAX_AUTHORS = 100;

export type RpgSpeakerLobbySnapshots = {
  nameByPubkey: Map<string, string>;
  questStateByPubkey: Map<string, QuestState>;
};

/**
 * Latest quest checkpoints (kind 10032) per pubkey: character names + full `QuestState` for lobby UI (e.g. bio dialog).
 */
export function useRpgSpeakerLobbySnapshots(pubkeys: readonly string[]): RpgSpeakerLobbySnapshots {
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
    queryKey: ['rpg-chat-speaker-lobby-snapshots', key],
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
      const nameByPubkey = new Map<string, string>();
      const questStateByPubkey = new Map<string, QuestState>();
      for (const [pubkey, ev] of latest) {
        const payload = parseQuestCheckpointPayload(ev.content);
        if (!payload) continue;
        const pk = normalizePubkeyHex(pubkey);
        questStateByPubkey.set(pk, payload.state);
        const name = payload.state.playerName?.trim();
        if (name) nameByPubkey.set(pk, name);
      }
      return { nameByPubkey, questStateByPubkey };
    },
  });

  return query.data ?? { nameByPubkey: new Map(), questStateByPubkey: new Map() };
}
