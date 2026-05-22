import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  const [expanded, setExpanded] = useState(false);
  const isPoster = myPubkey === quest.pubkey;
  const canFulfill = !isPoster && playerOwnsBounty(questState, quest.bounty);
  const rewardLabel = formatRewardSummary(quest);

  return (
    <Collapsible
      open={expanded}
      onOpenChange={setExpanded}
      className="rounded-md border border-[var(--candle-rule)]/80 bg-black/25"
    >
      <CollapsibleTrigger className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left font-serif text-sm text-[var(--candle-ink-soft)] hover:text-[var(--candle-wax)]">
        <span className="flex w-full items-center justify-between gap-2">
          <span className="min-w-0 truncate font-medium">{quest.title}</span>
          <ChevronDown
            className={cn('size-4 shrink-0 opacity-70 transition-transform', expanded && 'rotate-180')}
            aria-hidden
          />
        </span>
        <span className="text-[0.65rem] text-[var(--candle-ink-faint)]">
          {quest.posterName} · Bounty: {quest.bounty} · Reward: {rewardLabel}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 border-t border-[var(--candle-rule)]/60 px-3 py-2">
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
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="w-full font-serif text-xs text-[var(--candle-ink-faint)]"
              onClick={() => setExpanded(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function TavernPanel({ open, onOpenChange, questState, myPubkey, tavern }: TavernPanelProps) {
  const { toast } = useToast();
  const [postOpen, setPostOpen] = useState(false);
  const wolfHidesActive = isWolfHidesDailyActive(questState);
  const { feed, feedQuery, acceptWolfHides, postQuest, cancelQuest, fulfillQuest } = tavern;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            'flex !flex-col gap-0 overflow-hidden border border-[var(--candle-rule)] bg-[var(--candle-hearth)] p-4 pt-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]',
            'h-[95dvh] max-h-[95dvh] min-h-0 w-[min(95vw,430px)] max-w-none sm:rounded-lg'
          )}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="shrink-0 space-y-1 px-4 text-center sm:text-center">
            <DialogTitle className="font-cormorant text-xl font-semibold tracking-[0.06em] text-[var(--candle-wax)]">
              Tavern
            </DialogTitle>
            <p className="font-serif text-xs text-[var(--candle-ink-faint)]">Side quests and player bulletin</p>
          </DialogHeader>

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
              <ScrollArea className="min-h-0 flex-1 rounded-md border border-[var(--candle-rule)]/60 bg-black/20">
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
              </ScrollArea>
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
        </DialogContent>
      </Dialog>

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
