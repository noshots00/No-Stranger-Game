import type { ReactNode, RefObject } from 'react';

import { ArenaScreen } from '../arena/ArenaScreen';
import { BlobbiFightingScreen } from '../blobbiFighting/BlobbiFightingScreen';
import { CraftersCornerScreen } from '../crafter/CraftersCornerScreen';
import { JournalScreen } from '../journal/JournalScreen';
import { MarketScreen } from '../market/MarketScreen';
import { QuestSceneScreen } from '../quest-scene/QuestSceneScreen';
import { TavernScreen } from '../tavern/TavernScreen';
import type { useTavern } from '../tavern/useTavern';
import type { useArenaTournament } from '../arena/useArenaTournament';
import type { useBlobbiFight } from '../blobbiFighting/useBlobbiFight';
import type { useBlobbiFightMemories } from '../blobbiFighting/useBlobbiFightMemories';
import type { usePlayerBlobbis } from '../blobbiFighting/usePlayerBlobbis';
import type { useGuildAlley } from '../guild/useGuildAlley';
import type { useMayorsHut } from '../mayorsHut/useMayorsHut';
import type { useMarket } from '../market/useMarket';
import type { useVillageProjects } from '../villageProjects/useVillageProjects';
import type { ChronicleSegment } from '../dialogueFormat';
import type {
  JournalLogEntry,
  ModifierMap,
  QuestDefinition,
  QuestProgress,
  QuestState,
  QuestStep,
} from '../quests/types';
import { TownHallScreen } from './townHall/TownHallScreen';
import type { VillagePanelId } from './villageCatalog';

type VillagePlayTabProps = {
  districtsPane: ReactNode;
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
  dialogueScrollRef: RefObject<HTMLDivElement | null>;
  onDialogueScroll: () => void;
  showOriginStartHint: boolean;
  committedPlayerName: string;
  playerFlags: string[];
  playerModifiers: ModifierMap;
  questItems: string[];
  onInventoryPickSubmit?: (itemLabel: string) => void;
  showQuestChoiceEffects?: boolean;
  onPlayerHealthChange?: (health: number) => void;
  questProgress?: QuestProgress;
  activeVillagePanel: VillagePanelId | null;
  onCloseVillagePanel: () => void;
  questState: QuestState;
  myPubkey: string | undefined;
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
  dayCounter: number;
  dayPacingActive: boolean;
  nextDayResetMs: number | null;
};

export function VillagePlayTab({
  districtsPane,
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
  dialogueScrollRef,
  onDialogueScroll,
  showOriginStartHint,
  committedPlayerName,
  playerFlags,
  playerModifiers,
  questItems,
  onInventoryPickSubmit,
  showQuestChoiceEffects = false,
  onPlayerHealthChange,
  questProgress,
  activeVillagePanel,
  onCloseVillagePanel,
  questState,
  myPubkey,
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
  dayCounter,
  dayPacingActive,
  nextDayResetMs,
}: VillagePlayTabProps) {
  const showQuestScene =
    Boolean(playSceneQuestId) &&
    Boolean(activeQuest) &&
    Boolean(activeStep) &&
    activeQuest?.id === playSceneQuestId;

  if (showQuestScene && activeQuest && activeStep) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <QuestSceneScreen
          quest={activeQuest}
          step={activeStep}
          playerFlags={playerFlags}
          playerModifiers={playerModifiers}
          questItems={questItems}
          showOriginStartHint={showOriginStartHint}
          committedPlayerName={committedPlayerName}
          nameInput={nameInput}
          onNameInputChange={onNameInputChange}
          nameInputError={nameInputError}
          onStepChoice={onStepChoice}
          onNameSubmit={onNameSubmit}
          onInventoryPickSubmit={onInventoryPickSubmit}
          onAdvanceQuestMessage={onAdvanceQuestMessage}
          onDismissQuestScene={onDismissQuestScene}
          showQuestChoiceEffects={showQuestChoiceEffects}
          questState={questState}
          onPlayerHealthChange={onPlayerHealthChange}
          questProgress={questProgress}
        />
      </div>
    );
  }

  const locationScreen = (() => {
    switch (activeVillagePanel) {
      case 'arena':
        return (
          <ArenaScreen
            className="min-h-0 flex-1"
            onClose={onCloseVillagePanel}
            questState={questState}
            myPubkey={myPubkey}
            tournament={arenaTournament}
            onPlayerHealthChange={onPlayerHealthChange}
          />
        );
      case 'blobbiFighting':
        return (
          <BlobbiFightingScreen
            className="min-h-0 flex-1"
            onClose={onCloseVillagePanel}
            myPubkey={myPubkey}
            playerBlobbis={playerBlobbis}
            blobbiFight={blobbiFight}
            blobbiFightMemories={blobbiFightMemories}
          />
        );
      case 'tavern':
        return (
          <TavernScreen
            className="min-h-0 flex-1"
            questState={questState}
            myPubkey={myPubkey}
            tavern={tavern}
            onPlayerHealthChange={onPlayerHealthChange}
            onClose={onCloseVillagePanel}
          />
        );
      case 'market':
        return (
          <MarketScreen
            className="min-h-0 flex-1"
            onClose={onCloseVillagePanel}
            questState={questState}
            myPubkey={myPubkey}
            market={market}
            onApplyModifiers={onApplyModifiers}
          />
        );
      case 'townHall':
        return (
          <TownHallScreen
            className="min-h-0 flex-1"
            onClose={onCloseVillagePanel}
            myPubkey={myPubkey}
            mayorsHut={mayorsHut}
            villageProjects={villageProjects}
            guildAlley={guildAlley}
            questState={questState}
            onSwitchJob={onSwitchJob}
            onMayorVoteRecorded={onMayorVoteRecorded}
            onMayorVoteRetracted={onMayorVoteRetracted}
          />
        );
      case 'craftersCorner':
        return (
          <CraftersCornerScreen
            className="min-h-0 flex-1"
            onClose={onCloseVillagePanel}
            questState={questState}
            onApplyModifiers={onApplyModifiers}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {activeVillagePanel === null ? (
        <div className="min-h-0 shrink-0 overflow-hidden">{districtsPane}</div>
      ) : null}
      {locationScreen ?? (
        <JournalScreen
          className="min-h-0 flex-1 pt-1.5"
          playFeedSegments={playFeedSegments}
          playJournalLines={playJournalLines}
          newQuestIds={newQuestIds}
          questTitleById={questTitleById}
          visibleQuests={villageJournalQuests}
          activeQuest={activeQuest}
          completedQuestIds={completedQuestIds}
          onOpenQuest={onOpenQuest}
          dialogueScrollRef={dialogueScrollRef}
          onDialogueScroll={onDialogueScroll}
          visibleLocationActions={[]}
          playerFlags={playerFlags}
          activeJobSlug={questState.activeJobSlug}
          skills={questState.skills}
          dayCounter={dayCounter}
          dayPacingActive={dayPacingActive}
          nextDayResetMs={nextDayResetMs}
          communityProject={villageProjects.progress}
        />
      )}
    </div>
  );
}
