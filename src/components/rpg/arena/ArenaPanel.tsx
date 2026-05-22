import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { getCombatRating } from './combatRating';
import { formatArenaFightLine, createEmptyArenaRecord } from './arenaRecord';
import type { ArenaMatchResult, ArenaOpenRegistration } from './arenaNostr';
import type { useArenaTournament } from './useArenaTournament';
import type { ArenaRecord, QuestState } from '../quests/types';

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
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-md border border-[var(--candle-rule)]/80 bg-black/25">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-serif text-sm text-[var(--candle-ink-soft)] hover:text-[var(--candle-wax)]">
        <span className="min-w-0 truncate">{label}</span>
        <ChevronDown
          className={cn('size-4 shrink-0 opacity-70 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-[var(--candle-rule)]/60 px-3 py-2 font-serif text-xs leading-relaxed text-[var(--candle-ink-faint)]">
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
      </CollapsibleContent>
    </Collapsible>
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
  const combatRating = getCombatRating(questState);
  const arenaRecord: ArenaRecord = questState.arenaRecord ?? createEmptyArenaRecord();
  const { feed, feedQuery, register } = tournament;
  const registerError =
    register.error instanceof Error ? register.error.message : register.isError ? 'Registration failed.' : null;

  const rows = useMemo(
    () => tournamentRows(feed.openRegistrations, feed.matches),
    [feed.openRegistrations, feed.matches]
  );

  const personalFights = arenaRecord.fights;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex !flex-col gap-0 overflow-hidden border border-[var(--candle-rule)] bg-[var(--candle-hearth)] p-4 pt-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]',
          'h-[95dvh] max-h-[95dvh] min-h-0 w-[min(95vw,430px)] max-w-none sm:rounded-lg'
        )}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 space-y-1 px-6 text-center sm:text-center">
          <DialogTitle className="font-cormorant text-xl font-semibold tracking-[0.06em] text-[var(--candle-wax)]">
            Arena
          </DialogTitle>
          <p className="font-serif text-xs text-[var(--candle-ink-faint)]">
            Combat rating {combatRating}
          </p>
        </DialogHeader>

        <Tabs defaultValue="tournament" className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-1">
          <TabsList className="grid w-full shrink-0 grid-cols-2 border border-[var(--candle-rule)] bg-black/30">
            <TabsTrigger
              value="tournament"
              className="font-serif text-xs uppercase tracking-[0.12em] data-[state=active]:bg-[var(--candle-flame)]/15"
            >
              Tournament
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="font-serif text-xs uppercase tracking-[0.12em] data-[state=active]:bg-[var(--candle-flame)]/15"
            >
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="tournament"
            className="mt-0 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden outline-none data-[state=inactive]:hidden"
          >
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

            <ScrollArea className="min-h-0 flex-1 rounded-md border border-[var(--candle-rule)]/60 bg-black/20">
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
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="stats"
            className="mt-0 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden outline-none data-[state=inactive]:hidden"
          >
            <div className="shrink-0 rounded-md border border-[var(--candle-rule)] bg-black/30 px-4 py-3 text-center">
              <p className="font-serif text-[0.65rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">
                Record
              </p>
              <p className="font-cormorant text-2xl font-semibold text-[var(--candle-wax)]">
                {arenaRecord.wins}–{arenaRecord.losses}
              </p>
            </div>
            <ScrollArea className="min-h-0 flex-1 rounded-md border border-[var(--candle-rule)]/60 bg-black/20">
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
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
