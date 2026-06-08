import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { clampPlayerHealth, getPlayerMaxHp } from '../combat/playerHealth';
import { PanelUpdateButton } from '../PanelUpdateButton';
import {
  RPG_COMMAND_CHIP,
  RPG_COMMAND_CHIP_LABEL,
  RPG_UI_CAPTION,
  RPG_UI_META,
} from '../typography/rpgUiTypography';
import { VillageLocationScreen } from '../village/VillageLocationScreen';
import { playerOwnsBounty } from './bountyMatch';
import { formatQuestBoardRewardLabel, questBoardTitle } from './questEscrow';
import { PostQuestForm } from './PostQuestForm';
import { TavernGraffitiViewer } from './TavernGraffitiViewer';
import type { PlayerQuestView } from './playerQuestNostr';
import type { useTavern } from './useTavern';
import type { QuestState } from '../quests/types';

type TavernArea = 'main' | 'bathroom';

type TavernScreenProps = {
  questState: QuestState;
  myPubkey: string | undefined;
  tavern: ReturnType<typeof useTavern>;
  onClose: () => void;
  onPlayerHealthChange?: (health: number) => void;
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isPoster = myPubkey === quest.pubkey;
  const ownsBounty = playerOwnsBounty(questState, quest.bounty);
  const canFulfill = !isPoster && ownsBounty;

  return (
    <li className="border-b border-[var(--candle-rule)]/45 last:border-b-0">
      <div className="flex items-center gap-0.5 py-1">
        <button
          type="button"
          className="inline-flex h-6 w-5 shrink-0 items-center justify-center rounded-sm text-[var(--candle-ink-faint)] transition-colors hover:text-[var(--candle-wax)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--candle-flame-soft)]"
          aria-expanded={detailsOpen}
          aria-label={detailsOpen ? 'Hide poster' : 'Show poster'}
          onClick={() => setDetailsOpen((open) => !open)}
        >
          <ChevronDown
            className={cn('size-3.5 transition-transform', detailsOpen && 'rotate-180')}
            aria-hidden
          />
        </button>
        <p className="rpg-font-ui min-w-0 flex-1 truncate text-[12px] leading-tight text-[var(--candle-ink-soft)]">
          <span className="font-medium text-[var(--candle-ink)]">{questBoardTitle(quest)}</span>
          <span className="text-[var(--candle-wax)]"> {formatQuestBoardRewardLabel(quest)}</span>
        </p>
        {isPoster ? (
          <button
            type="button"
            className={cn(RPG_COMMAND_CHIP, 'h-6 shrink-0 px-2 py-0')}
            disabled={isCancelPending}
            onClick={onCancelPoster}
          >
            <span className={cn(RPG_COMMAND_CHIP_LABEL, 'text-[10px]')}>
              {isCancelPending ? '…' : 'Cancel'}
            </span>
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              RPG_COMMAND_CHIP,
              'h-6 shrink-0 px-2 py-0',
              !canFulfill && 'line-through opacity-50'
            )}
            disabled={!canFulfill || isFulfillPending}
            onClick={onFulfill}
          >
            <span className={cn(RPG_COMMAND_CHIP_LABEL, 'text-[10px]')}>
              {isFulfillPending ? '…' : 'Fulfill'}
            </span>
          </button>
        )}
      </div>
      {detailsOpen ? (
        <p className={cn(RPG_UI_CAPTION, 'pb-1 pl-5 text-[var(--candle-ink-faint)]')}>{quest.posterName}</p>
      ) : null}
    </li>
  );
}

export function TavernScreen({
  questState,
  myPubkey,
  tavern,
  onClose,
  onPlayerHealthChange,
  className,
}: TavernScreenProps) {
  const [area, setArea] = useState<TavernArea>('main');
  const [graffitiOpen, setGraffitiOpen] = useState(false);
  const [postFormOpen, setPostFormOpen] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const { feed, feedQuery, postQuest, cancelQuest, fulfillQuest, invalidateFeed } = tavern;
  const maxHp = getPlayerMaxHp(questState);
  const currentHp = clampPlayerHealth(questState, questState.health);
  const atFullHealth = currentHp >= maxHp;

  const postQuestError =
    postQuest.error instanceof Error
      ? postQuest.error.message
      : postQuest.isError
        ? 'Could not post quest.'
        : null;

  return (
    <>
      <VillageLocationScreen
        panel="tavern"
        className={className}
        onClose={onClose}
        footer={
          <>
            {area === 'main' ? (
              <>
                <li>
                  <button
                    type="button"
                    className={RPG_COMMAND_CHIP}
                    disabled={atFullHealth || !onPlayerHealthChange}
                    onClick={() => onPlayerHealthChange?.(maxHp)}
                  >
                    <span className={RPG_COMMAND_CHIP_LABEL}>Have a drink</span>
                  </button>
                </li>
                {!postFormOpen ? (
                  <li>
                    <button
                      type="button"
                      className={RPG_COMMAND_CHIP}
                      disabled={!myPubkey}
                      onClick={() => setPostFormOpen(true)}
                    >
                      <span className={RPG_COMMAND_CHIP_LABEL}>Post New Quest</span>
                    </button>
                  </li>
                ) : null}
                <li>
                  <button type="button" className={RPG_COMMAND_CHIP} onClick={() => setArea('bathroom')}>
                    <span className={RPG_COMMAND_CHIP_LABEL}>Use bathroom</span>
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <button type="button" className={RPG_COMMAND_CHIP} onClick={() => setGraffitiOpen(true)}>
                    <span className={RPG_COMMAND_CHIP_LABEL}>View graffiti</span>
                  </button>
                </li>
                <li>
                  <button type="button" className={RPG_COMMAND_CHIP} onClick={() => setArea('main')}>
                    <span className={RPG_COMMAND_CHIP_LABEL}>Return to main room</span>
                  </button>
                </li>
              </>
            )}
          </>
        }
      >
        {area === 'bathroom' ? (
          <p className={cn(RPG_UI_META, 'text-center')}>
            The restroom is dim and smells of old ale. Something is scratched into the wall.
          </p>
        ) : (
          <>
            <section className="space-y-1">
              <PanelUpdateButton label="Update board" onClick={() => invalidateFeed()} />

              <div className="rounded-md border border-[var(--candle-rule)]/60 bg-black/20">
                {feedQuery.isPending ? (
                  <p className={cn(RPG_UI_META, 'py-3 text-center')}>Loading quests…</p>
                ) : feed.openQuests.length === 0 ? (
                  <p className={cn(RPG_UI_META, 'py-3 text-center')}>No open quests posted yet.</p>
                ) : (
                  <ul className="list-none px-2 py-1">
                    {feed.openQuests.map((quest) => (
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
                    ))}
                  </ul>
                )}
              </div>
            </section>

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
      </VillageLocationScreen>

      <TavernGraffitiViewer open={graffitiOpen} onOpenChange={setGraffitiOpen} />
    </>
  );
}
