import { GamePanelDialog, GamePanelDialogTitle } from '../GamePanelDialog';
import { Button } from '@/components/ui/button';
import { GamePanelScroll } from '../GamePanelScroll';
import { cn } from '@/lib/utils';
import type { useMayorsHut } from './useMayorsHut';
import { VillageFeedRefreshButton } from '../village/VillageFeedRefreshButton';

type MayorsHutContentProps = {
  myPubkey: string | undefined;
  mayorsHut: ReturnType<typeof useMayorsHut>;
  /** When true, omit outer dialog chrome (Town Hall tab). */
  embedded?: boolean;
  onVoteRecorded?: () => void;
  onVoteRetracted?: () => void;
};

export function MayorsHutContent({
  myPubkey,
  mayorsHut,
  embedded = false,
  onVoteRecorded,
  onVoteRetracted,
}: MayorsHutContentProps) {
  const {
    feedQuery,
    election,
    myActiveCandidacy,
    myVote,
    voteGesturesBlocked,
    runForMayor,
    withdrawFromElection,
    castVote,
    retractVote,
    refreshFeed,
  } = mayorsHut;

  const candidacyPending = runForMayor.isPending || withdrawFromElection.isPending;
  const votePending = castVote.isPending || retractVote.isPending;
  const voteUiLocked = voteGesturesBlocked || candidacyPending;

  const registrationBlock = (
    <div className="shrink-0 space-y-2">
      {myActiveCandidacy ? (
        <Button
          type="button"
          variant="outline"
          className="w-full touch-manipulation font-serif text-xs uppercase tracking-[0.1em]"
          disabled={!myPubkey || candidacyPending}
          onClick={() => withdrawFromElection.mutate()}
        >
          {withdrawFromElection.isPending ? 'Withdrawing…' : 'Withdraw from election'}
        </Button>
      ) : (
        <Button
          type="button"
          className="w-full touch-manipulation font-serif text-xs uppercase tracking-[0.1em]"
          disabled={!myPubkey || candidacyPending}
          onClick={() => runForMayor.mutate()}
        >
          {runForMayor.isPending ? 'Entering race…' : 'Run for mayor'}
        </Button>
      )}
    </div>
  );

  return (
    <div className={embedded ? 'space-y-3' : 'flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-1'}>
      {!embedded ? (
        <header className="shrink-0 space-y-1 px-2 text-center">
          <div className="flex justify-end pr-8">
            <VillageFeedRefreshButton
              isFetching={feedQuery.isFetching}
              onRefresh={() => void refreshFeed()}
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
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-serif text-sm text-[var(--candle-wax)]">
              Mayor: <span className="font-semibold">{election.mayorName}</span>
            </p>
            <p className="font-serif text-[0.65rem] text-[var(--candle-ink-faint)]">
              {election.isPlaceholderMayor
                ? 'Placeholder until a candidate leads the vote'
                : 'Elected by village vote'}
            </p>
          </div>
          <VillageFeedRefreshButton
            isFetching={feedQuery.isFetching}
            onRefresh={() => void refreshFeed()}
          />
        </div>
      )}

      {registrationBlock}

      <p
        className={cn(
          'font-serif text-[0.65rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]',
          embedded ? 'shrink-0' : 'shrink-0 px-2'
        )}
      >
        Ballot
      </p>

      <GamePanelScroll
        className={cn(
          'min-h-0 flex-1 rounded-md border border-[var(--candle-rule)]/60 bg-black/20',
          embedded && 'max-h-[min(36vh,280px)]'
        )}
      >
        {feedQuery.isPending ? (
          <p className="py-6 text-center font-serif text-sm text-[var(--candle-ink-faint)]">Loading…</p>
        ) : election.activeCandidates.length === 0 ? (
          <p className="px-3 py-6 text-center font-serif text-sm text-[var(--candle-ink-faint)]">
            No candidates yet.
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
                      'flex touch-manipulation items-start gap-2 font-serif text-sm',
                      (!myPubkey || votePending || (!checked && voteUiLocked)) &&
                        'cursor-not-allowed opacity-60'
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-[var(--candle-flame)]"
                      checked={checked}
                      disabled={!myPubkey || votePending || (!checked && voteUiLocked)}
                      onChange={() => {
                        if (!myPubkey || votePending) return;
                        if (checked) {
                          retractVote.mutate(undefined, {
                            onSuccess: () => onVoteRetracted?.(),
                          });
                          return;
                        }
                        if (voteUiLocked || myVote) return;
                        castVote.mutate(candidate.pubkey, {
                          onSuccess: () => onVoteRecorded?.(),
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
    </div>
  );
}

type MayorsHutPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myPubkey: string | undefined;
  mayorsHut: ReturnType<typeof useMayorsHut>;
};

export function MayorsHutPanel({ open, onOpenChange, myPubkey, mayorsHut }: MayorsHutPanelProps) {
  return (
    <GamePanelDialog open={open} onOpenChange={onOpenChange} ariaLabel="Mayor's Hut" panelClassName="gap-0 p-4 pt-8">
      <MayorsHutContent myPubkey={myPubkey} mayorsHut={mayorsHut} />
    </GamePanelDialog>
  );
}
