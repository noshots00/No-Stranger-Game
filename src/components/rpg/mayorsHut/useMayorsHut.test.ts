import { describe, expect, it } from 'vitest';

import type { MayorElectionSnapshot } from './mayorElectionNostr';
import { buildMayorElectionSnapshot } from './mayorElectionNostr';
import { shouldRejectEmptyElectionRefresh } from './useMayorsHut';

const candidateEvent = {
  id: '1',
  pubkey: 'abc123',
  kind: 30338 as const,
  created_at: 1,
  tags: [
    ['d', 'village-mayor-candidate'],
    ['t', 'mayor-candidate'],
    ['candidate-name', 'Ada'],
    ['status', 'active'],
  ],
  content: '',
  sig: 'sig',
};

function snapshotWithCandidates(): MayorElectionSnapshot {
  return buildMayorElectionSnapshot([candidateEvent], []);
}

describe('shouldRejectEmptyElectionRefresh', () => {
  it('allows first load with no candidates', () => {
    const next = buildMayorElectionSnapshot([], []);
    expect(shouldRejectEmptyElectionRefresh(undefined, next)).toBe(false);
  });

  it('rejects refresh that wipes prior election data', () => {
    const prev = snapshotWithCandidates();
    const next = buildMayorElectionSnapshot([], []);
    expect(prev.candidates.length).toBeGreaterThan(0);
    expect(shouldRejectEmptyElectionRefresh(prev, next)).toBe(true);
  });

  it('accepts refresh that still has candidates', () => {
    const prev = snapshotWithCandidates();
    const next = snapshotWithCandidates();
    expect(shouldRejectEmptyElectionRefresh(prev, next)).toBe(false);
  });
});
