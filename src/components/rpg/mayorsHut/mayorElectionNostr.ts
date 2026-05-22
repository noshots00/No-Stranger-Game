import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { PLACEHOLDER_MAYOR_NAME } from './constants';
import {
  MAYOR_CANDIDATE_D_TAG,
  MAYOR_CANDIDATE_TAG,
  MAYOR_ELECTION_COMMUNITY_TAG,
  MAYOR_ELECTION_QUERY_LIMIT,
  MAYOR_VOTE_D_TAG,
  MAYOR_VOTE_TAG,
  NSG_MAYOR_CANDIDATE_KIND,
  NSG_MAYOR_VOTE_KIND,
  type MayorCandidateStatus,
} from './constants';

export type MayorCandidateView = {
  pubkey: string;
  name: string;
  status: MayorCandidateStatus;
  eventId: string;
  updatedAt: number;
};

export type MayorVoteView = {
  voterPubkey: string;
  voterName: string;
  candidatePubkey: string;
  eventId: string;
  updatedAt: number;
};

export type MayorElectionSnapshot = {
  candidates: MayorCandidateView[];
  activeCandidates: MayorCandidateView[];
  votes: MayorVoteView[];
  voteCountByCandidate: Record<string, number>;
  mayorName: string;
  mayorPubkey: string | null;
  isPlaceholderMayor: boolean;
};

const tagValue = (event: NostrEvent, name: string): string | undefined =>
  event.tags.find(([n]) => n === name)?.[1];

export function parseMayorCandidate(event: NostrEvent): MayorCandidateView | null {
  if (event.kind !== NSG_MAYOR_CANDIDATE_KIND) return null;
  if (tagValue(event, 'd') !== MAYOR_CANDIDATE_D_TAG) return null;
  if (!event.tags.some(([n, v]) => n === 't' && v === MAYOR_CANDIDATE_TAG)) return null;

  const name = tagValue(event, 'candidate-name')?.trim();
  if (!name) return null;

  const statusRaw = tagValue(event, 'status');
  const status: MayorCandidateStatus = statusRaw === 'withdrawn' ? 'withdrawn' : 'active';

  return {
    pubkey: event.pubkey,
    name,
    status,
    eventId: event.id,
    updatedAt: event.created_at,
  };
}

export function parseMayorVote(event: NostrEvent): MayorVoteView | null {
  if (event.kind !== NSG_MAYOR_VOTE_KIND) return null;
  if (tagValue(event, 'd') !== MAYOR_VOTE_D_TAG) return null;
  if (!event.tags.some(([n, v]) => n === 't' && v === MAYOR_VOTE_TAG)) return null;

  const candidatePubkey = tagValue(event, 'candidate')?.trim();
  const voterName = tagValue(event, 'voter-name')?.trim() ?? 'Stranger';
  if (!candidatePubkey || candidatePubkey.length < 8) return null;

  return {
    voterPubkey: event.pubkey,
    voterName,
    candidatePubkey,
    eventId: event.id,
    updatedAt: event.created_at,
  };
}

export const mayorCandidateFilter = (): NostrFilter => ({
  kinds: [NSG_MAYOR_CANDIDATE_KIND],
  '#t': [MAYOR_CANDIDATE_TAG],
  limit: MAYOR_ELECTION_QUERY_LIMIT,
});

export const mayorVoteFilter = (): NostrFilter => ({
  kinds: [NSG_MAYOR_VOTE_KIND],
  '#t': [MAYOR_VOTE_TAG],
  limit: MAYOR_ELECTION_QUERY_LIMIT,
});

/** Latest candidacy per pubkey (replaceable `d` per author). */
export function latestMayorCandidates(events: readonly NostrEvent[]): MayorCandidateView[] {
  const byPubkey = new Map<string, MayorCandidateView>();
  for (const event of events) {
    const row = parseMayorCandidate(event);
    if (!row) continue;
    const prev = byPubkey.get(row.pubkey);
    if (!prev || event.created_at >= prev.updatedAt) {
      byPubkey.set(row.pubkey, row);
    }
  }
  return Array.from(byPubkey.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/** Latest vote per voter pubkey. */
export function latestMayorVotes(events: readonly NostrEvent[]): MayorVoteView[] {
  const byVoter = new Map<string, MayorVoteView>();
  for (const event of events) {
    const row = parseMayorVote(event);
    if (!row) continue;
    const prev = byVoter.get(row.voterPubkey);
    if (!prev || event.created_at >= prev.updatedAt) {
      byVoter.set(row.voterPubkey, row);
    }
  }
  return Array.from(byVoter.values());
}

export function buildMayorElectionSnapshot(
  candidateEvents: readonly NostrEvent[],
  voteEvents: readonly NostrEvent[]
): MayorElectionSnapshot {
  const candidates = latestMayorCandidates(candidateEvents);
  const activeCandidates = candidates.filter((c) => c.status === 'active');
  const activePubkeys = new Set(activeCandidates.map((c) => c.pubkey));
  const votes = latestMayorVotes(voteEvents).filter((v) => activePubkeys.has(v.candidatePubkey));

  const voteCountByCandidate: Record<string, number> = {};
  for (const c of activeCandidates) {
    voteCountByCandidate[c.pubkey] = 0;
  }
  for (const v of votes) {
    voteCountByCandidate[v.candidatePubkey] = (voteCountByCandidate[v.candidatePubkey] ?? 0) + 1;
  }

  let mayorPubkey: string | null = null;
  let topVotes = 0;
  let tie = false;

  for (const c of activeCandidates) {
    const count = voteCountByCandidate[c.pubkey] ?? 0;
    if (count > topVotes) {
      topVotes = count;
      mayorPubkey = c.pubkey;
      tie = false;
    } else if (count === topVotes && count > 0) {
      tie = true;
    }
  }

  const isPlaceholderMayor = topVotes === 0 || tie || !mayorPubkey;
  const mayorName = isPlaceholderMayor
    ? PLACEHOLDER_MAYOR_NAME
    : (activeCandidates.find((c) => c.pubkey === mayorPubkey)?.name ?? PLACEHOLDER_MAYOR_NAME);

  return {
    candidates,
    activeCandidates,
    votes,
    voteCountByCandidate,
    mayorName,
    mayorPubkey: isPlaceholderMayor ? null : mayorPubkey,
    isPlaceholderMayor,
  };
}

export function buildMayorCandidateDraft(args: {
  candidateName: string;
  status: MayorCandidateStatus;
}): Omit<NostrEvent, 'id' | 'pubkey' | 'sig'> {
  return {
    kind: NSG_MAYOR_CANDIDATE_KIND,
    content: '',
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['d', MAYOR_CANDIDATE_D_TAG],
      ['t', MAYOR_ELECTION_COMMUNITY_TAG],
      ['t', MAYOR_CANDIDATE_TAG],
      ['candidate-name', args.candidateName],
      ['status', args.status],
      ['alt', 'Village mayor election candidacy for No Stranger Game'],
    ],
  };
}

export function buildMayorVoteDraft(args: {
  candidatePubkey: string;
  voterName: string;
}): Omit<NostrEvent, 'id' | 'pubkey' | 'sig'> {
  return {
    kind: NSG_MAYOR_VOTE_KIND,
    content: '',
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['d', MAYOR_VOTE_D_TAG],
      ['t', MAYOR_ELECTION_COMMUNITY_TAG],
      ['t', MAYOR_VOTE_TAG],
      ['candidate', args.candidatePubkey],
      ['voter-name', args.voterName],
      ['alt', 'Village mayor election vote for No Stranger Game'],
    ],
  };
}
