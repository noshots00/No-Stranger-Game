import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '@/hooks/useAppContext';

export interface Phase2Signals {
  positiveReactions24h: number;
  negativeReactions24h: number;
  relayDifficultyBand: 'easy' | 'normal' | 'hard';
  grayLadyHint?: string;
}

export function usePhase2Signals(userPubkey: string | undefined) {
  const { nostr } = useNostr();
  const { config } = useAppContext();

  return useQuery<Phase2Signals>({
    queryKey: ['nostr', 'phase2-signals', userPubkey ?? '', config.relayMetadata.updatedAt],
    enabled: Boolean(userPubkey),
    staleTime: 60_000,
    queryFn: async () => {
      if (!userPubkey) {
        return { positiveReactions24h: 0, negativeReactions24h: 0, relayDifficultyBand: 'normal' };
      }

      const since = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
      const notes = await nostr.query(
        [{ kinds: [1], authors: [userPubkey], since, limit: 30 }],
        { signal: AbortSignal.timeout(5000) },
      );

      const noteIds = notes.map((note) => note.id);
      const reactions = noteIds.length > 0
        ? await nostr.query(
          [{ kinds: [7], '#e': noteIds, since, limit: 200 }],
          { signal: AbortSignal.timeout(5000) },
        )
        : [];

      let positive = 0;
      let negative = 0;
      for (const reaction of reactions) {
        const value = reaction.content.trim();
        if (['+', '❤️', '❤', '🤙', '🔥'].includes(value)) positive += 1;
        else if (['-', '👎', '💀', '🤮'].includes(value)) negative += 1;
      }

      const writeRelays = config.relayMetadata.relays.filter((relay) => relay.write).length;
      const relayDifficultyBand: 'easy' | 'normal' | 'hard' =
        writeRelays <= 2 ? 'easy' : writeRelays <= 4 ? 'normal' : 'hard';

      return {
        positiveReactions24h: positive,
        negativeReactions24h: negative,
        relayDifficultyBand,
        grayLadyHint: writeRelays < 3 ? 'The Gray Lady lingers at the edge of unseen relays.' : undefined,
      };
    },
  });
}
