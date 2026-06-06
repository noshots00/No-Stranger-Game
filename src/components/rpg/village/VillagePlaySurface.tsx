import { useCallback, useMemo, type RefObject } from 'react';

import { useCurrentUser } from '@/hooks/useCurrentUser';

import type { ChronicleSegment } from '../dialogueFormat';
import type {
  JournalLogEntry,
  ModifierMap,
  QuestDefinition,
  QuestProgress,
  QuestStep,
} from '../quests/types';
import { VillageDistrictList } from './VillageDistrictList';
import { VillageFeedRefreshButton } from './VillageFeedRefreshButton';
import { VillagePlayTab } from './VillagePlayTab';
import type { VillagePanelId } from './villageCatalog';
import type { VillageLotOccupancyView } from './villageLotNostr';
import { useVillageLots } from './useVillageLots';

type VillagePlaySurfaceProps = {
  questFlags: string[];
  playerName: string;
  playFeedSegments: ChronicleSegment[];
  playJournalLines: readonly JournalLogEntry[];
  newQuestIds: readonly string[];
  questTitleById: Record<string, string>;
  villageJournalQuests: QuestDefinition[];
  completedQuestIds: string[];
  onOpenQuest: (questId: string) => void;
  playSceneQuestId: string | null;
  activeQuest: QuestDefinition | null;
  activeStep: QuestStep | null;
  nameInput: string;
  onNameInputChange: (value: string) => void;
  nameInputError: string | null;
  onStepChoice: (choiceId: string) => void;
  onNameSubmit: () => void;
  onAdvanceQuestMessage?: () => void;
  dialogueScrollRef: RefObject<HTMLDivElement | null>;
  onDialogueScroll: () => void;
  showOriginStartHint: boolean;
  playerModifiers: ModifierMap;
  questItems: string[];
  onInventoryPickSubmit?: (itemLabel: string) => void;
  showQuestChoiceEffects?: boolean;
  playerHealth?: number;
  onPlayerHealthChange?: (health: number) => void;
  questProgress?: QuestProgress;
  onOpenArena: () => void;
  onOpenTavern: () => void;
  onOpenMarket: () => void;
  onOpenTownHall: () => void;
  onOpenCraftersCorner: () => void;
  onTravelToLocation: (locationId: string) => void;
};

export function VillagePlaySurface({
  questFlags,
  playerName,
  playFeedSegments,
  playJournalLines,
  newQuestIds,
  questTitleById,
  villageJournalQuests,
  completedQuestIds,
  onOpenQuest,
  playSceneQuestId,
  activeQuest,
  activeStep,
  nameInput,
  onNameInputChange,
  nameInputError,
  onStepChoice,
  onNameSubmit,
  onAdvanceQuestMessage,
  dialogueScrollRef,
  onDialogueScroll,
  showOriginStartHint,
  playerModifiers,
  questItems,
  onInventoryPickSubmit,
  showQuestChoiceEffects = false,
  playerHealth = 100,
  onPlayerHealthChange,
  questProgress,
  onOpenArena,
  onOpenTavern,
  onOpenMarket,
  onOpenTownHall,
  onOpenCraftersCorner,
  onTravelToLocation,
}: VillagePlaySurfaceProps) {
  const { user } = useCurrentUser();
  const displayName = playerName.trim() || 'Stranger';

  const { feedQuery, occupancyByLotId: occupancyFromFeed, claimLot, buildLot, invalidateFeed } =
    useVillageLots({
      enabled: true,
      ownerName: displayName,
      myPubkey: user?.pubkey,
    });

  const emptyLots = useMemo(() => new Map<string, VillageLotOccupancyView>(), []);
  const occupancyByLotId = occupancyFromFeed ?? emptyLots;

  const onOpenPanel = useCallback(
    (panel: VillagePanelId) => {
      if (panel === 'arena') onOpenArena();
      else if (panel === 'tavern') onOpenTavern();
      else if (panel === 'market') onOpenMarket();
      else if (panel === 'townHall') onOpenTownHall();
      else if (panel === 'craftersCorner') onOpenCraftersCorner();
    },
    [onOpenArena, onOpenTavern, onOpenMarket, onOpenTownHall, onOpenCraftersCorner]
  );

  const districtsPane = (
    <VillageDistrictList
      questFlags={questFlags}
      myPubkey={user?.pubkey}
      occupancyByLotId={occupancyByLotId}
      isClaimPending={claimLot.isPending}
      isBuildPending={buildLot.isPending}
      onClaimLot={async (input) => {
        await claimLot.mutateAsync(input);
      }}
      onBuildLot={async (lotId) => {
        await buildLot.mutateAsync({ lotId });
      }}
      onOpenPanel={onOpenPanel}
      onTravelToLocation={onTravelToLocation}
    />
  );

  const showQuestScene =
    Boolean(playSceneQuestId) &&
    Boolean(activeQuest) &&
    Boolean(activeStep) &&
    activeQuest?.id === playSceneQuestId;

  return (
    <section
      className="relative isolate flex h-full min-h-0 flex-1 flex-col overflow-hidden px-1"
      aria-label="Village hub"
    >
      {!showQuestScene ? (
        <header className="relative shrink-0 pb-1.5 pt-0.5">
          <h2 className="text-center font-cormorant text-base font-semibold tracking-[0.06em] text-[var(--candle-wax)]">
            Strange Village
          </h2>
          <div className="absolute right-0 top-0.5">
            <VillageFeedRefreshButton
              isFetching={feedQuery.isFetching}
              onRefresh={() => void invalidateFeed()}
            />
          </div>
        </header>
      ) : null}

      <VillagePlayTab
        districtsPane={districtsPane}
        playFeedSegments={playFeedSegments}
        playJournalLines={playJournalLines}
        newQuestIds={newQuestIds}
        questTitleById={questTitleById}
        villageJournalQuests={villageJournalQuests}
        completedQuestIds={completedQuestIds}
        onOpenQuest={onOpenQuest}
        playSceneQuestId={playSceneQuestId}
        activeQuest={activeQuest}
        activeStep={activeStep}
        nameInput={nameInput}
        onNameInputChange={onNameInputChange}
        nameInputError={nameInputError}
        onStepChoice={onStepChoice}
        onNameSubmit={onNameSubmit}
        onAdvanceQuestMessage={onAdvanceQuestMessage}
        dialogueScrollRef={dialogueScrollRef}
        onDialogueScroll={onDialogueScroll}
        showOriginStartHint={showOriginStartHint}
        committedPlayerName={displayName}
        playerFlags={questFlags}
        playerModifiers={playerModifiers}
        questItems={questItems}
        onInventoryPickSubmit={onInventoryPickSubmit}
        showQuestChoiceEffects={showQuestChoiceEffects}
        playerHealth={playerHealth}
        onPlayerHealthChange={onPlayerHealthChange}
        questProgress={questProgress}
      />
    </section>
  );
}
