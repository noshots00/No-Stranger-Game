import type { RefObject } from 'react';
import type { ChronicleSegment } from '../dialogueFormat';
import { JournalScreen } from '../journal/JournalScreen';
import { QuestSceneScreen } from '../quest-scene/QuestSceneScreen';
import type {
  JournalLogEntry,
  ModifierMap,
  QuestDefinition,
  QuestProgress,
  QuestState,
  QuestStep,
} from '../quests/types';
type PlayTabProps = {
  playFeedSegments: ChronicleSegment[];
  playJournalLines: readonly JournalLogEntry[];
  newQuestIds: readonly string[];
  questTitleById: Record<string, string>;
  visibleQuests: QuestDefinition[];
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
  visibleLocationActions: string[];
  showOriginStartHint: boolean;
  committedPlayerName: string;
  onLocationAction?: (actionLabel: string) => void;
  playerFlags: string[];
  playerModifiers: ModifierMap;
  questItems: string[];
  onInventoryPickSubmit?: (itemLabel: string) => void;
  showQuestChoiceModifiers?: boolean;
  showQuestChoiceEffects?: boolean;
  questState: QuestState;
  onPlayerHealthChange?: (health: number) => void;
  questProgress?: QuestProgress;
  activeJobSlug?: string | null;
  skills?: QuestState['skills'];
  dayCounter?: number;
  dayPacingActive?: boolean;
  nextDayResetMs?: number | null;
};

export function PlayTab({
  playFeedSegments,
  playJournalLines,
  newQuestIds,
  questTitleById,
  visibleQuests,
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
  visibleLocationActions,
  showOriginStartHint,
  committedPlayerName,
  onLocationAction,
  playerFlags,
  playerModifiers,
  questItems,
  onInventoryPickSubmit,
  showQuestChoiceModifiers = false,
  showQuestChoiceEffects = false,
  questState,
  onPlayerHealthChange,
  questProgress,
  activeJobSlug = null,
  skills,
  dayCounter = 1,
  dayPacingActive = false,
  nextDayResetMs = null,
}: PlayTabProps) {
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
        showQuestChoiceModifiers={showQuestChoiceModifiers}
        showQuestChoiceEffects={showQuestChoiceEffects}
        questState={questState}
        onPlayerHealthChange={onPlayerHealthChange}
        questProgress={questProgress}
      />
      </div>
    );
  }

  return (
    <JournalScreen
      playFeedSegments={playFeedSegments}
      playJournalLines={playJournalLines}
      newQuestIds={newQuestIds}
      questTitleById={questTitleById}
      visibleQuests={visibleQuests}
      activeQuest={activeQuest}
      completedQuestIds={completedQuestIds}
      onOpenQuest={onOpenQuest}
      dialogueScrollRef={dialogueScrollRef}
      onDialogueScroll={onDialogueScroll}
      visibleLocationActions={visibleLocationActions}
      playerFlags={playerFlags}
      onLocationAction={onLocationAction}
      activeJobSlug={activeJobSlug}
      skills={skills}
      dayCounter={dayCounter}
      dayPacingActive={dayPacingActive}
      nextDayResetMs={nextDayResetMs}
      playerName={committedPlayerName}
    />
  );
}
