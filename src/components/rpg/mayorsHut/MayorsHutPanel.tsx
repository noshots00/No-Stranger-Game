import { GamePanelDialog, GamePanelDialogTitle } from '../GamePanelDialog';
import { Button } from '@/components/ui/button';
import { GamePanelScroll } from '../GamePanelScroll';
import { PanelUpdateButton } from '../PanelUpdateButton';
import { cn } from '@/lib/utils';
import { RPG_UI_CAPTION, RPG_UI_META, RPG_UI_UI } from '../typography/rpgUiTypography';
import {
  VillageActionChip,
  VillageActionRow,
  VillageActionRowItem,
} from '../village/VillageActionChip';
import type { useMayorsHut } from './useMayorsHut';

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
  const voteError =
    castVote.error instanceof Error
      ? castVote.error.message
      : retractVote.error instanceof Error
        ? retractVote.error.message
        : castVote.isError || retractVote.isError
          ? 'Vote failed. Try again.'
          : null;

  const registrationBlock = embedded ? (
    <VillageActionRow>
      <VillageActionRowItem>
        {myActiveCandidacy ? (
          <VillageActionChip
            disabled={!myPubkey || candidacyPending}
            onClick={() => withdrawFromElection.mutate()}
          >
            {withdrawFromElection.isPending ? 'Withdrawing…' : 'Withdraw from election'}
          </VillageActionChip>
        ) : (
          <VillageActionChip
            disabled={!myPubkey || candidacyPending}
            onClick={() => runForMayor.mutate()}
          >
            {runForMayor.isPending ? 'Entering race…' : 'Run for mayor'}
          </VillageActionChip>
        )}
      </VillageActionRowItem>
    </VillageActionRow>
  ) : (
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

  const ballotList = (
    <ul className="list-none space-y-0 px-1 py-1">
      {election.activeCandidates.map((candidate) => {
        const votes = election.voteCountByCandidate[candidate.pubkey] ?? 0;
        const checked = myVote?.candidatePubkey === candidate.pubkey;
        const isSelf = myPubkey === candidate.pubkey;

        return (
          <li
            key={candidate.pubkey}
            className="border-b border-[var(--candle-rule)]/40 py-1 last:border-b-0"
          >
            <label
              className={cn(
                'flex touch-manipulation items-start gap-2',
                RPG_UI_UI,
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
  );

  const ballotBody =
    feedQuery.isFetching ? (
      <p className={cn(RPG_UI_META, 'py-3 text-center')}>Updating…</p>
    ) : !feedQuery.isFetched ? (
      <p className={cn(RPG_UI_META, 'px-1 py-3 text-center')}>
        Tap Update ballot to load candidates and votes.
      </p>
    ) : election.activeCandidates.length === 0 ? (
      <p className={cn(RPG_UI_META, 'px-1 py-3 text-center')}>No candidates yet.</p>
    ) : (
      ballotList
    );

  return (
    <div className={embedded ? 'space-y-1' : 'flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-1'}>
      {!embedded ? (
        <header className="shrink-0 space-y-1 px-2 text-center">
          <GamePanelDialogTitle>Mayor&apos;s Hut</GamePanelDialogTitle>
          <p className={RPG_UI_UI}>
            Mayor: <span className="font-medium text-[var(--candle-wax)]">{election.mayorName}</span>
          </p>
          {!election.isPlaceholderMayor ? (
            <p className={RPG_UI_CAPTION}>Elected by village vote</p>
          ) : (
            <p className={RPG_UI_CAPTION}>Placeholder until a candidate leads the vote</p>
          )}
        </header>
      ) : (
        <div>
          <p className={RPG_UI_UI}>
            Mayor: <span className="font-medium text-[var(--candle-wax)]">{election.mayorName}</span>
          </p>
          <p className={RPG_UI_CAPTION}>
            {election.isPlaceholderMayor
              ? 'Placeholder until a candidate leads the vote'
              : 'Elected by village vote'}
          </p>
        </div>
      )}

      <PanelUpdateButton
        label="Update ballot"
        onClick={() => refreshFeed()}
        isFetching={feedQuery.isFetching}
        showLedgerHint={!feedQuery.isFetched}
        variant={embedded ? 'chip' : 'full'}
      />

      {registrationBlock}

      {voteError ? (
        <p className="shrink-0 text-center text-xs text-red-300/90">{voteError}</p>
      ) : null}

      <p
        className={cn(
          RPG_UI_CAPTION,
          'uppercase tracking-[0.14em]',
          embedded ? 'shrink-0' : 'shrink-0 px-2'
        )}
      >
        Ballot
      </p>

      {embedded ? ballotBody : (
        <GamePanelScroll className="min-h-0 flex-1 rounded-md border border-[var(--candle-rule)]/60 bg-black/20">
          {ballotBody}
        </GamePanelScroll>
      )}
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
