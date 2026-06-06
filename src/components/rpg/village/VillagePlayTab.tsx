import type { ReactNode, RefObject } from 'react';

import { JournalScreen } from '../journal/JournalScreen';
import { QuestSceneScreen } from '../quest-scene/QuestSceneScreen';
import { TavernScreen } from '../tavern/TavernScreen';
import type { useTavern } from '../tavern/useTavern';
import type { ChronicleSegment } from '../dialogueFormat';
import type {
  JournalLogEntry,
  ModifierMap,
  QuestDefinition,
  QuestProgress,
  QuestState,
  QuestStep,
} from '../quests/types';

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
  playerHealth?: number;
  onPlayerHealthChange?: (health: number) => void;
  questProgress?: QuestProgress;
  tavernOpen?: boolean;
  onCloseTavern?: () => void;
  questState?: QuestState;
  myPubkey?: string;
  tavern?: ReturnType<typeof useTavern>;
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
  playerHealth = 100,
  onPlayerHealthChange,
  questProgress,
  tavernOpen = false,
  onCloseTavern,
  questState,
  myPubkey,
  tavern,
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
          playerHealth={playerHealth}
          onPlayerHealthChange={onPlayerHealthChange}
          questProgress={questProgress}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 shrink-0 overflow-hidden">{districtsPane}</div>
      {!tavernOpen ? (
        <div
          className="mt-2 shrink-0 border-t border-[var(--candle-rule)]/40"
          role="separator"
          aria-hidden
        />
      ) : null}
      {tavernOpen && questState && tavern && onCloseTavern ? (
        <TavernScreen
          className="min-h-0 flex-1 pt-1.5"
          questState={questState}
          myPubkey={myPubkey}
          tavern={tavern}
          onClose={onCloseTavern}
        />
      ) : (
        <JournalScreen
          className="min-h-0 flex-1 pt-1.5"
          playFeedSegments={playFeedSegments}
          playJournalLines={playJournalLines}
          newQuestIds={newQuestIds}
          questTitleById={questTitleById}
          visibleQuests={villageJournalQuests}
          completedQuestIds={completedQuestIds}
          onOpenQuest={onOpenQuest}
          dialogueScrollRef={dialogueScrollRef}
          onDialogueScroll={onDialogueScroll}
          visibleLocationActions={[]}
          playerFlags={playerFlags}
        />
      )}
    </div>
  );
}
