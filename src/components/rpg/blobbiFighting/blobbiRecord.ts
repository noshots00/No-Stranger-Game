import { pubkeysEqual } from '@/lib/nostrPubkey';
import { headToHeadPairKey, type HeadToHeadWins } from '../arena/arenaRecord';
import { ARENA_FIGHT_HISTORY_CAP } from '../arena/constants';
import type { BlobbiFightMemory } from './blobbiCareerNostr';
import {
  matchInvolvesOwner,
  myFighterInMatch,
  opponentFighterInMatch,
  type BlobbiFightMatchResult,
} from './blobbiFightNostr';

export type BlobbiFightRecord = {
  matchEventId: string;
  opponentName: string;
  opponentOwnerPubkey: string;
  won: boolean;
  myHealth: number;
  opponentHealth: number;
  atMs: number;
};

function fightRowFromMatch(
  match: BlobbiFightMatchResult,
  myPubkey: string,
  blobbiId: string
): BlobbiFightRecord | null {
  if (!matchInvolvesOwner(match, myPubkey)) return null;
  const me = myFighterInMatch(match, myPubkey);
  const them = opponentFighterInMatch(match, myPubkey);
  if (!me || !them || me.blobbiId !== blobbiId) return null;

  return {
    matchEventId: match.eventId,
    opponentName: them.blobbiName,
    opponentOwnerPubkey: them.ownerPubkey,
    won: pubkeysEqual(match.winnerOwnerPubkey, myPubkey),
    myHealth: me.health,
    opponentHealth: them.health,
    atMs: match.atMs,
  };
}

function fightRowFromMemory(
  memory: BlobbiFightMemory,
  blobbiId: string
): BlobbiFightRecord | null {
  if (memory.blobbiId !== blobbiId) return null;
  return {
    matchEventId: memory.nsgMatchId,
    opponentName: memory.opponentName,
    opponentOwnerPubkey: '',
    won: memory.achievement === 'arena_victory',
    myHealth: 0,
    opponentHealth: 0,
    atMs: memory.createdAt * 1000,
  };
}

/** Personal fight history for the active blobbi (newest first). */
export function buildBlobbiPersonalFights(args: {
  blobbiId: string;
  matches: readonly BlobbiFightMatchResult[];
  memories: readonly BlobbiFightMemory[];
  myPubkey: string;
}): BlobbiFightRecord[] {
  const { blobbiId, matches, memories, myPubkey } = args;
  const byMatchId = new Map<string, BlobbiFightRecord>();

  for (const match of matches) {
    const row = fightRowFromMatch(match, myPubkey, blobbiId);
    if (!row) continue;
    byMatchId.set(row.matchEventId, row);
  }

  for (const memory of memories) {
    if (byMatchId.has(memory.nsgMatchId)) continue;
    const row = fightRowFromMemory(memory, blobbiId);
    if (!row) continue;
    byMatchId.set(row.matchEventId, row);
  }

  return [...byMatchId.values()]
    .sort((a, b) => b.atMs - a.atMs)
    .slice(0, ARENA_FIGHT_HISTORY_CAP);
}

/** Cumulative owner head-to-head wins after each pit match (arena pattern). */
export function buildBlobbiHeadToHeadWinCountsByMatchId(
  matches: readonly BlobbiFightMatchResult[]
): Map<string, HeadToHeadWins> {
  const chronological = [...matches].sort((a, b) => {
    if (a.atMs !== b.atMs) return a.atMs - b.atMs;
    return a.eventId.localeCompare(b.eventId);
  });

  const runningByPair = new Map<string, Map<string, number>>();
  const byMatchId = new Map<string, HeadToHeadWins>();

  for (const match of chronological) {
    const pairKey = headToHeadPairKey(match.fighterA.ownerPubkey, match.fighterB.ownerPubkey);
    let running = runningByPair.get(pairKey);
    if (!running) {
      running = new Map();
      runningByPair.set(pairKey, running);
    }

    running.set(
      match.winnerOwnerPubkey,
      (running.get(match.winnerOwnerPubkey) ?? 0) + 1
    );

    byMatchId.set(match.eventId, {
      [match.fighterA.ownerPubkey]: running.get(match.fighterA.ownerPubkey) ?? 0,
      [match.fighterB.ownerPubkey]: running.get(match.fighterB.ownerPubkey) ?? 0,
    });
  }

  return byMatchId;
}
