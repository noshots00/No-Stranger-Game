import { useEffect, useRef } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';

import {
  matchInvolvesOwner,
  myFighterInMatch,
  type BlobbiFightMatchResult,
} from './blobbiFightNostr';
import { publishFightMemoryForMatch } from './useBlobbiFight';
import {
  blobbiFightMemoryFilter,
  hasFightMemoryForMatch,
  parseBlobbiFightMemory,
} from './blobbiCareerNostr';

/** When the Blobbi panel is open, publish any missing kind 14921 career memories for the player (once per match). */
export function useBlobbiSyncFightMemories(args: {
  enabled: boolean;
  matches: readonly BlobbiFightMatchResult[];
  myPubkey: string | undefined;
}) {
  const { user } = useCurrentUser();
  const { mutateAsync: publish } = useNostrPublish();
  const { nostr } = useNostr();
  const queryClient = useQueryClient();
  const publishedRef = useRef<Set<string>>(new Set());
  const publishRef = useRef(publish);
  publishRef.current = publish;

  const { data: memories = [], isPending } = useQuery({
    queryKey: ['blobbi-fight-memories', args.myPubkey],
    queryFn: async () => {
      if (!args.myPubkey) return [];
      const events = await nostr.query([blobbiFightMemoryFilter(args.myPubkey)]);
      return events
        .map((e) => parseBlobbiFightMemory(e as import('@nostrify/nostrify').NostrEvent))
        .filter((m): m is import('./blobbiCareerNostr').BlobbiFightMemory => m !== null);
    },
    enabled: args.enabled && Boolean(args.myPubkey),
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!args.enabled || !args.myPubkey || !user?.pubkey || args.matches.length === 0 || isPending) return;

    for (const match of args.matches) {
      if (!matchInvolvesOwner(match, args.myPubkey)) continue;

      const me = myFighterInMatch(match, args.myPubkey);
      if (!me) continue;

      if (hasFightMemoryForMatch(memories, match.eventId, me.blobbiId)) continue;
      if (publishedRef.current.has(match.eventId)) continue;

      publishedRef.current.add(match.eventId);
      void publishFightMemoryForMatch({
        publish: publishRef.current,
        match,
        myPubkey: args.myPubkey,
      })
        .then(() => {
          void queryClient.invalidateQueries({ queryKey: ['blobbi-fight-memories', args.myPubkey] });
        })
        .catch(() => {
          publishedRef.current.delete(match.eventId);
        });
    }
  }, [args.enabled, args.matches, args.myPubkey, user?.pubkey, memories, isPending, queryClient]);
}
