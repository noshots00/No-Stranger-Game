import { useEffect, useRef } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';

import { matchInvolvesOwner, type BlobbiFightMatchResult } from './blobbiFightNostr';
import { publishFightMemoryForMatch } from './useBlobbiFight';

/** When the Blobbi panel is open, publish any missing kind 14921 career memories for the player (once per match). */
export function useBlobbiSyncFightMemories(args: {
  enabled: boolean;
  matches: readonly BlobbiFightMatchResult[];
  myPubkey: string | undefined;
}) {
  const { user } = useCurrentUser();
  const { mutateAsync: publish } = useNostrPublish();
  const publishedRef = useRef<Set<string>>(new Set());
  const publishRef = useRef(publish);
  publishRef.current = publish;

  useEffect(() => {
    if (!args.enabled || !args.myPubkey || !user?.pubkey || args.matches.length === 0) return;

    for (const match of args.matches) {
      if (!matchInvolvesOwner(match, args.myPubkey)) continue;
      if (publishedRef.current.has(match.eventId)) continue;
      publishedRef.current.add(match.eventId);
      void publishFightMemoryForMatch({
        publish: publishRef.current,
        match,
        myPubkey: args.myPubkey,
      }).catch(() => {
        publishedRef.current.delete(match.eventId);
      });
    }
  }, [args.enabled, args.matches, args.myPubkey, user?.pubkey]);
}
