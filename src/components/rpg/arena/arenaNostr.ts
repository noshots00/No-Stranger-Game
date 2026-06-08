import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import type { FighterSnapshot } from '../combat/combatTypes';
import {
  ARENA_COMMUNITY_TAG,
  ARENA_MATCH_TAG,
  ARENA_OPEN_D_TAG,
  ARENA_OPEN_QUEUE_TAG,
  ARENA_QUERY_LIMIT_MATCHES,
  ARENA_QUERY_LIMIT_OPEN,
  NSG_ARENA_MATCH_KIND,
  NSG_ARENA_OPEN_KIND,
} from './constants';
import { type ArenaMatchPayloadV1, parseArenaMatchPayload } from './arenaCombat';

export type ArenaFighterSnapshot = {
  pubkey: string;
  name: string;
  combatRating: number;
};

export type ArenaOpenRegistration = {
  eventId: string;
  pubkey: string;
  name: string;
  combatRating: number;
  createdAt: number;
  fighterSnapshot?: FighterSnapshot;
};

export type ArenaMatchResult = {
  eventId: string;
  pubkey: string;
  fighterA: ArenaFighterSnapshot;
  fighterB: ArenaFighterSnapshot;
  winnerPubkey: string;
  registrationEventId: string;
  summary: string;
  winProbabilityForWinner: number;
  atMs: number;
  matchPayload?: ArenaMatchPayloadV1;
};

const tagValue = (event: NostrEvent, name: string): string | undefined =>
  event.tags.find(([n]) => n === name)?.[1];

const tagValues = (event: NostrEvent, name: string): string[] =>
  event.tags.filter(([n]) => n === name).map((t) => t[1]).filter(Boolean) as string[];

function parseFighterSnapshotFromContent(content: string): FighterSnapshot | undefined {
  if (!content.trim()) return undefined;
  try {
    const raw = JSON.parse(content) as { fighter?: FighterSnapshot };
    if (raw.fighter && typeof raw.fighter === 'object' && raw.fighter.name) {
      return raw.fighter;
    }
    if ((raw as FighterSnapshot).name && (raw as FighterSnapshot).stats) {
      return raw as FighterSnapshot;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

const fighterFromEvent = (
  event: NostrEvent,
  prefix: 'a' | 'b'
): ArenaFighterSnapshot | null => {
  const pubkey = tagValue(event, `p-${prefix}`);
  const name = tagValue(event, `n-${prefix}`);
  const ratingRaw = tagValue(event, `cr-${prefix}`);
  if (!pubkey || !name || !ratingRaw) return null;
  const combatRating = Number.parseInt(ratingRaw, 10);
  if (!Number.isFinite(combatRating)) return null;
  return { pubkey, name, combatRating };
};

export function parseArenaOpenRegistration(event: NostrEvent): ArenaOpenRegistration | null {
  if (event.kind !== NSG_ARENA_OPEN_KIND) return null;
  const d = tagValue(event, 'd');
  if (d !== ARENA_OPEN_D_TAG) return null;
  const name = tagValue(event, 'name')?.trim();
  const ratingRaw = tagValue(event, 'rating');
  if (!name || !ratingRaw) return null;
  const combatRating = Number.parseInt(ratingRaw, 10);
  if (!Number.isFinite(combatRating)) return null;
  return {
    eventId: event.id,
    pubkey: event.pubkey,
    name,
    combatRating,
    createdAt: event.created_at,
    fighterSnapshot: parseFighterSnapshotFromContent(event.content),
  };
}

export function parseArenaMatchResult(event: NostrEvent): ArenaMatchResult | null {
  if (event.kind !== NSG_ARENA_MATCH_KIND) return null;
  if (!event.tags.some(([n, v]) => n === 't' && v === ARENA_MATCH_TAG)) return null;

  const fighterA = fighterFromEvent(event, 'a');
  const fighterB = fighterFromEvent(event, 'b');
  const winnerPubkey = tagValue(event, 'winner');
  const registrationEventId = tagValues(event, 'e')[0];
  if (!fighterA || !fighterB || !winnerPubkey || !registrationEventId) return null;
  if (winnerPubkey !== fighterA.pubkey && winnerPubkey !== fighterB.pubkey) return null;

  const probRaw = tagValue(event, 'win-pct');
  const winProbabilityForWinner =
    probRaw !== undefined ? Number.parseInt(probRaw, 10) / 100 : 0.5;

  const matchPayload = parseArenaMatchPayload(event.content);
  const summary =
    matchPayload?.summary?.trim() ||
    (event.content.trim().startsWith('{') ? `${fighterA.name} vs ${fighterB.name}` : event.content.trim()) ||
    `${fighterA.name} vs ${fighterB.name}`;

  return {
    eventId: event.id,
    pubkey: event.pubkey,
    fighterA,
    fighterB,
    winnerPubkey,
    registrationEventId,
    summary,
    winProbabilityForWinner: Number.isFinite(winProbabilityForWinner) ? winProbabilityForWinner : 0.5,
    atMs: event.created_at * 1000,
    matchPayload: matchPayload ?? undefined,
  };
}

export const arenaOpenFilter = (): NostrFilter => ({
  kinds: [NSG_ARENA_OPEN_KIND],
  '#d': [ARENA_OPEN_D_TAG],
  '#t': [ARENA_OPEN_QUEUE_TAG],
  limit: ARENA_QUERY_LIMIT_OPEN,
});

export const arenaMatchFilter = (): NostrFilter => ({
  kinds: [NSG_ARENA_MATCH_KIND],
  '#t': [ARENA_MATCH_TAG],
  limit: ARENA_QUERY_LIMIT_MATCHES,
});

export function getConsumedRegistrationIds(matches: readonly ArenaMatchResult[]): Set<string> {
  return new Set(matches.map((m) => m.registrationEventId));
}

/** Latest open registration per pubkey that is not consumed. */
export function listActiveOpenRegistrations(
  events: readonly NostrEvent[],
  consumedIds: ReadonlySet<string>
): ArenaOpenRegistration[] {
  const byPubkey = new Map<string, ArenaOpenRegistration>();
  for (const event of events) {
    const row = parseArenaOpenRegistration(event);
    if (!row || consumedIds.has(row.eventId)) continue;
    const prev = byPubkey.get(row.pubkey);
    if (!prev || row.createdAt >= prev.createdAt) byPubkey.set(row.pubkey, row);
  }
  return Array.from(byPubkey.values()).sort((a, b) => a.createdAt - b.createdAt);
}

export function findMyOpenRegistration(
  openList: readonly ArenaOpenRegistration[],
  myPubkey: string
): ArenaOpenRegistration | undefined {
  return openList.find((r) => r.pubkey === myPubkey);
}

export function findOldestOpponentOpen(
  openList: readonly ArenaOpenRegistration[],
  myPubkey: string
): ArenaOpenRegistration | undefined {
  return openList.find((r) => r.pubkey !== myPubkey);
}

export function buildOpenRegistrationDraft(args: {
  playerName: string;
  combatRating: number;
  fighterSnapshot: FighterSnapshot;
  createdAtSec?: number;
}): Omit<NostrEvent, 'id' | 'pubkey' | 'sig'> {
  const created_at = args.createdAtSec ?? Math.floor(Date.now() / 1000);
  return {
    kind: NSG_ARENA_OPEN_KIND,
    content: JSON.stringify({ fighter: args.fighterSnapshot }),
    created_at,
    tags: [
      ['d', ARENA_OPEN_D_TAG],
      ['t', ARENA_COMMUNITY_TAG],
      ['t', ARENA_OPEN_QUEUE_TAG],
      ['name', args.playerName],
      ['rating', String(args.combatRating)],
      ['alt', 'Arena tournament open registration for No Stranger Game'],
    ],
  };
}

export function buildMatchResultDraft(args: {
  fighterA: ArenaFighterSnapshot;
  fighterB: ArenaFighterSnapshot;
  winnerPubkey: string;
  registrationEventId: string;
  summary: string;
  winProbabilityForWinner: number;
  matchPayload?: ArenaMatchPayloadV1;
  createdAtSec?: number;
}): Omit<NostrEvent, 'id' | 'pubkey' | 'sig'> {
  const created_at = args.createdAtSec ?? Math.floor(Date.now() / 1000);
  const winPct = Math.round(args.winProbabilityForWinner * 100);
  const content = args.matchPayload
    ? JSON.stringify({ ...args.matchPayload, summary: args.summary })
    : args.summary;
  return {
    kind: NSG_ARENA_MATCH_KIND,
    content,
    created_at,
    tags: [
      ['t', ARENA_COMMUNITY_TAG],
      ['t', ARENA_MATCH_TAG],
      ['e', args.registrationEventId],
      ['winner', args.winnerPubkey],
      ['p-a', args.fighterA.pubkey],
      ['n-a', args.fighterA.name],
      ['cr-a', String(args.fighterA.combatRating)],
      ['p-b', args.fighterB.pubkey],
      ['n-b', args.fighterB.name],
      ['cr-b', String(args.fighterB.combatRating)],
      ['win-pct', String(winPct)],
      ['alt', 'Arena tournament match result for No Stranger Game'],
    ],
  };
}
