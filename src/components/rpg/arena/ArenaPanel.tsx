import { useMemo, useState } from 'react';
import { GamePanelDialog, GamePanelDialogTitle } from '../GamePanelDialog';
import { GamePanelExpandable } from '../GamePanelExpandable';
import { GamePanelScroll } from '../GamePanelScroll';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCombatRating } from './combatRating';
import { formatArenaFightLine, createEmptyArenaRecord } from './arenaRecord';
import type { ArenaMatchResult, ArenaOpenRegistration } from './arenaNostr';
import type { useArenaTournament } from './useArenaTournament';
import type { ArenaRecord, QuestState } from '../quests/types';
import { VillageFeedRefreshButton } from '../village/VillageFeedRefreshButton';

type ArenaPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questState: QuestState;
  myPubkey: string | undefined;
  tournament: ReturnType<typeof useArenaTournament>;
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
  match?: ArenaMatchResult;
  defaultOpen?: boolean;
}) {
  return (
    <GamePanelExpandable label={<span className="truncate">{label}</span>} defaultOpen={defaultOpen}>
      <div className="font-serif text-xs leading-relaxed text-[var(--candle-ink-faint)]">
        {match ? (
          <>
            <p className="text-[var(--candle-ink-soft)]">{match.summary}</p>
            <p className="mt-1">
              Winner odds ~{Math.round(match.winProbabilityForWinner * 100)}% · {formatMatchTime(match.atMs)}
            </p>
          </>
        ) : (
          <p>Waiting for an opponent to register…</p>
        )}
      </div>
    </GamePanelExpandable>
  );
}

function tournamentRows(
  openRegistrations: readonly ArenaOpenRegistration[],
  matches: readonly ArenaMatchResult[]
): Array<{ key: string; label: string; match?: ArenaMatchResult }> {
  const rows: Array<{ key: string; label: string; match?: ArenaMatchResult }> = [];
  const matchedRegistrationIds = new Set(matches.map((m) => m.registrationEventId));

  for (const m of matches) {
    rows.push({
      key: m.eventId,
      label: `${m.fighterA.name} vs ${m.fighterB.name}`,
      match: m,
    });
  }

  for (const open of openRegistrations) {
    if (matchedRegistrationIds.has(open.eventId)) continue;
    rows.push({
      key: open.eventId,
      label: `${open.name} (waiting…)`,
    });
  }

  return rows;
}

export function ArenaPanel({ open, onOpenChange, questState, myPubkey, tournament }: ArenaPanelProps) {
  const [arenaTab, setArenaTab] = useState<'tournament' | 'stats'>('tournament');
  const combatRating = getCombatRating(questState);
  const arenaRecord: ArenaRecord = questState.arenaRecord ?? createEmptyArenaRecord();
  const { feed, feedQuery, register, invalidateFeed } = tournament;
  const registerError =
    register.error instanceof Error ? register.error.message : register.isError ? 'Registration failed.' : null;

  const rows = useMemo(
    () => tournamentRows(feed.openRegistrations, feed.matches),
    [feed.openRegistrations, feed.matches]
  );

  const personalFights = arenaRecord.fights;

  return (
    <GamePanelDialog open={open} onOpenChange={onOpenChange} ariaLabel="Arena" panelClassName="gap-0 p-4 pt-8">
      <header className="shrink-0 space-y-1 px-2 text-center">
        <div className="flex justify-end pr-8">
          <VillageFeedRefreshButton
            isFetching={feedQuery.isFetching}
            onRefresh={() => void invalidateFeed()}
          />
        </div>
        <GamePanelDialogTitle>Arena</GamePanelDialogTitle>
        <p className="font-serif text-xs text-[var(--candle-ink-faint)]">
          Combat rating {combatRating}
        </p>
      </header>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-1">
          <div className="grid w-full shrink-0 grid-cols-2 gap-1 rounded-md border border-[var(--candle-rule)] bg-black/30 p-1">
            <button
              type="button"
              className={cn(
                'rounded-sm px-2 py-1.5 font-serif text-xs uppercase tracking-[0.12em]',
                arenaTab === 'tournament'
                  ? 'bg-[var(--candle-flame)]/15 text-[var(--candle-wax)]'
                  : 'text-[var(--candle-ink-soft)]'
              )}
              onClick={() => setArenaTab('tournament')}
            >
              Tournament
            </button>
            <button
              type="button"
              className={cn(
                'rounded-sm px-2 py-1.5 font-serif text-xs uppercase tracking-[0.12em]',
                arenaTab === 'stats'
                  ? 'bg-[var(--candle-flame)]/15 text-[var(--candle-wax)]'
                  : 'text-[var(--candle-ink-soft)]'
              )}
              onClick={() => setArenaTab('stats')}
            >
              Stats
            </button>
          </div>

          {arenaTab === 'tournament' ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
            <Button
              type="button"
              className="shrink-0 font-serif uppercase tracking-[0.1em]"
              disabled={!myPubkey || register.isPending || Boolean(feed.myOpen)}
              onClick={() => register.mutate()}
            >
              {register.isPending
                ? 'Registering…'
                : feed.myOpen
                  ? 'Waiting for opponent…'
                  : 'Register for Tournament'}
            </Button>
            {registerError ? (
              <p className="shrink-0 text-center font-serif text-xs text-red-300/90">{registerError}</p>
            ) : null}
            {feed.myOpen ? (
              <p className="shrink-0 text-center font-serif text-xs italic text-[var(--candle-ink-faint)]">
                You are in the queue. The next registrant will be your opponent.
              </p>
            ) : null}

            <GamePanelScroll className="min-h-0 flex-1 rounded-md border border-[var(--candle-rule)]/60 bg-black/20">
              <div className="space-y-2 p-2">
                {feedQuery.isPending && rows.length === 0 ? (
                  <p className="py-4 text-center font-serif text-sm text-[var(--candle-ink-faint)]">
                    Loading tournament board…
                  </p>
                ) : null}
                {!feedQuery.isPending && rows.length === 0 ? (
                  <p className="py-4 text-center font-serif text-sm text-[var(--candle-ink-faint)]">
                    No fighters registered yet. Be the first to enter the queue.
                  </p>
                ) : null}
                {rows.map((row, i) => (
                  <BracketRow key={row.key} label={row.label} match={row.match} defaultOpen={i === 0} />
                ))}
              </div>
            </GamePanelScroll>
          </div>
          ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
            <div className="shrink-0 rounded-md border border-[var(--candle-rule)] bg-black/30 px-4 py-3 text-center">
              <p className="font-serif text-[0.65rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">
                Record
              </p>
              <p className="font-cormorant text-2xl font-semibold text-[var(--candle-wax)]">
                {arenaRecord.wins}–{arenaRecord.losses}
              </p>
            </div>
            <GamePanelScroll className="min-h-0 flex-1 rounded-md border border-[var(--candle-rule)]/60 bg-black/20">
              <div className="space-y-2 p-2">
                {personalFights.length === 0 ? (
                  <p className="py-4 text-center font-serif text-sm text-[var(--candle-ink-faint)]">
                    No arena fights yet.
                  </p>
                ) : (
                  personalFights.map((fight) => (
                    <div
                      key={fight.matchEventId}
                      className="rounded-md border border-[var(--candle-rule)]/50 bg-black/25 px-3 py-2"
                    >
                      <p className="font-serif text-sm text-[var(--candle-ink-soft)]">
                        {formatArenaFightLine(
                          fight.won,
                          fight.opponentName,
                          fight.myCombatRating,
                          fight.opponentCombatRating
                        )}
                      </p>
                      <p className="mt-1 font-serif text-[0.65rem] text-[var(--candle-ink-faint)]">
                        {formatMatchTime(fight.atMs)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </GamePanelScroll>
          </div>
          )}
        </div>
    </GamePanelDialog>
  );
}
