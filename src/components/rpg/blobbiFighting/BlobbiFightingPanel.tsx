import { useMemo } from 'react';
import { GamePanelDialog, GamePanelDialogTitle } from '../GamePanelDialog';
import { GamePanelExpandable } from '../GamePanelExpandable';
import { GamePanelScroll } from '../GamePanelScroll';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { pubkeysEqual } from '@/lib/nostrPubkey';
import { computeBlobbiArenaRecord } from './blobbiCareerNostr';
import { BlobbiProfileCard } from './BlobbiProfileCard';
import { FightMatchSummary, FightMatchVersusLabel } from './FightMatchDisplay';
import {
  type BlobbiFightMatchResult,
  type BlobbiFightOpenRegistration,
} from './blobbiFightNostr';
import type { BlobbiSnapshot } from './blobbiStateNostr';
import type { useBlobbiFight } from './useBlobbiFight';
import type { useBlobbiFightMemories } from './useBlobbiFightMemories';
import type { usePlayerBlobbis } from './usePlayerBlobbis';

type BlobbiFightingPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myPubkey: string | undefined;
  playerBlobbis: ReturnType<typeof usePlayerBlobbis>;
  blobbiFight: ReturnType<typeof useBlobbiFight>;
  blobbiFightMemories: ReturnType<typeof useBlobbiFightMemories>;
};

function BracketRow({
  match,
  defaultOpen,
  myBlobbi,
}: {
  match?: BlobbiFightMatchResult;
  defaultOpen?: boolean;
  myBlobbi?: BlobbiSnapshot;
}) {
  const label = match ? (
    <FightMatchVersusLabel match={match} myBlobbi={myBlobbi} />
  ) : (
    <span className="truncate font-serif text-xs">Waiting…</span>
  );

  return (
    <GamePanelExpandable
      label={label}
      defaultOpen={defaultOpen}
      triggerClassName="px-2 py-1.5 text-xs"
      className="border-[var(--candle-rule)]/50"
    >
      {match ? (
        <FightMatchSummary match={match} myBlobbi={myBlobbi} />
      ) : (
        <p className="font-serif text-[0.7rem] text-[var(--candle-ink-faint)]">Waiting…</p>
      )}
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
      label: `${open.blobbiName} · ${open.ownerName} (queue)`,
    });
  }

  return rows;
}

export function BlobbiFightingPanel({
  open,
  onOpenChange,
  myPubkey,
  playerBlobbis,
  blobbiFight,
  blobbiFightMemories,
}: BlobbiFightingPanelProps) {
  const { blobbis, query: blobbisQuery } = playerBlobbis;
  const { feed, feedQuery, register, withdrawFromQueue, refreshFeed, isResolvingMatch } =
    blobbiFight;
  const { memories } = blobbiFightMemories;

  const myBlobbi = blobbis[0];

  const arenaRecord = useMemo(() => {
    if (!myBlobbi || !myPubkey) return { wins: 0, losses: 0 };
    return computeBlobbiArenaRecord({
      blobbiId: myBlobbi.id,
      matches: feed.matches,
      memories,
      myPubkey,
    });
  }, [myBlobbi, myPubkey, feed.matches, memories]);

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

  const myLatestMatch = feed.myLatestMatch;
  const myMatchOutcome =
    myLatestMatch && myPubkey
      ? pubkeysEqual(myLatestMatch.winnerOwnerPubkey, myPubkey)
        ? 'won'
        : 'lost'
      : null;

  const statusLine = (() => {
    if (registerError) return registerError;
    if (withdrawFromQueue.isPending) return 'Leaving queue…';
    if (isResolvingMatch) return 'Pairing fighters…';
    if (register.isPending) return 'Joining queue…';
    if (register.isSuccess && register.data?.action === 'matched') {
      return 'Match found — tap Update fights to refresh the board.';
    }
    if (feed.myOpen || (register.isSuccess && register.data?.action === 'queued')) {
      return 'In queue — tap Update when another fighter is waiting.';
    }
    if (!feedQuery.isFetched) return 'Tap Update to load fights from relays.';
    return null;
  })();

  const boardEmpty = !feedQuery.isFetching && rows.length === 0;
  const boardMessage = feedQuery.isFetching
    ? 'Loading…'
    : !feedQuery.isFetched
      ? 'Tap Update below.'
      : 'No fights yet. Tap Find match.';

  return (
    <GamePanelDialog
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel="Blobbi Fighting"
      panelClassName="gap-0 p-3 pt-7"
    >
      <header className="shrink-0 text-center">
        <GamePanelDialogTitle className="text-lg tracking-[0.04em]">
          Blobbi Fighting
        </GamePanelDialogTitle>
      </header>

      <div className="mt-1 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
        {blobbisQuery.isPending ? (
          <p className="shrink-0 px-1 text-center font-serif text-[0.7rem] text-[var(--candle-ink-faint)]">
            Loading Blobbi…
          </p>
        ) : null}
        {!blobbisQuery.isPending && !myBlobbi ? (
          <p className="shrink-0 px-1 text-center font-serif text-[0.7rem] leading-snug text-[var(--candle-ink-faint)]">
            No Blobbis on Ditto yet.
          </p>
        ) : null}
        {myBlobbi ? (
          <div className="shrink-0 px-0.5">
            <BlobbiProfileCard blobbi={myBlobbi} arenaRecord={arenaRecord} />
          </div>
        ) : null}

        {statusLine ? (
          <p
            className={cn(
              'shrink-0 px-1 text-center font-serif text-[0.7rem] leading-snug',
              registerError ? 'text-red-300/90' : 'text-[var(--candle-ink-faint)]'
            )}
          >
            {statusLine}
          </p>
        ) : null}

        {myLatestMatch && !feed.myOpen && myMatchOutcome ? (
          <div className="shrink-0 px-1 text-center">
            <p className="font-serif text-[0.7rem] text-[var(--candle-ink-faint)]">
              <span className="text-[var(--candle-ink-soft)]">
                {myMatchOutcome === 'won' ? 'Victory' : 'Defeat'}
              </span>
            </p>
            <FightMatchSummary match={myLatestMatch} myBlobbi={myBlobbi} />
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
          <p className="shrink-0 px-0.5 font-serif text-[0.6rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">
            Fight board
          </p>
          <GamePanelScroll className="min-h-0 flex-1 rounded border border-[var(--candle-rule)]/60 bg-black/20">
            <div className="space-y-1 p-1.5">
              {boardEmpty ? (
                <p className="py-3 text-center font-serif text-[0.7rem] text-[var(--candle-ink-faint)]">
                  {boardMessage}
                </p>
              ) : null}
              {rows.map((row, i) =>
                row.match ? (
                  <BracketRow
                    key={row.key}
                    match={row.match}
                    defaultOpen={i === 0}
                    myBlobbi={myBlobbi}
                  />
                ) : (
                  <GamePanelExpandable
                    key={row.key}
                    label={<span className="truncate font-serif text-xs">{row.label}</span>}
                    defaultOpen={i === 0}
                    triggerClassName="px-2 py-1.5 text-xs"
                    className="border-[var(--candle-rule)]/50"
                  >
                    <p className="font-serif text-[0.7rem] text-[var(--candle-ink-faint)]">
                      Waiting…
                    </p>
                  </GamePanelExpandable>
                )
              )}
            </div>
          </GamePanelScroll>
        </div>

        <div className="shrink-0 grid grid-cols-2 gap-1.5 border-t border-[var(--candle-rule)]/40 pt-2">
          {feed.myOpen ? (
            <Button
              type="button"
              size="sm"
              className="h-8 font-serif text-[0.65rem] uppercase tracking-[0.08em]"
              disabled={!myPubkey || withdrawFromQueue.isPending || isResolvingMatch}
              onClick={() => void withdrawFromQueue.mutate()}
            >
              {withdrawFromQueue.isPending ? 'Leaving…' : 'Leave queue'}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="h-8 font-serif text-[0.65rem] uppercase tracking-[0.08em]"
              disabled={
                !myPubkey ||
                !myBlobbi ||
                register.isPending ||
                isResolvingMatch
              }
              onClick={() => {
                if (myBlobbi) register.mutate(myBlobbi);
              }}
            >
              Find match
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            className="h-8 font-serif text-[0.65rem] uppercase tracking-[0.08em]"
            disabled={
              feedQuery.isFetching ||
              isResolvingMatch ||
              register.isPending ||
              withdrawFromQueue.isPending
            }
            onClick={() => void refreshFeed()}
          >
            {feedQuery.isFetching || isResolvingMatch ? 'Updating…' : 'Update fights'}
          </Button>
        </div>
      </div>
    </GamePanelDialog>
  );
}
