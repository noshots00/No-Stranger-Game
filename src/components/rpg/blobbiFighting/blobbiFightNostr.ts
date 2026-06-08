import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';

import { normalizePubkeyHex, pubkeysEqual } from '@/lib/nostrPubkey';
import {
  BLOBBI_FIGHT_COMMUNITY_TAG,
  BLOBBI_FIGHT_MATCH_TAG,
  BLOBBI_FIGHT_OPEN_D_TAG,
  BLOBBI_FIGHT_OPEN_QUEUE_TAG,
  BLOBBI_FIGHT_QUERY_LIMIT_MATCHES,
  BLOBBI_FIGHT_QUERY_LIMIT_OPEN,
  NSG_BLOBBI_FIGHT_MATCH_KIND,
  NSG_BLOBBI_FIGHT_OPEN_KIND,
} from './constants';

export type BlobbiFighterSnapshot = {
  ownerPubkey: string;
  ownerName: string;
  blobbiId: string;
  blobbiName: string;
  stage: string;
  health: number;
};

export type BlobbiFightOpenRegistration = {
  eventId: string;
  pubkey: string;
  ownerName: string;
  blobbiId: string;
  blobbiName: string;
  stage: string;
  health: number;
  createdAt: number;
};

export type BlobbiFightMatchResult = {
  eventId: string;
  pubkey: string;
  fighterA: BlobbiFighterSnapshot;
  fighterB: BlobbiFighterSnapshot;
  winnerOwnerPubkey: string;
  registrationEventId: string;
  summary: string;
  winProbabilityForWinner: number;
  atMs: number;
};

const tagValue = (event: NostrEvent, name: string): string | undefined =>
  event.tags.find(([n]) => n === name)?.[1];

const tagValues = (event: NostrEvent, name: string): string[] =>
  event.tags.filter(([n]) => n === name).map((t) => t[1]).filter(Boolean) as string[];

const fighterFromEvent = (
  event: NostrEvent,
  prefix: 'a' | 'b'
): BlobbiFighterSnapshot | null => {
  const ownerPubkey = tagValue(event, `owner-${prefix}`);
  const ownerName = tagValue(event, `n-${prefix}`);
  const blobbiId = tagValue(event, `blobbi-${prefix}-id`);
  const blobbiName = tagValue(event, `blobbi-${prefix}-name`);
  const stage = tagValue(event, `stage-${prefix}`);
  const healthRaw = tagValue(event, `hp-${prefix}`);
  if (!ownerPubkey || !ownerName || !blobbiId || !blobbiName || !stage || !healthRaw) {
    return null;
  }
  const health = Number.parseInt(healthRaw, 10);
  if (!Number.isFinite(health)) return null;
  return {
    ownerPubkey,
    ownerName,
    blobbiId,
    blobbiName,
    stage,
    health,
  };
};

export function parseBlobbiFightOpenRegistration(
  event: NostrEvent
): BlobbiFightOpenRegistration | null {
  if (event.kind !== NSG_BLOBBI_FIGHT_OPEN_KIND) return null;
  const d = tagValue(event, 'd');
  if (d !== BLOBBI_FIGHT_OPEN_D_TAG) return null;
  const statusRaw = tagValue(event, 'status');
  if (statusRaw === 'withdrawn') return null;
  const ownerName = tagValue(event, 'owner-name')?.trim();
  const blobbiId = tagValue(event, 'blobbi-id')?.trim();
  const blobbiName = tagValue(event, 'blobbi-name')?.trim();
  const stage = tagValue(event, 'stage')?.trim();
  const healthRaw = tagValue(event, 'health');
  if (!ownerName || !blobbiId || !blobbiName || !stage || !healthRaw) return null;
  const health = Number.parseInt(healthRaw, 10);
  if (!Number.isFinite(health)) return null;
  return {
    eventId: event.id,
    pubkey: event.pubkey,
    ownerName,
    blobbiId,
    blobbiName,
    stage,
    health,
    createdAt: event.created_at,
  };
}

export function parseBlobbiFightMatchResult(event: NostrEvent): BlobbiFightMatchResult | null {
  if (event.kind !== NSG_BLOBBI_FIGHT_MATCH_KIND) return null;
  if (!event.tags.some(([n, v]) => n === 't' && v === BLOBBI_FIGHT_MATCH_TAG)) return null;

  const fighterA = fighterFromEvent(event, 'a');
  const fighterB = fighterFromEvent(event, 'b');
  const winnerOwnerPubkey = tagValue(event, 'winner-owner');
  const registrationEventId = tagValues(event, 'e')[0];
  if (!fighterA || !fighterB || !winnerOwnerPubkey || !registrationEventId) return null;
  if (
    winnerOwnerPubkey !== fighterA.ownerPubkey &&
    winnerOwnerPubkey !== fighterB.ownerPubkey
  ) {
    return null;
  }

  const probRaw = tagValue(event, 'win-pct');
  const winProbabilityForWinner =
    probRaw !== undefined ? Number.parseInt(probRaw, 10) / 100 : 0.5;

  return {
    eventId: event.id,
    pubkey: event.pubkey,
    fighterA,
    fighterB,
    winnerOwnerPubkey,
    registrationEventId,
    summary: event.content.trim() || `${fighterA.blobbiName} vs ${fighterB.blobbiName}`,
    winProbabilityForWinner: Number.isFinite(winProbabilityForWinner)
      ? winProbabilityForWinner
      : 0.5,
    atMs: event.created_at * 1000,
  };
}

export const blobbiFightOpenFilter = (): NostrFilter => ({
  kinds: [NSG_BLOBBI_FIGHT_OPEN_KIND],
  '#d': [BLOBBI_FIGHT_OPEN_D_TAG],
  '#t': [BLOBBI_FIGHT_OPEN_QUEUE_TAG],
  limit: BLOBBI_FIGHT_QUERY_LIMIT_OPEN,
});

export const blobbiFightMatchFilter = (): NostrFilter => ({
  kinds: [NSG_BLOBBI_FIGHT_MATCH_KIND],
  '#t': [BLOBBI_FIGHT_MATCH_TAG],
  limit: BLOBBI_FIGHT_QUERY_LIMIT_MATCHES,
});

export function getConsumedRegistrationIds(
  matches: readonly BlobbiFightMatchResult[]
): Set<string> {
  return new Set(matches.map((m) => m.registrationEventId));
}

export function openRegistrationToFighter(
  open: BlobbiFightOpenRegistration
): BlobbiFighterSnapshot {
  return {
    ownerPubkey: open.pubkey,
    ownerName: open.ownerName,
    blobbiId: open.blobbiId,
    blobbiName: open.blobbiName,
    stage: open.stage,
    health: Math.max(1, open.health),
  };
}

/** Open queue row is stale once this owner fought in a match at or after they queued. */
export function isOpenRegistrationSupersededByMatch(
  open: BlobbiFightOpenRegistration,
  matches: readonly BlobbiFightMatchResult[]
): boolean {
  const queuedAtMs = open.createdAt * 1000;
  return matches.some(
    (match) => matchInvolvesOwner(match, open.pubkey) && match.atMs >= queuedAtMs
  );
}

export function listActiveOpenRegistrations(
  events: readonly NostrEvent[],
  consumedIds: ReadonlySet<string>,
  matches: readonly BlobbiFightMatchResult[] = []
): BlobbiFightOpenRegistration[] {
  const byPubkey = new Map<string, BlobbiFightOpenRegistration>();
  for (const event of events) {
    const row = parseBlobbiFightOpenRegistration(event);
    if (!row || consumedIds.has(row.eventId)) continue;
    if (isOpenRegistrationSupersededByMatch(row, matches)) continue;
    const prev = byPubkey.get(row.pubkey);
    if (!prev || row.createdAt >= prev.createdAt) byPubkey.set(row.pubkey, row);
  }
  return Array.from(byPubkey.values()).sort((a, b) => a.createdAt - b.createdAt);
}

export function findMyOpenRegistration(
  openList: readonly BlobbiFightOpenRegistration[],
  myPubkey: string
): BlobbiFightOpenRegistration | undefined {
  return openList.find((r) => pubkeysEqual(r.pubkey, myPubkey));
}

export function findOldestOpponentOpen(
  openList: readonly BlobbiFightOpenRegistration[],
  myPubkey: string
): BlobbiFightOpenRegistration | undefined {
  return openList.find((r) => !pubkeysEqual(r.pubkey, myPubkey));
}

/** True when this client should publish the match (joiner), not the earlier waiter. */
export function shouldInitiateBlobbiMatch(
  myOpen: BlobbiFightOpenRegistration,
  opponentOpen: BlobbiFightOpenRegistration
): boolean {
  if (myOpen.createdAt > opponentOpen.createdAt) return true;
  if (myOpen.createdAt < opponentOpen.createdAt) return false;
  return normalizePubkeyHex(myOpen.pubkey) > normalizePubkeyHex(opponentOpen.pubkey);
}

export function findMatchForRegistration(
  matches: readonly BlobbiFightMatchResult[],
  registrationEventId: string
): BlobbiFightMatchResult | undefined {
  return matches.find((match) => match.registrationEventId === registrationEventId);
}

export function isRegistrationConsumed(
  consumedIds: ReadonlySet<string>,
  registrationEventId: string
): boolean {
  return consumedIds.has(registrationEventId);
}

/** @deprecated Prefer isRegistrationConsumed — blocks rematches even after a new queue. */
export function matchAlreadyExistsBetween(
  matches: readonly BlobbiFightMatchResult[],
  pubkeyA: string,
  pubkeyB: string
): boolean {
  const a = normalizePubkeyHex(pubkeyA);
  const b = normalizePubkeyHex(pubkeyB);
  return matches.some((match) => {
    const ma = normalizePubkeyHex(match.fighterA.ownerPubkey);
    const mb = normalizePubkeyHex(match.fighterB.ownerPubkey);
    return (ma === a && mb === b) || (ma === b && mb === a);
  });
}

export function findMyLatestMatch(
  matches: readonly BlobbiFightMatchResult[],
  myPubkey: string
): BlobbiFightMatchResult | undefined {
  return matches.find((match) => matchInvolvesOwner(match, myPubkey));
}

export function buildOpenRegistrationDraft(args: {
  ownerName: string;
  blobbiId: string;
  blobbiName: string;
  stage: string;
  health: number;
  createdAtSec?: number;
}): Omit<NostrEvent, 'id' | 'pubkey' | 'sig'> {
  const created_at = args.createdAtSec ?? Math.floor(Date.now() / 1000);
  return {
    kind: NSG_BLOBBI_FIGHT_OPEN_KIND,
    content: '',
    created_at,
    tags: [
      ['d', BLOBBI_FIGHT_OPEN_D_TAG],
      ['t', BLOBBI_FIGHT_COMMUNITY_TAG],
      ['t', BLOBBI_FIGHT_OPEN_QUEUE_TAG],
      ['status', 'active'],
      ['owner-name', args.ownerName],
      ['blobbi-id', args.blobbiId],
      ['blobbi-name', args.blobbiName],
      ['stage', args.stage],
      ['health', String(args.health)],
      ['alt', 'Blobbi Fighting open registration for No Stranger Game'],
    ],
  };
}

export function buildOpenRegistrationWithdrawDraft(args: {
  ownerName: string;
  createdAtSec?: number;
}): Omit<NostrEvent, 'id' | 'pubkey' | 'sig'> {
  const created_at = args.createdAtSec ?? Math.floor(Date.now() / 1000);
  return {
    kind: NSG_BLOBBI_FIGHT_OPEN_KIND,
    content: '',
    created_at,
    tags: [
      ['d', BLOBBI_FIGHT_OPEN_D_TAG],
      ['t', BLOBBI_FIGHT_COMMUNITY_TAG],
      ['t', BLOBBI_FIGHT_OPEN_QUEUE_TAG],
      ['status', 'withdrawn'],
      ['owner-name', args.ownerName],
      ['alt', 'Blobbi Fighting queue withdrawal for No Stranger Game'],
    ],
  };
}

export function buildMatchResultDraft(args: {
  fighterA: BlobbiFighterSnapshot;
  fighterB: BlobbiFighterSnapshot;
  winnerOwnerPubkey: string;
  registrationEventId: string;
  summary: string;
  winProbabilityForWinner: number;
  createdAtSec?: number;
}): Omit<NostrEvent, 'id' | 'pubkey' | 'sig'> {
  const created_at = args.createdAtSec ?? Math.floor(Date.now() / 1000);
  const winPct = Math.round(args.winProbabilityForWinner * 100);
  return {
    kind: NSG_BLOBBI_FIGHT_MATCH_KIND,
    content: args.summary,
    created_at,
    tags: [
      ['t', BLOBBI_FIGHT_COMMUNITY_TAG],
      ['t', BLOBBI_FIGHT_MATCH_TAG],
      ['e', args.registrationEventId],
      ['winner-owner', args.winnerOwnerPubkey],
      ['owner-a', args.fighterA.ownerPubkey],
      ['n-a', args.fighterA.ownerName],
      ['blobbi-a-id', args.fighterA.blobbiId],
      ['blobbi-a-name', args.fighterA.blobbiName],
      ['stage-a', args.fighterA.stage],
      ['hp-a', String(args.fighterA.health)],
      ['owner-b', args.fighterB.ownerPubkey],
      ['n-b', args.fighterB.ownerName],
      ['blobbi-b-id', args.fighterB.blobbiId],
      ['blobbi-b-name', args.fighterB.blobbiName],
      ['stage-b', args.fighterB.stage],
      ['hp-b', String(args.fighterB.health)],
      ['win-pct', String(winPct)],
      ['alt', 'Blobbi Fighting match result for No Stranger Game'],
    ],
  };
}

export function matchInvolvesOwner(match: BlobbiFightMatchResult, ownerPubkey: string): boolean {
  return (
    pubkeysEqual(match.fighterA.ownerPubkey, ownerPubkey) ||
    pubkeysEqual(match.fighterB.ownerPubkey, ownerPubkey)
  );
}

export function myFighterInMatch(
  match: BlobbiFightMatchResult,
  ownerPubkey: string
): BlobbiFighterSnapshot | undefined {
  if (pubkeysEqual(match.fighterA.ownerPubkey, ownerPubkey)) return match.fighterA;
  if (pubkeysEqual(match.fighterB.ownerPubkey, ownerPubkey)) return match.fighterB;
  return undefined;
}

export function opponentFighterInMatch(
  match: BlobbiFightMatchResult,
  ownerPubkey: string
): BlobbiFighterSnapshot | undefined {
  if (pubkeysEqual(match.fighterA.ownerPubkey, ownerPubkey)) return match.fighterB;
  if (pubkeysEqual(match.fighterB.ownerPubkey, ownerPubkey)) return match.fighterA;
  return undefined;
}
