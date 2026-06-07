import type { RefObject } from 'react';

import { useCurrentUser } from '@/hooks/useCurrentUser';

import type { useArenaTournament } from '../arena/useArenaTournament';
import type { useBlobbiFight } from '../blobbiFighting/useBlobbiFight';
import type { useBlobbiFightMemories } from '../blobbiFighting/useBlobbiFightMemories';
import type { usePlayerBlobbis } from '../blobbiFighting/usePlayerBlobbis';
import type { ChronicleSegment } from '../dialogueFormat';
import type { useGuildAlley } from '../guild/useGuildAlley';
import type { useMayorsHut } from '../mayorsHut/useMayorsHut';
import type { useMarket } from '../market/useMarket';
import type { useTavern } from '../tavern/useTavern';
import type { useVillageProjects } from '../villageProjects/useVillageProjects';
import type {
  JournalLogEntry,
  ModifierMap,
  QuestDefinition,
  QuestProgress,
  QuestState,
  QuestStep,
} from '../quests/types';
import { VillageDistrictList } from './VillageDistrictList';
import { VillagePlayTab } from './VillagePlayTab';
import type { VillagePanelId } from './villageCatalog';

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
  onDismissQuestScene?: () => void;
  townHallPing?: boolean;
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
  activeVillagePanel: VillagePanelId | null;
  onOpenVillagePanel: (panel: VillagePanelId) => void;
  onCloseVillagePanel: () => void;
  questState: QuestState;
  tavern: ReturnType<typeof useTavern>;
  arenaTournament: ReturnType<typeof useArenaTournament>;
  market: ReturnType<typeof useMarket>;
  mayorsHut: ReturnType<typeof useMayorsHut>;
  villageProjects: ReturnType<typeof useVillageProjects>;
  guildAlley: ReturnType<typeof useGuildAlley>;
  playerBlobbis: ReturnType<typeof usePlayerBlobbis>;
  blobbiFight: ReturnType<typeof useBlobbiFight>;
  blobbiFightMemories: ReturnType<typeof useBlobbiFightMemories>;
  onApplyModifiers: (delta: ModifierMap) => void;
  onSwitchJob: (jobSlug: string) => void;
  onMayorVoteRecorded?: (candidateName: string) => void;
  onMayorVoteRetracted?: () => void;
  onTravelToLocation: (locationId: string) => void;
  dayCounter: number;
  dayPacingActive: boolean;
  nextDayResetMs: number | null;
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
  onDismissQuestScene,
  townHallPing = false,
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
  activeVillagePanel,
  onOpenVillagePanel,
  onCloseVillagePanel,
  questState,
  tavern,
  arenaTournament,
  market,
  mayorsHut,
  villageProjects,
  guildAlley,
  playerBlobbis,
  blobbiFight,
  blobbiFightMemories,
  onApplyModifiers,
  onSwitchJob,
  onMayorVoteRecorded,
  onMayorVoteRetracted,
  onTravelToLocation,
  dayCounter,
  dayPacingActive,
  nextDayResetMs,
}: VillagePlaySurfaceProps) {
  const { user } = useCurrentUser();
  const displayName = playerName.trim() || 'Stranger';

  const districtsPane = (
    <VillageDistrictList
      questFlags={questFlags}
      onOpenPanel={onOpenVillagePanel}
      onTravelToLocation={onTravelToLocation}
      townHallPing={townHallPing}
    />
  );

  return (
    <section
      className="relative isolate flex h-full min-h-0 flex-1 flex-col overflow-hidden px-0"
      aria-label="Village hub"
    >
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
        onDismissQuestScene={onDismissQuestScene}
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
        activeVillagePanel={activeVillagePanel}
        onCloseVillagePanel={onCloseVillagePanel}
        questState={questState}
        myPubkey={user?.pubkey}
        tavern={tavern}
        arenaTournament={arenaTournament}
        market={market}
        mayorsHut={mayorsHut}
        villageProjects={villageProjects}
        guildAlley={guildAlley}
        playerBlobbis={playerBlobbis}
        blobbiFight={blobbiFight}
        blobbiFightMemories={blobbiFightMemories}
        onApplyModifiers={onApplyModifiers}
        onSwitchJob={onSwitchJob}
        onMayorVoteRecorded={onMayorVoteRecorded}
        onMayorVoteRetracted={onMayorVoteRetracted}
        dayCounter={dayCounter}
        dayPacingActive={dayPacingActive}
        nextDayResetMs={nextDayResetMs}
      />
    </section>
  );
}
