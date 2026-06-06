import { useCallback, useMemo } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

import {
  blobbiFightMemoryFilter,
  findFightMemoryForMatch,
  parseBlobbiFightMemory,
  type BlobbiFightMemory,
} from './blobbiCareerNostr';

export const BLOBBI_FIGHT_MEMORIES_KEY = ['blobbi-fight-memories'] as const;

export function useBlobbiFightMemories(args: {
  enabled: boolean;
  myPubkey: string | undefined;
}) {
  const { nostr } = useNostr();

  const query = useQuery({
    queryKey: [...BLOBBI_FIGHT_MEMORIES_KEY, args.myPubkey],
    queryFn: async () => {
      if (!args.myPubkey) return [];
      const events = await nostr.query([blobbiFightMemoryFilter(args.myPubkey)]);
      return events
        .map((e) => parseBlobbiFightMemory(e as import('@nostrify/nostrify').NostrEvent))
        .filter((m): m is BlobbiFightMemory => m !== null);
    },
    enabled: false,
    staleTime: Infinity,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const memoryByMatchId = useMemo(() => {
    const map = new Map<string, BlobbiFightMemory>();
    for (const memory of query.data ?? []) {
      const prev = map.get(memory.nsgMatchId);
      if (!prev || memory.createdAt >= prev.createdAt) {
        map.set(memory.nsgMatchId, memory);
      }
    }
    return map;
  }, [query.data]);

  const refreshMemories = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    memoriesQuery: query,
    memories: query.data ?? [],
    memoryByMatchId,
    refreshMemories,
    findMemoryForMatch: (matchEventId: string, blobbiId: string) =>
      findFightMemoryForMatch(query.data ?? [], matchEventId, blobbiId),
  };
}
