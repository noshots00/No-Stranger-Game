import { pubkeysEqual } from '@/lib/nostrPubkey';
import { fighterNameColor } from './fighterNameColor';
import type { BlobbiFighterSnapshot, BlobbiFightMatchResult } from './blobbiFightNostr';
import type { BlobbiSnapshot } from './blobbiStateNostr';

function formatMatchTime(atMs: number): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(atMs)
  );
}

function winnerAndLoser(match: BlobbiFightMatchResult): {
  winner: BlobbiFighterSnapshot;
  loser: BlobbiFighterSnapshot;
} {
  const winnerIsA = pubkeysEqual(match.winnerOwnerPubkey, match.fighterA.ownerPubkey);
  return winnerIsA
    ? { winner: match.fighterA, loser: match.fighterB }
    : { winner: match.fighterB, loser: match.fighterA };
}

export function ColoredFighterName({
  fighter,
  myBlobbi,
  className,
}: {
  fighter: BlobbiFighterSnapshot;
  myBlobbi?: Pick<BlobbiSnapshot, 'id' | 'baseColor'>;
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{ color: fighterNameColor(fighter, myBlobbi) }}
    >
      {fighter.blobbiName}
    </span>
  );
}

export function FightMatchVersusLabel({
  match,
  myBlobbi,
}: {
  match: BlobbiFightMatchResult;
  myBlobbi?: Pick<BlobbiSnapshot, 'id' | 'baseColor'>;
}) {
  return (
    <span className="truncate">
      <ColoredFighterName fighter={match.fighterA} myBlobbi={myBlobbi} className="font-medium" />
      <span className="text-[var(--candle-ink-faint)]"> vs </span>
      <ColoredFighterName fighter={match.fighterB} myBlobbi={myBlobbi} className="font-medium" />
    </span>
  );
}

export function FightMatchSummary({
  match,
  myBlobbi,
}: {
  match: BlobbiFightMatchResult;
  myBlobbi?: Pick<BlobbiSnapshot, 'id' | 'baseColor'>;
}) {
  const { winner, loser } = winnerAndLoser(match);
  const pct = Math.round(match.winProbabilityForWinner * 100);

  return (
    <div className="font-serif text-[0.7rem] leading-snug text-[var(--candle-ink-faint)]">
      <p className="text-[var(--candle-ink-soft)]">
        <ColoredFighterName fighter={winner} myBlobbi={myBlobbi} className="font-medium" />
        <span> defeated </span>
        <ColoredFighterName fighter={loser} myBlobbi={myBlobbi} className="font-medium" />
      </p>
      <p className="mt-0.5">
        ~{pct}% · HP {winner.health} vs {loser.health} · {formatMatchTime(match.atMs)}
      </p>
    </div>
  );
}
