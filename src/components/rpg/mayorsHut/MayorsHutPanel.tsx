import { GamePanelDialog, GamePanelDialogTitle } from '../GamePanelDialog';
import { Button } from '@/components/ui/button';
import { GamePanelScroll } from '../GamePanelScroll';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import type { useMayorsHut } from './useMayorsHut';
import { VillageFeedRefreshButton } from '../village/VillageFeedRefreshButton';

type MayorsHutPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myPubkey: string | undefined;
  mayorsHut: ReturnType<typeof useMayorsHut>;
};

export function MayorsHutPanel({ open, onOpenChange, myPubkey, mayorsHut }: MayorsHutPanelProps) {
  const { toast } = useToast();
  const {
    feedQuery,
    election,
    myActiveCandidacy,
    myVote,
    runForMayor,
    withdrawFromElection,
    castVote,
    invalidateFeed,
  } = mayorsHut;

  const isVotePending = castVote.isPending;

  return (
    <GamePanelDialog open={open} onOpenChange={onOpenChange} ariaLabel="Mayor's Hut" panelClassName="gap-0 p-4 pt-8">
      <header className="shrink-0 space-y-1 px-2 text-center">
        <div className="flex justify-end pr-8">
          <VillageFeedRefreshButton
            isFetching={feedQuery.isFetching}
            onRefresh={() => void invalidateFeed()}
          />
        </div>
        <GamePanelDialogTitle>Mayor&apos;s Hut</GamePanelDialogTitle>
          <p className="font-serif text-sm text-[var(--candle-wax)]">
            Mayor: <span className="font-semibold">{election.mayorName}</span>
          </p>
          {!election.isPlaceholderMayor ? (
            <p className="font-serif text-[0.65rem] text-[var(--candle-ink-faint)]">
              Elected by village vote
            </p>
          ) : (
            <p className="font-serif text-[0.65rem] text-[var(--candle-ink-faint)]">
              Placeholder until a candidate leads the vote
            </p>
          )}
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-1">
          <p className="shrink-0 px-2 font-serif text-[0.65rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">
            Vote for mayor
          </p>

          <GamePanelScroll className="min-h-0 flex-1 rounded-md border border-[var(--candle-rule)]/60 bg-black/20">
            {feedQuery.isPending ? (
              <p className="py-6 text-center font-serif text-sm text-[var(--candle-ink-faint)]">Loading…</p>
            ) : election.activeCandidates.length === 0 ? (
              <p className="px-3 py-6 text-center font-serif text-sm text-[var(--candle-ink-faint)]">
                No candidates yet. Run for mayor to appear on the ballot.
              </p>
            ) : (
              <ul className="list-none space-y-0 px-2 py-2">
                {election.activeCandidates.map((candidate) => {
                  const votes = election.voteCountByCandidate[candidate.pubkey] ?? 0;
                  const checked = myVote?.candidatePubkey === candidate.pubkey;
                  const isSelf = myPubkey === candidate.pubkey;

                  return (
                    <li
                      key={candidate.pubkey}
                      className="border-b border-[var(--candle-rule)]/40 py-2 last:border-b-0"
                    >
                      <label
                        className={cn(
                          'flex cursor-pointer items-start gap-2 font-serif text-sm',
                          (!myPubkey || isVotePending) && 'cursor-not-allowed opacity-60'
                        )}
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 accent-[var(--candle-flame)]"
                          checked={checked}
                          disabled={!myPubkey || isVotePending}
                          onChange={() => {
                            if (checked || !myPubkey) return;
                            castVote.mutate(candidate.pubkey, {
                              onSuccess: () =>
                                toast({
                                  title: 'Vote recorded',
                                  description: `You voted for ${candidate.name}.`,
                                }),
                              onError: (err) =>
                                toast({
                                  title: 'Vote failed',
                                  description: err instanceof Error ? err.message : 'Try again.',
                                }),
                            });
                          }}
                        />
                        <span className="min-w-0 flex-1 text-[var(--candle-ink-soft)]">
                          <span className="text-[var(--candle-wax)]">{candidate.name}</span>
                          <span className="text-[var(--candle-ink-faint)]">
                            {' '}
                            · {votes} vote{votes === 1 ? '' : 's'}
                            {isSelf ? ' (you)' : ''}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </GamePanelScroll>

          <div className="shrink-0 space-y-2">
            {myActiveCandidacy ? (
              <Button
                type="button"
                variant="outline"
                className="w-full font-serif text-xs uppercase tracking-[0.1em]"
                disabled={!myPubkey || withdrawFromElection.isPending}
                onClick={() =>
                  withdrawFromElection.mutate(undefined, {
                    onSuccess: () =>
                      toast({ title: 'Withdrawn', description: 'You left the mayoral ballot.' }),
                    onError: (err) =>
                      toast({
                        title: 'Withdraw failed',
                        description: err instanceof Error ? err.message : 'Try again.',
                      }),
                  })
                }
              >
                {withdrawFromElection.isPending ? 'Withdrawing…' : 'Withdraw from election'}
              </Button>
            ) : (
              <Button
                type="button"
                className="w-full font-serif text-xs uppercase tracking-[0.1em]"
                disabled={!myPubkey || runForMayor.isPending}
                onClick={() =>
                  runForMayor.mutate(undefined, {
                    onSuccess: () =>
                      toast({ title: 'On the ballot', description: 'Villagers can vote for you now.' }),
                    onError: (err) =>
                      toast({
                        title: 'Could not run',
                        description: err instanceof Error ? err.message : 'Try again.',
                      }),
                  })
                }
              >
                {runForMayor.isPending ? 'Entering race…' : 'Run for mayor'}
              </Button>
            )}
          </div>
      </div>
    </GamePanelDialog>
  );
}
