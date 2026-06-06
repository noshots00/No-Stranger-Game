import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';

import { pubkeysEqual } from '@/lib/nostrPubkey';
import {
  matchInvolvesOwner,
  myFighterInMatch,
  type BlobbiFightMatchResult,
} from './blobbiFightNostr';
import {
  BLOBBI_FIGHT_LOCATION,
  BLOBBI_FIGHT_MEMORY_QUERY_LIMIT,
  BLOBBI_LIFECYCLE_KIND,
} from './constants';

export type BlobbiFightMemory = {
  eventId: string;
  pubkey: string;
  blobbiId: string;
  achievement: 'arena_victory' | 'arena_defeat';
  nsgMatchId: string;
  opponentBlobbiId: string;
  opponentName: string;
  content: string;
  createdAt: number;
};

const tagValue = (event: NostrEvent, name: string): string | undefined =>
  event.tags.find(([n]) => n === name)?.[1];

export function parseBlobbiFightMemory(event: NostrEvent): BlobbiFightMemory | null {
  if (event.kind !== BLOBBI_LIFECYCLE_KIND) return null;
  const recordType = tagValue(event, 'record_type');
  if (recordType !== 'memory') return null;
  const achievement = tagValue(event, 'achievement');
  if (achievement !== 'arena_victory' && achievement !== 'arena_defeat') return null;

  const blobbiId = tagValue(event, 'blobbi_id')?.trim();
  const nsgMatchId = tagValue(event, 'nsg-match')?.trim();
  const opponentBlobbiId = tagValue(event, 'opponent_blobbi')?.trim();
  const opponentName = tagValue(event, 'opponent_name')?.trim();
  if (!blobbiId || !nsgMatchId || !opponentBlobbiId || !opponentName) return null;

  return {
    eventId: event.id,
    pubkey: event.pubkey,
    blobbiId,
    achievement,
    nsgMatchId,
    opponentBlobbiId,
    opponentName,
    content: event.content.trim(),
    createdAt: event.created_at,
  };
}

export const blobbiFightMemoryFilter = (pubkey: string): NostrFilter => ({
  kinds: [BLOBBI_LIFECYCLE_KIND],
  authors: [pubkey],
  '#record_type': ['memory'],
  limit: BLOBBI_FIGHT_MEMORY_QUERY_LIMIT,
});

export function hasFightMemoryForMatch(
  memories: readonly BlobbiFightMemory[],
  nsgMatchId: string,
  blobbiId: string
): boolean {
  return findFightMemoryForMatch(memories, nsgMatchId, blobbiId) !== undefined;
}

export function findFightMemoryForMatch(
  memories: readonly BlobbiFightMemory[],
  nsgMatchId: string,
  blobbiId: string
): BlobbiFightMemory | undefined {
  return memories.find((m) => m.nsgMatchId === nsgMatchId && m.blobbiId === blobbiId);
}

export type BlobbiArenaRecord = { wins: number; losses: number };

export function computeBlobbiArenaRecord(args: {
  blobbiId: string;
  matches: readonly BlobbiFightMatchResult[];
  memories: readonly BlobbiFightMemory[];
  myPubkey: string;
}): BlobbiArenaRecord {
  const { blobbiId, matches, memories, myPubkey } = args;
  let wins = 0;
  let losses = 0;

  for (const memory of memories) {
    if (memory.blobbiId !== blobbiId) continue;
    if (memory.achievement === 'arena_victory') wins += 1;
    else losses += 1;
  }

  const memoryMatchIds = new Set(
    memories.filter((m) => m.blobbiId === blobbiId).map((m) => m.nsgMatchId)
  );

  for (const match of matches) {
    if (!matchInvolvesOwner(match, myPubkey)) continue;
    const me = myFighterInMatch(match, myPubkey);
    if (!me || me.blobbiId !== blobbiId) continue;
    if (memoryMatchIds.has(match.eventId)) continue;
    if (pubkeysEqual(match.winnerOwnerPubkey, myPubkey)) wins += 1;
    else losses += 1;
  }

  return { wins, losses };
}

export function buildFightMemoryDraft(args: {
  blobbiId: string;
  blobbiName: string;
  won: boolean;
  opponentBlobbiId: string;
  opponentName: string;
  nsgMatchId: string;
  content: string;
  createdAtSec?: number;
}): Omit<NostrEvent, 'id' | 'pubkey' | 'sig'> {
  const created_at = args.createdAtSec ?? Math.floor(Date.now() / 1000);
  return {
    kind: BLOBBI_LIFECYCLE_KIND,
    content: args.content,
    created_at,
    tags: [
      ['blobbi_id', args.blobbiId],
      ['record_type', 'memory'],
      ['achievement', args.won ? 'arena_victory' : 'arena_defeat'],
      ['location', BLOBBI_FIGHT_LOCATION],
      ['nsg-match', args.nsgMatchId],
      ['opponent_blobbi', args.opponentBlobbiId],
      ['opponent_name', args.opponentName],
      ['alt', 'Blobbi Fighting career memory for No Stranger Game'],
    ],
  };
}
