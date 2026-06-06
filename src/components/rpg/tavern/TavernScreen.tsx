import { useState } from 'react';
import { cn } from '@/lib/utils';
import { GamePanelExpandable } from '../GamePanelExpandable';
import { Button } from '@/components/ui/button';
import {
  RPG_CHOICE_GRID,
  RPG_COMMAND_CHIP,
  RPG_COMMAND_CHIP_LABEL,
  RPG_UI_BODY,
  RPG_UI_EMPHASIS,
  RPG_UI_META,
} from '../typography/rpgUiTypography';
import { playerOwnsBounty } from './bountyMatch';
import { formatRewardSummary } from './questEscrow';
import { PostQuestForm } from './PostQuestForm';
import { TavernGraffitiViewer } from './TavernGraffitiViewer';
import { TAVERN_INNKEEPER_SRC } from './tavernArt';
import type { PlayerQuestView } from './playerQuestNostr';
import type { useTavern } from './useTavern';
import type { QuestState } from '../quests/types';

type TavernArea = 'main' | 'bathroom';

type TavernScreenProps = {
  questState: QuestState;
  myPubkey: string | undefined;
  tavern: ReturnType<typeof useTavern>;
  onClose: () => void;
  className?: string;
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
      triggerClassName="flex-col items-start gap-0.5 py-1.5"
      label={
        <>
          <span className={cn(RPG_UI_BODY, 'min-w-0 truncate font-medium')}>{quest.title}</span>
          <span className={RPG_UI_META}>
            {quest.posterName} · Bounty: {quest.bounty} · Reward: {rewardLabel}
          </span>
        </>
      }
    >
      <div className="space-y-1.5">
        {quest.description ? (
          <p className={cn(RPG_UI_BODY, 'leading-relaxed text-[var(--candle-ink-soft)]')}>
            {quest.description}
          </p>
        ) : null}
        {isPoster ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full text-[13px]"
            disabled={isCancelPending}
            onClick={onCancelPoster}
          >
            {isCancelPending ? 'Cancelling…' : 'Cancel quest'}
          </Button>
        ) : (
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              size="sm"
              className={cn('w-full text-[13px]', !canFulfill && 'line-through opacity-50')}
              disabled={!canFulfill || isFulfillPending}
              onClick={onFulfill}
            >
              {isFulfillPending ? 'Fulfilling…' : 'Fulfill'}
            </Button>
            {!canFulfill ? (
              <p className={cn(RPG_UI_META, 'text-center')}>
                You need the bounty item in inventory to fulfill.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </GamePanelExpandable>
  );
}

export function TavernScreen({
  questState,
  myPubkey,
  tavern,
  onClose,
  className,
}: TavernScreenProps) {
  const [area, setArea] = useState<TavernArea>('main');
  const [graffitiOpen, setGraffitiOpen] = useState(false);
  const [postFormOpen, setPostFormOpen] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const { feed, feedQuery, postQuest, cancelQuest, fulfillQuest } = tavern;

  const postQuestError =
    postQuest.error instanceof Error
      ? postQuest.error.message
      : postQuest.isError
        ? 'Could not post quest.'
        : null;

  return (
    <section className={cn('relative flex h-full min-h-0 flex-col gap-1.5', className)}>
      <div className="min-h-0 flex-1 overflow-y-auto pr-0 [scroll-padding-bottom:min(8dvh,80px)]">
        <div className="space-y-2 px-0.5">
          <img
            src={TAVERN_INNKEEPER_SRC}
            alt=""
            className="aspect-[16/7] w-full rounded-md border border-[var(--candle-rule)] object-cover object-[center_20%] shadow-[0_8px_28px_rgba(0,0,0,0.4)]"
          />
          <h2 className={cn(RPG_UI_EMPHASIS, 'text-center text-[var(--candle-wax)]')}>
            &ldquo;Welcome to the tavern!&rdquo;
          </h2>

          {area === 'bathroom' ? (
            <p className={cn(RPG_UI_BODY, 'text-center text-[var(--candle-ink-soft)]')}>
              The restroom is dim and smells of old ale. Something is scratched into the wall.
            </p>
          ) : (
            <>
              <div className="space-y-1 rounded-md border border-[var(--candle-rule)]/60 bg-black/15 p-1.5">
                {feedQuery.isPending ? (
                  <p className={cn(RPG_UI_META, 'py-3 text-center')}>Loading quests…</p>
                ) : feed.openQuests.length === 0 ? (
                  <p className={cn(RPG_UI_META, 'py-3 text-center')}>
                    No open quests posted yet.
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
                          onError: () => {
                            /* inline row state only */
                          },
                        })
                      }
                      onCancelPoster={() =>
                        cancelQuest.mutate(quest, {
                          onError: () => {
                            /* inline row state only */
                          },
                        })
                      }
                    />
                  ))
                )}
              </div>

              {postFormOpen ? (
                <PostQuestForm
                  questState={questState}
                  isPending={postQuest.isPending}
                  errorMessage={postError ?? postQuestError}
                  onCancel={() => {
                    setPostFormOpen(false);
                    setPostError(null);
                  }}
                  onSubmit={(payload) => {
                    setPostError(null);
                    postQuest.mutate(payload, {
                      onSuccess: () => {
                        setPostFormOpen(false);
                        setPostError(null);
                      },
                      onError: (err) =>
                        setPostError(err instanceof Error ? err.message : 'Could not post quest.'),
                    });
                  }}
                />
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="shrink-0 space-y-1.5 pt-1.5">
        <ul className={RPG_CHOICE_GRID}>
          {area === 'main' ? (
            <>
              {!postFormOpen ? (
                <li>
                  <button
                    type="button"
                    className={cn(RPG_COMMAND_CHIP, 'min-h-[var(--rpg-command-min-h)]')}
                    disabled={!myPubkey}
                    onClick={() => setPostFormOpen(true)}
                  >
                    <span className={RPG_COMMAND_CHIP_LABEL}>Post New Quest</span>
                  </button>
                </li>
              ) : null}
              <li>
                <button
                  type="button"
                  className={cn(RPG_COMMAND_CHIP, 'min-h-[var(--rpg-command-min-h)]')}
                  onClick={() => setArea('bathroom')}
                >
                  <span className={RPG_COMMAND_CHIP_LABEL}>Use bathroom</span>
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <button
                  type="button"
                  className={cn(RPG_COMMAND_CHIP, 'min-h-[var(--rpg-command-min-h)]')}
                  onClick={() => setGraffitiOpen(true)}
                >
                  <span className={RPG_COMMAND_CHIP_LABEL}>View graffiti</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={cn(RPG_COMMAND_CHIP, 'min-h-[var(--rpg-command-min-h)]')}
                  onClick={() => setArea('main')}
                >
                  <span className={RPG_COMMAND_CHIP_LABEL}>Return to main room</span>
                </button>
              </li>
            </>
          )}
          <li>
            <button
              type="button"
              className={cn(RPG_COMMAND_CHIP, 'min-h-[var(--rpg-command-min-h)]')}
              onClick={onClose}
            >
              <span className={RPG_COMMAND_CHIP_LABEL}>Leave tavern</span>
            </button>
          </li>
        </ul>
      </div>

      <TavernGraffitiViewer open={graffitiOpen} onOpenChange={setGraffitiOpen} />
    </section>
  );
}
