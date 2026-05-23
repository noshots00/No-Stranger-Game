import { describe, expect, it } from 'vitest';
import type { NostrEvent } from '@nostrify/nostrify';
import { mergeRelayQueryResults } from './mergeRelayQueryResults';

function ev(partial: Partial<NostrEvent> & Pick<NostrEvent, 'id' | 'pubkey' | 'kind'>): NostrEvent {
  return {
    content: '',
    sig: 'sig',
    tags: [],
    created_at: 1,
    ...partial,
  };
}

describe('mergeRelayQueryResults', () => {
  it('dedupes by event id', () => {
    const e = ev({ id: 'a', pubkey: 'p1', kind: 1 });
    const merged = mergeRelayQueryResults([e], [e]);
    expect(merged).toHaveLength(1);
  });

  it('prefers primary replaceable row over backup with same d tag', () => {
    const primary = ev({
      id: 'p',
      pubkey: 'alice',
      kind: 30338,
      created_at: 10,
      tags: [['d', 'village-mayor-candidate']],
    });
    const backup = ev({
      id: 'b',
      pubkey: 'alice',
      kind: 30338,
      created_at: 99,
      tags: [['d', 'village-mayor-candidate']],
    });
    const merged = mergeRelayQueryResults([primary], [backup]);
    expect(merged.map((e) => e.id)).toEqual(['p']);
  });

  it('includes backup-only events', () => {
    const backupOnly = ev({ id: 'b', pubkey: 'bob', kind: 1 });
    const merged = mergeRelayQueryResults([], [backupOnly]);
    expect(merged).toHaveLength(1);
  });
});
