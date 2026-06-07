import { useEffect, useRef } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';

import {
  matchInvolvesOwner,
  myFighterInMatch,
  type BlobbiFightMatchResult,
} from './blobbiFightNostr';
import { publishFightMemoryForMatch } from './useBlobbiFight';
import { hasFightMemoryForMatch, type BlobbiFightMemory } from './blobbiCareerNostr';

/** When the Blobbi panel is open, publish any missing kind 14921 career memories for the player (once per match). */
export function useBlobbiSyncFightMemories(args: {
  enabled: boolean;
  matches: readonly BlobbiFightMatchResult[];
  myPubkey: string | undefined;
  memories: readonly BlobbiFightMemory[];
  onMemoryPublished?: () => void;
}) {
  const { enabled, matches, myPubkey, memories, onMemoryPublished } = args;
  const { user } = useCurrentUser();
  const { mutateAsync: publish } = useNostrPublish();
  const publishedRef = useRef<Set<string>>(new Set());
  const publishRef = useRef(publish);
  publishRef.current = publish;
  const onMemoryPublishedRef = useRef(onMemoryPublished);
  onMemoryPublishedRef.current = onMemoryPublished;

  useEffect(() => {
    if (!enabled || !myPubkey || !user?.pubkey || matches.length === 0) return;

    for (const match of matches) {
      if (!matchInvolvesOwner(match, myPubkey)) continue;

      const me = myFighterInMatch(match, myPubkey);
      if (!me) continue;

      if (hasFightMemoryForMatch(memories, match.eventId, me.blobbiId)) continue;
      if (publishedRef.current.has(match.eventId)) continue;

      publishedRef.current.add(match.eventId);
      void publishFightMemoryForMatch({
        publish: publishRef.current,
        match,
        myPubkey,
      })
        .then(() => {
          onMemoryPublishedRef.current?.();
        })
        .catch(() => {
          publishedRef.current.delete(match.eventId);
        });
    }
  }, [enabled, matches, myPubkey, memories, user?.pubkey]);
}
