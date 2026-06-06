import { describe, expect, it } from 'vitest';

import { computeBlobbiArenaRecord, type BlobbiFightMemory } from './blobbiCareerNostr';
import type { BlobbiFightMatchResult, BlobbiFighterSnapshot } from './blobbiFightNostr';

const MY_PUBKEY = 'aa'.repeat(32);
const OPP_PUBKEY = 'bb'.repeat(32);
const BLOBBI_ID = 'blobbi-test';

function fighter(overrides: Partial<BlobbiFighterSnapshot> = {}): BlobbiFighterSnapshot {
  return {
    ownerPubkey: MY_PUBKEY,
    ownerName: 'Me',
    blobbiId: BLOBBI_ID,
    blobbiName: 'Sprout',
    stage: 'baby',
    health: 8,
    ...overrides,
  };
}

function matchRow(args: {
  eventId: string;
  winnerOwnerPubkey: string;
  fighterA?: Partial<BlobbiFighterSnapshot>;
  fighterB?: Partial<BlobbiFighterSnapshot>;
}): BlobbiFightMatchResult {
  return {
    eventId: args.eventId,
    pubkey: MY_PUBKEY,
    fighterA: fighter(args.fighterA),
    fighterB: fighter({
      ownerPubkey: OPP_PUBKEY,
      ownerName: 'Them',
      blobbiId: 'blobbi-opp',
      blobbiName: 'Rival',
      ...args.fighterB,
    }),
    winnerOwnerPubkey: args.winnerOwnerPubkey,
    registrationEventId: 'reg-1',
    summary: 'test',
    winProbabilityForWinner: 0.5,
    atMs: 1_700_000_000_000,
  };
}

function memory(args: {
  nsgMatchId: string;
  achievement: 'arena_victory' | 'arena_defeat';
}): BlobbiFightMemory {
  return {
    eventId: `mem-${args.nsgMatchId}`,
    pubkey: MY_PUBKEY,
    blobbiId: BLOBBI_ID,
    achievement: args.achievement,
    nsgMatchId: args.nsgMatchId,
    opponentBlobbiId: 'blobbi-opp',
    opponentName: 'Rival',
    content: 'memory',
    createdAt: 1,
  };
}

describe('computeBlobbiArenaRecord', () => {
  it('counts wins and losses from memories only', () => {
    const record = computeBlobbiArenaRecord({
      blobbiId: BLOBBI_ID,
      matches: [],
      memories: [
        memory({ nsgMatchId: 'm1', achievement: 'arena_victory' }),
        memory({ nsgMatchId: 'm2', achievement: 'arena_defeat' }),
        memory({ nsgMatchId: 'm3', achievement: 'arena_victory' }),
      ],
      myPubkey: MY_PUBKEY,
    });
    expect(record).toEqual({ wins: 2, losses: 1 });
  });

  it('counts wins and losses from matches when no memory exists', () => {
    const record = computeBlobbiArenaRecord({
      blobbiId: BLOBBI_ID,
      matches: [
        matchRow({ eventId: 'm1', winnerOwnerPubkey: MY_PUBKEY }),
        matchRow({ eventId: 'm2', winnerOwnerPubkey: OPP_PUBKEY }),
      ],
      memories: [],
      myPubkey: MY_PUBKEY,
    });
    expect(record).toEqual({ wins: 1, losses: 1 });
  });

  it('dedupes matches that already have a memory', () => {
    const record = computeBlobbiArenaRecord({
      blobbiId: BLOBBI_ID,
      matches: [matchRow({ eventId: 'm1', winnerOwnerPubkey: MY_PUBKEY })],
      memories: [memory({ nsgMatchId: 'm1', achievement: 'arena_defeat' })],
      myPubkey: MY_PUBKEY,
    });
    expect(record).toEqual({ wins: 0, losses: 1 });
  });

  it('ignores other blobbis and non-participating matches', () => {
    const record = computeBlobbiArenaRecord({
      blobbiId: BLOBBI_ID,
      matches: [
        matchRow({
          eventId: 'm1',
          winnerOwnerPubkey: OPP_PUBKEY,
          fighterA: { ownerPubkey: 'cc'.repeat(32), blobbiId: 'other' },
          fighterB: { ownerPubkey: 'dd'.repeat(32), blobbiId: 'another' },
        }),
      ],
      memories: [memory({ nsgMatchId: 'old', achievement: 'arena_victory' })],
      myPubkey: MY_PUBKEY,
    });
    expect(record).toEqual({ wins: 1, losses: 0 });
  });
});
