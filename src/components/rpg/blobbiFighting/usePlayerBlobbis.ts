import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

import { blobbiStateFilter, listLatestBlobbiStates } from './blobbiStateNostr';

const PLAYER_BLOBBIS_KEY = ['player-blobbis'] as const;

export function usePlayerBlobbis(args: { enabled: boolean; pubkey: string | undefined }) {
  const { nostr } = useNostr();

  const query = useQuery({
    queryKey: [...PLAYER_BLOBBIS_KEY, args.pubkey],
    queryFn: async () => {
      if (!args.pubkey) return [];
      const events = await nostr.query([blobbiStateFilter(args.pubkey)]);
      return listLatestBlobbiStates(events);
    },
    enabled: args.enabled && Boolean(args.pubkey),
    staleTime: Infinity,
  });

  return {
    blobbis: query.data ?? [],
    query,
    invalidate: () => query.refetch(),
  };
}
