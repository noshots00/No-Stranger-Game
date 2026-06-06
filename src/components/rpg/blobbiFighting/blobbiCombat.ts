import type { BlobbiSnapshot } from './blobbiStateNostr';

export type BlobbiFighterSnapshot = {
  ownerPubkey: string;
  ownerName: string;
  blobbiId: string;
  blobbiName: string;
  stage: string;
  health: number;
};

export function blobbiToFighter(
  blobbi: BlobbiSnapshot,
  ownerPubkey: string,
  ownerName: string
): BlobbiFighterSnapshot {
  return {
    ownerPubkey,
    ownerName,
    blobbiId: blobbi.id,
    blobbiName: blobbi.displayName,
    stage: blobbi.stage,
    health: Math.max(1, blobbi.health),
  };
}

const HEALTH_FLOOR = 1;

export function getWinProbability(myHp: number, theirHp: number): number {
  const a = Math.max(HEALTH_FLOOR, myHp);
  const b = Math.max(HEALTH_FLOOR, theirHp);
  return a / (a + b);
}

export function rollBlobbiWinner(
  fighterA: BlobbiFighterSnapshot,
  fighterB: BlobbiFighterSnapshot
): string {
  const hpA = Math.max(HEALTH_FLOOR, fighterA.health);
  const hpB = Math.max(HEALTH_FLOOR, fighterB.health);
  return Math.random() < hpA / (hpA + hpB) ? fighterA.ownerPubkey : fighterB.ownerPubkey;
}

export function buildMatchSummaryContent(
  winnerName: string,
  loserName: string,
  winnerHp: number,
  loserHp: number,
  winProbabilityForWinner: number
): string {
  const pct = Math.round(winProbabilityForWinner * 100);
  return `${winnerName} defeated ${loserName} at Blobbi Fighting (~${pct}% odds, HP ${winnerHp} vs ${loserHp}).`;
}

export function buildFightMemoryContent(
  blobbiName: string,
  won: boolean,
  opponentName: string
): string {
  if (won) {
    return `${blobbiName} won a fight at Blobbi Fighting against ${opponentName}!`;
  }
  return `${blobbiName} was defeated at Blobbi Fighting by ${opponentName}.`;
}
