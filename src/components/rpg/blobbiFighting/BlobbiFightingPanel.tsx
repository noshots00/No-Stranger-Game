import { useMemo, useState } from 'react';
import { GamePanelDialog, GamePanelDialogTitle } from '../GamePanelDialog';
import { GamePanelExpandable } from '../GamePanelExpandable';
import { GamePanelScroll } from '../GamePanelScroll';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  BlobbiFightMatchResult,
  BlobbiFightOpenRegistration,
} from './blobbiFightNostr';
import type { BlobbiSnapshot } from './blobbiStateNostr';
import type { useBlobbiFight } from './useBlobbiFight';
import type { usePlayerBlobbis } from './usePlayerBlobbis';
type BlobbiFightingPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myPubkey: string | undefined;
  playerBlobbis: ReturnType<typeof usePlayerBlobbis>;
  blobbiFight: ReturnType<typeof useBlobbiFight>;
};

function formatMatchTime(atMs: number): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(atMs)
  );
}

function BracketRow({
  label,
  match,
  defaultOpen,
}: {
  label: string;
  match?: BlobbiFightMatchResult;
  defaultOpen?: boolean;
}) {
  return (
    <GamePanelExpandable label={<span className="truncate">{label}</span>} defaultOpen={defaultOpen}>
      <div className="font-serif text-xs leading-relaxed text-[var(--candle-ink-faint)]">
        {match ? (
          <>
            <p className="text-[var(--candle-ink-soft)]">{match.summary}</p>
            <p className="mt-1">
              Winner odds ~{Math.round(match.winProbabilityForWinner * 100)}% ·{' '}
              {formatMatchTime(match.atMs)}
            </p>
          </>
        ) : (
          <p>Waiting for an opponent…</p>
        )}
      </div>
    </GamePanelExpandable>
  );
}

function fightBoardRows(
  openRegistrations: readonly BlobbiFightOpenRegistration[],
  matches: readonly BlobbiFightMatchResult[]
): Array<{ key: string; label: string; match?: BlobbiFightMatchResult }> {
  const rows: Array<{ key: string; label: string; match?: BlobbiFightMatchResult }> = [];
  const matchedRegistrationIds = new Set(matches.map((m) => m.registrationEventId));

  for (const m of matches) {
    rows.push({
      key: m.eventId,
      label: `${m.fighterA.blobbiName} vs ${m.fighterB.blobbiName}`,
      match: m,
    });
  }

  for (const open of openRegistrations) {
    if (matchedRegistrationIds.has(open.eventId)) continue;
    rows.push({
      key: open.eventId,
      label: `${open.blobbiName} (${open.ownerName}, waiting…)`,
    });
  }

  return rows;
}

function BlobbiCard({
  blobbi,
  selected,
  onSelect,
}: {
  blobbi: BlobbiSnapshot;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-md border px-3 py-2 text-left transition-colors',
        selected
          ? 'border-[var(--candle-flame)]/60 bg-[var(--candle-flame)]/10'
          : 'border-[var(--candle-rule)]/50 bg-black/25 hover:bg-black/35'
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-4 w-4 shrink-0 rounded-full border border-white/20"
          style={{ backgroundColor: blobbi.baseColor ?? '#888' }}
          aria-hidden
        />
        <span className="font-cormorant text-base font-semibold text-[var(--candle-wax)]">
          {blobbi.displayName}
        </span>
        <span className="font-serif text-[0.65rem] uppercase tracking-[0.1em] text-[var(--candle-ink-faint)]">
          {blobbi.stage}
        </span>
      </div>
      <p className="mt-1 font-serif text-xs text-[var(--candle-ink-faint)]">
        HP {blobbi.health} · Happiness {blobbi.happiness} · Energy {blobbi.energy}
      </p>
    </button>
  );
}

export function BlobbiFightingPanel({
  open,
  onOpenChange,
  myPubkey,
  playerBlobbis,
  blobbiFight,
}: BlobbiFightingPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { blobbis, query: blobbisQuery } = playerBlobbis;
  const { feed, feedQuery, register } = blobbiFight;

  const selectedBlobbi = useMemo(
    () => blobbis.find((b) => b.id === selectedId),
    [blobbis, selectedId]
  );

  const registerError =
    register.error instanceof Error
      ? register.error.message
      : register.isError
        ? 'Matchmaking failed.'
        : null;

  const rows = useMemo(
    () => fightBoardRows(feed.openRegistrations, feed.matches),
    [feed.openRegistrations, feed.matches]
  );

  return (
    <GamePanelDialog
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel="Blobbi Fighting"
      panelClassName="gap-0 p-4 pt-8"
    >
      <header className="shrink-0 space-y-1 px-2 text-center">
        <GamePanelDialogTitle>Blobbi Fighting</GamePanelDialogTitle>
        <p className="font-serif text-xs text-[var(--candle-ink-faint)]">
          Pit your Ditto Blobbis against other villagers.
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-1">
        <div className="shrink-0 space-y-2">
          <p className="font-serif text-[0.65rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">
            Your Blobbis
          </p>
          <GamePanelScroll className="max-h-36 rounded-md border border-[var(--candle-rule)]/60 bg-black/20">
            <div className="space-y-2 p-2">
              {blobbisQuery.isPending ? (
                <p className="py-2 text-center font-serif text-sm text-[var(--candle-ink-faint)]">
                  Loading Blobbis…
                </p>
              ) : null}
              {!blobbisQuery.isPending && blobbis.length === 0 ? (
                <p className="py-2 text-center font-serif text-sm text-[var(--candle-ink-faint)]">
                  No Blobbis found. Adopt and care for a Blobbi on Ditto, then return here.
                </p>
              ) : null}
              {blobbis.map((blobbi) => (
                <BlobbiCard
                  key={blobbi.id}
                  blobbi={blobbi}
                  selected={selectedId === blobbi.id}
                  onSelect={() => setSelectedId(blobbi.id)}
                />
              ))}
            </div>
          </GamePanelScroll>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="flex-1 font-serif uppercase tracking-[0.1em]"
            disabled={
              !myPubkey ||
              !selectedBlobbi ||
              register.isPending ||
              Boolean(feed.myOpen)
            }
            onClick={() => {
              if (selectedBlobbi) register.mutate(selectedBlobbi);
            }}
          >
            {register.isPending
              ? 'Finding match…'
              : feed.myOpen
                ? 'Waiting for opponent…'
                : 'Find a match'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 font-serif uppercase tracking-[0.1em]"
            onClick={() => onOpenChange(false)}
          >
            Return to village
          </Button>
        </div>

        {registerError ? (
          <p className="shrink-0 text-center font-serif text-xs text-red-300/90">{registerError}</p>
        ) : null}
        {feed.myOpen ? (
          <p className="shrink-0 text-center font-serif text-xs italic text-[var(--candle-ink-faint)]">
            You are in the queue. The next fighter will be your opponent.
          </p>
        ) : null}

        <p className="shrink-0 text-center font-serif text-[0.65rem] text-[var(--candle-ink-faint)]">
          Fight results are saved as Blobbi biography memories on Nostr.
        </p>

        <GamePanelScroll className="min-h-0 flex-1 rounded-md border border-[var(--candle-rule)]/60 bg-black/20">
          <div className="space-y-2 p-2">
            {feedQuery.isPending && rows.length === 0 ? (
              <p className="py-4 text-center font-serif text-sm text-[var(--candle-ink-faint)]">
                Loading fight board…
              </p>
            ) : null}
            {!feedQuery.isPending && rows.length === 0 ? (
              <p className="py-4 text-center font-serif text-sm text-[var(--candle-ink-faint)]">
                No fights yet. Select a Blobbi and find a match.
              </p>
            ) : null}
            {rows.map((row, i) => (
              <BracketRow key={row.key} label={row.label} match={row.match} defaultOpen={i === 0} />
            ))}
          </div>
        </GamePanelScroll>
      </div>
    </GamePanelDialog>
  );
}
