import type { NostrEvent } from '@nostrify/nostrify';

import { pubkeysEqual } from '@/lib/nostrPubkey';
import {
  blobbiToFighter,
  buildMatchSummaryContent,
  getWinProbability,
  rollBlobbiWinner,
} from './blobbiCombat';
import {
  buildMatchResultDraft,
  openRegistrationToFighter,
  parseBlobbiFightMatchResult,
  type BlobbiFightMatchResult,
  type BlobbiFightOpenRegistration,
  type BlobbiFighterSnapshot,
} from './blobbiFightNostr';
import type { BlobbiSnapshot } from './blobbiStateNostr';

type PublishFn = (
  draft: Omit<NostrEvent, 'id' | 'pubkey' | 'sig'>
) => Promise<unknown>;

export async function publishBlobbiMatchResult(args: {
  publish: PublishFn;
  opponent: BlobbiFightOpenRegistration;
  me: BlobbiFighterSnapshot;
  myPubkey: string;
}): Promise<BlobbiFightMatchResult | null> {
  const fighterA = openRegistrationToFighter(args.opponent);
  const fighterB = args.me;
  const winnerOwnerPubkey = rollBlobbiWinner(fighterA, fighterB);
  const winnerFighter = pubkeysEqual(winnerOwnerPubkey, fighterA.ownerPubkey) ? fighterA : fighterB;
  const loserFighter = pubkeysEqual(winnerOwnerPubkey, fighterA.ownerPubkey) ? fighterB : fighterA;
  const prob = getWinProbability(winnerFighter.health, loserFighter.health);
  const summary = buildMatchSummaryContent(
    winnerFighter.blobbiName,
    loserFighter.blobbiName,
    winnerFighter.health,
    loserFighter.health,
    prob
  );

  const matchDraft = buildMatchResultDraft({
    fighterA,
    fighterB,
    winnerOwnerPubkey,
    registrationEventId: args.opponent.eventId,
    summary,
    winProbabilityForWinner: prob,
  });
  const matchEvent = (await args.publish(matchDraft)) as NostrEvent;
  return parseBlobbiFightMatchResult(matchEvent);
}

export async function publishBlobbiMatchFromBlobbi(args: {
  publish: PublishFn;
  opponent: BlobbiFightOpenRegistration;
  selectedBlobbi: BlobbiSnapshot;
  myPubkey: string;
  playerName: string;
}): Promise<BlobbiFightMatchResult | null> {
  const me = blobbiToFighter(args.selectedBlobbi, args.myPubkey, args.playerName);
  return publishBlobbiMatchResult({
    publish: args.publish,
    opponent: args.opponent,
    me,
    myPubkey: args.myPubkey,
  });
}

export async function publishBlobbiMatchFromOpenRegistration(args: {
  publish: PublishFn;
  opponent: BlobbiFightOpenRegistration;
  myOpen: BlobbiFightOpenRegistration;
  myPubkey: string;
}): Promise<BlobbiFightMatchResult | null> {
  const me = openRegistrationToFighter(args.myOpen);
  return publishBlobbiMatchResult({
    publish: args.publish,
    opponent: args.opponent,
    me,
    myPubkey: args.myPubkey,
  });
}
