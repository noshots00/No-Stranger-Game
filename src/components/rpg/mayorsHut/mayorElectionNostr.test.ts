import { describe, expect, it } from 'vitest';

import type { NostrEvent } from '@nostrify/nostrify';

import {
  applyMayorElectionEventToSnapshot,
  buildMayorElectionSnapshot,
  buildMayorVoteDraft,
  buildMayorVoteWithdrawDraft,
  mergeMayorElectionSnapshots,
  parseMayorVote,
} from './mayorElectionNostr';

const candidatePubkey = 'aaa1111111111111111111111111111111111111111111111111111111111';
const voterPubkey = 'bbb2222222222222222222222222222222222222222222222222222222222';

const candidateEvent: NostrEvent = {
  id: 'c1',
  pubkey: candidatePubkey,
  kind: 30338,
  created_at: 100,
  tags: [
    ['d', 'village-mayor-candidate'],
    ['t', 'village'],
    ['t', 'mayor-candidate'],
    ['candidate-name', 'Ada'],
    ['status', 'active'],
  ],
  content: '',
  sig: 'sig',
};

describe('mayor election snapshot', () => {
  it('does not treat candidacy as a vote', () => {
    const snapshot = buildMayorElectionSnapshot([candidateEvent], []);
    expect(snapshot.votes).toHaveLength(0);
    expect(snapshot.voteCountByCandidate[candidatePubkey]).toBe(0);
    expect(parseMayorVote(candidateEvent)).toBeNull();
  });

  it('counts only kind 30339 vote events', () => {
    const voteEvent: NostrEvent = {
      id: 'v1',
      pubkey: voterPubkey,
      kind: 30339,
      created_at: 101,
      tags: [
        ['d', 'village-mayor-vote'],
        ['t', 'village'],
        ['t', 'mayor-vote'],
        ['status', 'active'],
        ['candidate', candidatePubkey],
        ['voter-name', 'Bob'],
      ],
      content: '',
      sig: 'sig',
    };
    const snapshot = buildMayorElectionSnapshot([candidateEvent], [voteEvent]);
    expect(snapshot.votes).toHaveLength(1);
    expect(snapshot.voteCountByCandidate[candidatePubkey]).toBe(1);
  });

  it('ignores a later withdrawn vote row for the same voter', () => {
    const voteEvent: NostrEvent = {
      id: 'v1',
      pubkey: voterPubkey,
      kind: 30339,
      created_at: 101,
      tags: [
        ['d', 'village-mayor-vote'],
        ['t', 'village'],
        ['t', 'mayor-vote'],
        ['status', 'active'],
        ['candidate', candidatePubkey],
        ['voter-name', 'Bob'],
      ],
      content: '',
      sig: 'sig',
    };
    const withdrawnEvent: NostrEvent = {
      ...buildMayorVoteWithdrawDraft({ voterName: 'Bob' }),
      id: 'v2',
      pubkey: voterPubkey,
      sig: 'sig',
      created_at: 102,
    };
    const snapshot = buildMayorElectionSnapshot([candidateEvent], [voteEvent, withdrawnEvent]);
    expect(snapshot.votes).toHaveLength(0);
    expect(snapshot.voteCountByCandidate[candidatePubkey]).toBe(0);
  });

  it('applies a local vote immediately before relay refresh', () => {
    const empty = buildMayorElectionSnapshot([candidateEvent], []);
    const voteEvent: NostrEvent = {
      ...buildMayorVoteDraft({ candidatePubkey, voterName: 'Bob' }),
      id: 'v1',
      pubkey: voterPubkey,
      sig: 'sig',
      created_at: 101,
    };
    const patched = applyMayorElectionEventToSnapshot(empty, voteEvent);
    expect(patched.votes).toHaveLength(1);
    expect(patched.voteCountByCandidate[candidatePubkey]).toBe(1);
  });

  it('keeps a local vote when relay refresh is still stale', () => {
    const voteEvent: NostrEvent = {
      ...buildMayorVoteDraft({ candidatePubkey, voterName: 'Bob' }),
      id: 'v1',
      pubkey: voterPubkey,
      sig: 'sig',
      created_at: 101,
    };
    const local = applyMayorElectionEventToSnapshot(
      buildMayorElectionSnapshot([candidateEvent], []),
      voteEvent
    );
    const remote = buildMayorElectionSnapshot([candidateEvent], []);
    const merged = mergeMayorElectionSnapshots(local, remote);
    expect(merged.votes).toHaveLength(1);
    expect(merged.voteCountByCandidate[candidatePubkey]).toBe(1);
  });

  it('keeps a local withdraw when relay refresh is still stale', () => {
    const voteEvent: NostrEvent = {
      id: 'v1',
      pubkey: voterPubkey,
      kind: 30339,
      created_at: 101,
      tags: [
        ['d', 'village-mayor-vote'],
        ['t', 'village'],
        ['t', 'mayor-vote'],
        ['status', 'active'],
        ['candidate', candidatePubkey],
        ['voter-name', 'Bob'],
      ],
      content: '',
      sig: 'sig',
    };
    const remoteWithVote = buildMayorElectionSnapshot([candidateEvent], [voteEvent]);
    const withdrawnEvent: NostrEvent = {
      ...buildMayorVoteWithdrawDraft({ voterName: 'Bob' }),
      id: 'v2',
      pubkey: voterPubkey,
      sig: 'sig',
      created_at: 102,
    };
    const local = applyMayorElectionEventToSnapshot(remoteWithVote, withdrawnEvent);
    const merged = mergeMayorElectionSnapshots(local, remoteWithVote);
    expect(merged.votes).toHaveLength(0);
    expect(merged.voteCountByCandidate[candidatePubkey]).toBe(0);
  });
});
