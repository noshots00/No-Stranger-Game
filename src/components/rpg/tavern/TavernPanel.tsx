import { useState } from 'react';
import { GamePanelDialog, GamePanelDialogTitle } from '../GamePanelDialog';
import { GamePanelExpandable } from '../GamePanelExpandable';
import { GamePanelScroll } from '../GamePanelScroll';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { playerOwnsBounty } from './bountyMatch';
import { formatRewardSummary } from './questEscrow';
import { isWolfHidesDailyActive } from './wolfHidesDaily';
import { PostQuestDialog } from './PostQuestDialog';
import type { PlayerQuestView } from './playerQuestNostr';
import type { useTavern } from './useTavern';
import type { QuestState } from '../quests/types';

type TavernPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questState: QuestState;
  myPubkey: string | undefined;
  tavern: ReturnType<typeof useTavern>;
};

function PlayerQuestRow({
  quest,
  myPubkey,
  questState,
  onFulfill,
  onCancelPoster,
  isFulfillPending,
  isCancelPending,
}: {
  quest: PlayerQuestView;
  myPubkey: string | undefined;
  questState: QuestState;
  onFulfill: () => void;
  onCancelPoster: () => void;
  isFulfillPending: boolean;
  isCancelPending: boolean;
}) {
  const isPoster = myPubkey === quest.pubkey;
  const canFulfill = !isPoster && playerOwnsBounty(questState, quest.bounty);
  const rewardLabel = formatRewardSummary(quest);

  return (
    <GamePanelExpandable
      triggerClassName="flex-col items-start gap-0.5"
      label={
        <>
          <span className="min-w-0 truncate font-medium">{quest.title}</span>
          <span className="text-[0.65rem] text-[var(--candle-ink-faint)]">
            {quest.posterName} · Bounty: {quest.bounty} · Reward: {rewardLabel}
          </span>
        </>
      }
    >
      <div className="space-y-2">
        {quest.description ? (
          <p className="font-serif text-xs leading-relaxed text-[var(--candle-ink-soft)]">{quest.description}</p>
        ) : null}
        {isPoster ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full font-serif text-xs"
            disabled={isCancelPending}
            onClick={onCancelPoster}
          >
            {isCancelPending ? 'Cancelling…' : 'Cancel quest'}
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              size="sm"
              className={cn(
                'w-full font-serif text-xs',
                !canFulfill && 'line-through opacity-50'
              )}
              disabled={!canFulfill || isFulfillPending}
              onClick={onFulfill}
            >
              {isFulfillPending ? 'Fulfilling…' : 'Fulfill'}
            </Button>
            {!canFulfill ? (
              <p className="text-center font-serif text-[0.6rem] text-[var(--candle-ink-faint)]">
                You need the bounty item in inventory to fulfill.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </GamePanelExpandable>
  );
}

export function TavernPanel({ open, onOpenChange, questState, myPubkey, tavern }: TavernPanelProps) {
  const { toast } = useToast();
  const [postOpen, setPostOpen] = useState(false);
  const wolfHidesActive = isWolfHidesDailyActive(questState);
  const { feed, feedQuery, acceptWolfHides, postQuest, cancelQuest, fulfillQuest } = tavern;

  return (
    <>
      <GamePanelDialog open={open} onOpenChange={onOpenChange} ariaLabel="Tavern" panelClassName="gap-0 p-4 pt-8">
        <header className="shrink-0 space-y-1 px-2 text-center">
          <GamePanelDialogTitle>Tavern</GamePanelDialogTitle>
          <p className="font-serif text-xs text-[var(--candle-ink-faint)]">Side quests and player bulletin</p>
        </header>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-1">
            <section className="shrink-0 space-y-2">
              <p className="font-serif text-[0.65rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">
                Side quests
              </p>
              <div className="rounded-md border border-[var(--candle-rule)]/80 bg-black/25 px-3 py-2">
                <p className="font-serif text-sm text-[var(--candle-wax)]">Wolf Hides (repeatable)</p>
                <p className="mt-1 font-serif text-xs text-[var(--candle-ink-soft)]">
                  Accept to receive 1–10 wolf hides on each new in-game day.
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="mt-2 w-full font-serif text-xs uppercase tracking-[0.1em]"
                  disabled={wolfHidesActive || acceptWolfHides.isPending || !myPubkey}
                  onClick={() =>
                    acceptWolfHides.mutate(undefined, {
                      onSuccess: () =>
                        toast({ title: 'Wolf Hides', description: 'Daily hide delivery is active.' }),
                      onError: (err) =>
                        toast({
                          title: 'Could not accept',
                          description: err instanceof Error ? err.message : 'Try again.',
                        }),
                    })
                  }
                >
                  {wolfHidesActive ? 'Active' : acceptWolfHides.isPending ? 'Accepting…' : 'Accept'}
                </Button>
              </div>
            </section>

            <section className="flex min-h-0 flex-1 flex-col gap-2">
              <p className="shrink-0 font-serif text-[0.65rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">
                Player quests
              </p>
              <GamePanelScroll className="min-h-0 flex-1 rounded-md border border-[var(--candle-rule)]/60 bg-black/20">
                <div className="space-y-2 p-2">
                  {feedQuery.isPending ? (
                    <p className="py-4 text-center font-serif text-sm text-[var(--candle-ink-faint)]">Loading…</p>
                  ) : feed.openQuests.length === 0 ? (
                    <p className="py-4 text-center font-serif text-sm text-[var(--candle-ink-faint)]">
                      No open quests. Post one below.
                    </p>
                  ) : (
                    feed.openQuests.map((quest) => (
                      <PlayerQuestRow
                        key={quest.questId}
                        quest={quest}
                        myPubkey={myPubkey}
                        questState={questState}
                        isFulfillPending={fulfillQuest.isPending}
                        isCancelPending={cancelQuest.isPending}
                        onFulfill={() =>
                          fulfillQuest.mutate(quest, {
                            onSuccess: () =>
                              toast({ title: 'Quest fulfilled', description: quest.title }),
                            onError: (err) =>
                              toast({
                                title: 'Fulfill failed',
                                description: err instanceof Error ? err.message : 'Try again.',
                              }),
                          })
                        }
                        onCancelPoster={() =>
                          cancelQuest.mutate(quest, {
                            onSuccess: () =>
                              toast({ title: 'Quest cancelled', description: 'Escrow refunded.' }),
                            onError: (err) =>
                              toast({
                                title: 'Cancel failed',
                                description: err instanceof Error ? err.message : 'Try again.',
                              }),
                          })
                        }
                      />
                    ))
                  )}
                </div>
              </GamePanelScroll>
            </section>

            <Button
              type="button"
              className="shrink-0 font-serif uppercase tracking-[0.1em]"
              disabled={!myPubkey}
              onClick={() => setPostOpen(true)}
            >
              Post New Quest
            </Button>
        </div>
      </GamePanelDialog>

      <PostQuestDialog
        open={postOpen}
        onOpenChange={setPostOpen}
        questState={questState}
        isPending={postQuest.isPending}
        onSubmit={(payload) =>
          postQuest.mutate(payload, {
            onSuccess: () => {
              setPostOpen(false);
              toast({ title: 'Quest posted', description: 'Reward held in escrow.' });
            },
            onError: (err) =>
              toast({
                title: 'Could not post',
                description: err instanceof Error ? err.message : 'Try again.',
              }),
          })
        }
      />
    </>
  );
}
