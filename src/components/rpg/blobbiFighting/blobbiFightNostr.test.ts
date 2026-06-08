import { describe, expect, it } from 'vitest';

import {
  findMatchForRegistration,
  isOpenRegistrationSupersededByMatch,
  isRegistrationConsumed,
  listActiveOpenRegistrations,
  type BlobbiFightMatchResult,
  type BlobbiFightOpenRegistration,
} from './blobbiFightNostr';
import { NSG_BLOBBI_FIGHT_OPEN_KIND } from './constants';

const PUBKEY_A = 'aa'.repeat(32);
const PUBKEY_B = 'bb'.repeat(32);

function openEvent(args: {
  id: string;
  pubkey: string;
  createdAt: number;
}): import('@nostrify/nostrify').NostrEvent {
  return {
    id: args.id,
    pubkey: args.pubkey,
    kind: NSG_BLOBBI_FIGHT_OPEN_KIND,
    content: '',
    created_at: args.createdAt,
    tags: [
      ['d', 'blobbi-fight-open'],
      ['t', 'no-stranger-game'],
      ['t', 'blobbi-fight-open'],
      ['owner-name', 'Player'],
      ['blobbi-id', 'blobbi-1'],
      ['blobbi-name', 'Sprout'],
      ['stage', 'baby'],
      ['health', '8'],
    ],
    sig: 'sig',
  };
}

function openRow(args: {
  eventId: string;
  pubkey: string;
  createdAt: number;
}): BlobbiFightOpenRegistration {
  return {
    eventId: args.eventId,
    pubkey: args.pubkey,
    ownerName: 'Player',
    blobbiId: 'blobbi-1',
    blobbiName: 'Sprout',
    stage: 'baby',
    health: 8,
    createdAt: args.createdAt,
  };
}

function matchRow(args: {
  eventId: string;
  atSec: number;
  fighterAPubkey?: string;
  fighterBPubkey?: string;
  registrationEventId?: string;
}): BlobbiFightMatchResult {
  const fighterA = {
    ownerPubkey: args.fighterAPubkey ?? PUBKEY_A,
    ownerName: 'A',
    blobbiId: 'a',
    blobbiName: 'Alpha',
    stage: 'baby',
    health: 8,
  };
  const fighterB = {
    ownerPubkey: args.fighterBPubkey ?? PUBKEY_B,
    ownerName: 'B',
    blobbiId: 'b',
    blobbiName: 'Beta',
    stage: 'baby',
    health: 7,
  };
  return {
    eventId: args.eventId,
    pubkey: PUBKEY_A,
    fighterA,
    fighterB,
    winnerOwnerPubkey: fighterA.ownerPubkey,
    registrationEventId: args.registrationEventId ?? 'reg-old',
    summary: 'test',
    winProbabilityForWinner: 0.5,
    atMs: args.atSec * 1000,
  };
}

describe('isOpenRegistrationSupersededByMatch', () => {
  it('marks queue rows stale when a later match involved that owner', () => {
    const open = openRow({ eventId: 'open-1', pubkey: PUBKEY_A, createdAt: 100 });
    const matches = [matchRow({ eventId: 'm1', atSec: 105, fighterAPubkey: PUBKEY_A })];
    expect(isOpenRegistrationSupersededByMatch(open, matches)).toBe(true);
  });

  it('keeps new queue rows after prior fights', () => {
    const open = openRow({ eventId: 'open-2', pubkey: PUBKEY_A, createdAt: 200 });
    const matches = [matchRow({ eventId: 'm1', atSec: 105, fighterAPubkey: PUBKEY_A })];
    expect(isOpenRegistrationSupersededByMatch(open, matches)).toBe(false);
  });
});

describe('listActiveOpenRegistrations', () => {
  it('shows returning players who queue again after fighting', () => {
    const events = [openEvent({ id: 'open-new', pubkey: PUBKEY_A, createdAt: 200 })];
    const matches = [matchRow({ eventId: 'm1', atSec: 105, fighterAPubkey: PUBKEY_A })];
    const active = listActiveOpenRegistrations(events, new Set(), matches);
    expect(active).toHaveLength(1);
    expect(active[0]?.eventId).toBe('open-new');
  });

  it('hides unconsumed joiner queue rows superseded by a match', () => {
    const events = [openEvent({ id: 'open-joiner', pubkey: PUBKEY_B, createdAt: 102 })];
    const matches = [
      matchRow({
        eventId: 'm1',
        atSec: 103,
        fighterAPubkey: PUBKEY_A,
        fighterBPubkey: PUBKEY_B,
      }),
    ];
    const active = listActiveOpenRegistrations(events, new Set(), matches);
    expect(active).toHaveLength(0);
  });
});

describe('queue pairing helpers', () => {
  it('isRegistrationConsumed tracks consumed opponent opens only', () => {
    const consumed = new Set(['open-joiner']);
    expect(isRegistrationConsumed(consumed, 'open-joiner')).toBe(true);
    expect(isRegistrationConsumed(consumed, 'open-other')).toBe(false);
  });

  it('findMatchForRegistration finds match by opponent registration id', () => {
    const match = matchRow({
      eventId: 'm1',
      atSec: 103,
      registrationEventId: 'open-joiner',
    });
    expect(findMatchForRegistration([match], 'open-joiner')?.eventId).toBe('m1');
    expect(findMatchForRegistration([match], 'missing')).toBeUndefined();
  });
});
