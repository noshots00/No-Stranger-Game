import { useState } from 'react';
import { cn } from '@/lib/utils';
import { GamePanelExpandable } from '../GamePanelExpandable';
import {
  RPG_COMMAND_CHIP,
  RPG_COMMAND_CHIP_LABEL,
  RPG_UI_CAPTION,
  RPG_UI_META,
  RPG_UI_UI,
} from '../typography/rpgUiTypography';
import { VillageLocationScreen } from '../village/VillageLocationScreen';
import { VillageActionChip, VillageActionRow, VillageActionRowItem } from '../village/VillageActionChip';
import { playerOwnsBounty } from './bountyMatch';
import { formatRewardSummary } from './questEscrow';
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
      triggerClassName="flex-col items-start gap-0.5 py-1"
      label={
        <>
          <span className={cn(RPG_UI_UI, 'min-w-0 truncate font-medium')}>{quest.title}</span>
          <span className={RPG_UI_CAPTION}>
            {quest.posterName} · Bounty: {quest.bounty} · Reward: {rewardLabel}
          </span>
        </>
      }
    >
      <div className="space-y-1">
        {quest.description ? (
          <p className={cn(RPG_UI_META, 'leading-relaxed')}>{quest.description}</p>
        ) : null}
        <VillageActionRow>
          <VillageActionRowItem>
            {isPoster ? (
              <VillageActionChip disabled={isCancelPending} onClick={onCancelPoster}>
                {isCancelPending ? 'Cancelling…' : 'Cancel quest'}
              </VillageActionChip>
            ) : (
              <VillageActionChip
                className={!canFulfill ? 'line-through opacity-50' : undefined}
                disabled={!canFulfill || isFulfillPending}
                onClick={onFulfill}
              >
                {isFulfillPending ? 'Fulfilling…' : 'Fulfill'}
              </VillageActionChip>
            )}
          </VillageActionRowItem>
        </VillageActionRow>
        {!isPoster && !canFulfill ? (
          <p className={cn(RPG_UI_CAPTION, 'text-center')}>
            You need the bounty item in inventory to fulfill.
          </p>
        ) : null}
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
    <>
      <VillageLocationScreen
        panel="tavern"
        className={className}
        onClose={onClose}
        footer={
          <>
            {area === 'main' ? (
              <>
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
            <div className="space-y-0.5 rounded-md border border-[var(--candle-rule)]/60 bg-black/15 p-1">
              {feedQuery.isPending ? (
                <p className={cn(RPG_UI_META, 'py-2 text-center')}>Loading quests…</p>
              ) : feed.openQuests.length === 0 ? (
                <p className={cn(RPG_UI_META, 'py-2 text-center')}>No open quests posted yet.</p>
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
      </VillageLocationScreen>

      <TavernGraffitiViewer open={graffitiOpen} onOpenChange={setGraffitiOpen} />
    </>
  );
}
