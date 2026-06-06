import { describe, expect, it } from 'vitest';

import {
  COMMUNITY_EVENT_EPOCH_UNIX,
  COMMUNITY_EVENT_EPOCH_YMD,
  isCommunityEventValid,
} from './communityEventEpoch';

describe('communityEventEpoch', () => {
  it('rejects community events before the epoch', () => {
    expect(
      isCommunityEventValid({
        id: 'old',
        sig: 'sig',
        pubkey: 'pk',
        kind: 30339,
        created_at: COMMUNITY_EVENT_EPOCH_UNIX - 1,
        tags: [],
        content: '',
      })
    ).toBe(false);
  });

  it('accepts community events on or after the epoch', () => {
    expect(
      isCommunityEventValid({
        id: 'new',
        sig: 'sig',
        pubkey: 'pk',
        kind: 30339,
        created_at: COMMUNITY_EVENT_EPOCH_UNIX,
        tags: [],
        content: '',
      })
    ).toBe(true);
  });

  it('does not filter non-community kinds', () => {
    expect(
      isCommunityEventValid({
        id: 'quest',
        sig: 'sig',
        pubkey: 'pk',
        kind: 10032,
        created_at: 1,
        tags: [],
        content: '{}',
      })
    ).toBe(true);
  });

  it('filters arena match kind 10050 before the epoch', () => {
    expect(
      isCommunityEventValid({
        id: 'match',
        sig: 'sig',
        pubkey: 'pk',
        kind: 10050,
        created_at: COMMUNITY_EVENT_EPOCH_UNIX - 1,
        tags: [],
        content: '',
      })
    ).toBe(false);
  });

  it('uses Eastern midnight for the configured YMD', () => {
    expect(COMMUNITY_EVENT_EPOCH_YMD).toBe('2026-06-03');
    expect(COMMUNITY_EVENT_EPOCH_UNIX).toBeGreaterThan(1_700_000_000);
  });
});
