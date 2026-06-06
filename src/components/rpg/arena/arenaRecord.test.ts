import { describe, expect, it } from 'vitest';

import { COMMUNITY_EVENT_EPOCH_UNIX } from '@/lib/communityEventEpoch';

import { createEmptyArenaRecord, reconcileArenaRecordForEpoch } from './arenaRecord';

describe('reconcileArenaRecordForEpoch', () => {
  it('removes fights before the community epoch', () => {
    const epochMs = COMMUNITY_EVENT_EPOCH_UNIX * 1000;
    const reconciled = reconcileArenaRecordForEpoch({
      wins: 2,
      losses: 1,
      fights: [
        {
          matchEventId: 'old',
          opponentName: 'Ghost',
          opponentPubkey: 'abc',
          won: true,
          myCombatRating: 10,
          opponentCombatRating: 8,
          atMs: epochMs - 1000,
        },
        {
          matchEventId: 'new',
          opponentName: 'Rival',
          opponentPubkey: 'def',
          won: false,
          myCombatRating: 10,
          opponentCombatRating: 12,
          atMs: epochMs,
        },
      ],
    });

    expect(reconciled.fights).toHaveLength(1);
    expect(reconciled.fights[0]?.matchEventId).toBe('new');
    expect(reconciled.wins).toBe(0);
    expect(reconciled.losses).toBe(1);
  });

  it('returns the same record when already epoch-clean', () => {
    const record = createEmptyArenaRecord();
    expect(reconcileArenaRecordForEpoch(record)).toBe(record);
  });
});
