import type { ArenaFightRecord, ArenaRecord, QuestState } from '../quests/types';
import { COMMUNITY_EVENT_EPOCH_UNIX } from '@/lib/communityEventEpoch';
import type { ArenaMatchResult } from './arenaNostr';
import { ARENA_FIGHT_HISTORY_CAP } from './constants';
import { getWinProbability } from './combatRating';

export const createEmptyArenaRecord = (): ArenaRecord => ({
  wins: 0,
  losses: 0,
  fights: [],
});

const COMMUNITY_EVENT_EPOCH_MS = COMMUNITY_EVENT_EPOCH_UNIX * 1000;

/** Drop pre-epoch fights from persisted arena stats (relay rows are filtered separately). */
export function reconcileArenaRecordForEpoch(record: ArenaRecord): ArenaRecord {
  const fights = record.fights.filter((f) => f.atMs >= COMMUNITY_EVENT_EPOCH_MS);
  let wins = 0;
  let losses = 0;
  for (const fight of fights) {
    if (fight.won) wins += 1;
    else losses += 1;
  }
  if (wins === record.wins && losses === record.losses && fights.length === record.fights.length) {
    return record;
  }
  return { wins, losses, fights };
}

export function formatArenaFightLine(
  won: boolean,
  opponentName: string,
  myCombatRating: number,
  opponentCombatRating: number
): string {
  const verb = won ? 'defeated' : 'lost to';
  return `You ${verb} ${opponentName} (CR ${myCombatRating} vs ${opponentCombatRating})`;
}

function fightRowFromMatch(match: ArenaMatchResult, myPubkey: string): ArenaFightRecord | null {
  const iAmA = match.fighterA.pubkey === myPubkey;
  const iAmB = match.fighterB.pubkey === myPubkey;
  if (!iAmA && !iAmB) return null;

  const me = iAmA ? match.fighterA : match.fighterB;
  const them = iAmA ? match.fighterB : match.fighterA;
  const won = match.winnerPubkey === myPubkey;

  return {
    matchEventId: match.eventId,
    opponentName: them.name,
    opponentPubkey: them.pubkey,
    won,
    myCombatRating: me.combatRating,
    opponentCombatRating: them.combatRating,
    atMs: match.atMs,
  };
}

/** Idempotent merge of relay match results into persisted arena stats. */
export function mergeArenaMatchesIntoRecord(
  record: ArenaRecord,
  matches: readonly ArenaMatchResult[],
  myPubkey: string
): ArenaRecord {
  const known = new Set(record.fights.map((f) => f.matchEventId));
  let wins = record.wins;
  let losses = record.losses;
  const newFights: ArenaFightRecord[] = [];

  for (const match of matches) {
    if (known.has(match.eventId)) continue;
    const row = fightRowFromMatch(match, myPubkey);
    if (!row) continue;
    known.add(match.eventId);
    if (row.won) wins += 1;
    else losses += 1;
    newFights.push(row);
  }

  if (newFights.length === 0) return record;

  const fights = [...newFights, ...record.fights]
    .sort((a, b) => b.atMs - a.atMs)
    .slice(0, ARENA_FIGHT_HISTORY_CAP);

  return { wins, losses, fights };
}

export function mergeArenaMatchesIntoQuestState(
  state: QuestState,
  matches: readonly ArenaMatchResult[],
  myPubkey: string
): QuestState {
  const base = state.arenaRecord ?? createEmptyArenaRecord();
  const arenaRecord = mergeArenaMatchesIntoRecord(base, matches, myPubkey);
  if (arenaRecord === base) return state;
  return { ...state, arenaRecord };
}

export function buildMatchSummaryContent(
  winnerName: string,
  loserName: string,
  winnerCr: number,
  loserCr: number,
  winProbabilityForWinner: number
): string {
  const pct = Math.round(winProbabilityForWinner * 100);
  return `${winnerName} defeated ${loserName} (CR ${winnerCr} vs ${loserCr}, ~${pct}% favorite)`;
}

export function winProbabilityForWinner(
  winnerPubkey: string,
  fighterA: { pubkey: string; combatRating: number },
  fighterB: { pubkey: string; combatRating: number }
): number {
  if (winnerPubkey === fighterA.pubkey) {
    return getWinProbability(fighterA.combatRating, fighterB.combatRating);
  }
  return getWinProbability(fighterB.combatRating, fighterA.combatRating);
}

export function headToHeadPairKey(pubkeyA: string, pubkeyB: string): string {
  return pubkeyA < pubkeyB ? `${pubkeyA}:${pubkeyB}` : `${pubkeyB}:${pubkeyA}`;
}

export type HeadToHeadWins = Record<string, number>;

/** Cumulative head-to-head wins for each fighter after each match, in chronological order. */
export function buildHeadToHeadWinCountsByMatchId(
  matches: readonly ArenaMatchResult[]
): Map<string, HeadToHeadWins> {
  const chronological = [...matches].sort((a, b) => {
    if (a.atMs !== b.atMs) return a.atMs - b.atMs;
    return a.eventId.localeCompare(b.eventId);
  });

  const runningByPair = new Map<string, Map<string, number>>();
  const byMatchId = new Map<string, HeadToHeadWins>();

  for (const match of chronological) {
    const pairKey = headToHeadPairKey(match.fighterA.pubkey, match.fighterB.pubkey);
    let running = runningByPair.get(pairKey);
    if (!running) {
      running = new Map();
      runningByPair.set(pairKey, running);
    }

    running.set(match.winnerPubkey, (running.get(match.winnerPubkey) ?? 0) + 1);

    byMatchId.set(match.eventId, {
      [match.fighterA.pubkey]: running.get(match.fighterA.pubkey) ?? 0,
      [match.fighterB.pubkey]: running.get(match.fighterB.pubkey) ?? 0,
    });
  }

  return byMatchId;
}
