export type ModifierMap = Record<string, number>;

export type ChoiceEffect = {
  modifiersDelta?: ModifierMap;
  flagsSet?: string[];
  /** Display labels appended to `QuestState.questItems` (deduped, order preserved). */
  questItemsAdd?: string[];
  /** Set permanent race from highest `race:*` modifier tally (deterministic tie-break). */
  assignRaceFromRaceModifiers?: boolean;
  /**
   * Clears the player's active quest slot and resets this quest's progress to its `startStepId`,
   * so the quest stays available for re-entry without being marked complete.
   */
  clearActiveQuest?: boolean;
};

export type QuestChoice = {
  id: string;
  label: string;
  nextStepId?: string;
  completeQuest?: boolean;
  effects?: ChoiceEffect;
  /** World chronicle lines (`{playerName}` supported). */
  worldEventLogAdd?: string[];
  /**
   * Render this choice as visible-but-disabled when ANY of these flags are set
   * on the player. Useful for one-shot branches the player has already explored.
   */
  disabledIfAnyFlags?: string[];
  /** Optional suffix appended to `label` when the choice is disabled (e.g. "(already explored)"). */
  disabledLabel?: string;
};

type QuestStepBase = {
  id: string;
  text: string;
  completeQuest?: boolean;
};

export type MessageQuestStep = QuestStepBase & {
  type: 'message';
  nextStepId?: string;
};

export type ChoiceQuestStep = QuestStepBase & {
  type: 'choice';
  choices: QuestChoice[];
  /** World chronicle lines after picking any choice from this step (`{playerName}` supported). */
  worldEventLogAfterChoice?: string[];
};

export type InputQuestStep = QuestStepBase & {
  type: 'input';
  field: 'playerName';
  placeholder: string;
  submitLabel: string;
  nextStepId: string;
  minLength?: number;
  maxLength?: number;
  /** World chronicle lines after a successful name submit (`{playerName}` supported). */
  worldEventLogAfterSubmit?: string[];
};

export type QuestStep = MessageQuestStep | ChoiceQuestStep | InputQuestStep;

export type QuestDefinition = {
  id: string;
  title: string;
  briefing: string;
  createdAt: number;
  startStepId: string;
  steps: Record<string, QuestStep>;
  isAvailable: (context: QuestContext) => boolean;
  /** When set, the quest completes once all listed flags are present after a choice (union with `completeQuest`). */
  completionRequiresAllFlags?: string[];
};

export type QuestContext = {
  currentLocation: string;
  completedQuestIds: string[];
  flags: string[];
  /** Exploration skill level from `skills.explorationXp`. */
  explorationLevel: number;
  /** Foraging skill level from `skills.foragingXp`. */
  foragingLevel: number;
  /** Melee Attack skill level from `skills.meleeAttackXp`. */
  meleeAttackLevel: number;
  /** Sum of exploration + foraging + melee skill levels (aggregate “character level”). */
  characterLevel: number;
  /** Canonical race slug once locked; null until assigned. */
  assignedRaceSlug: string | null;
  /** Day counter (1-indexed) used by `minDay` quest gating. */
  currentDay: number;
};

export type QuestProgress = {
  currentStepId: string;
  isCompleted: boolean;
  choiceHistory: string[];
};

export type DialogueLogEntry = {
  id: string;
  speaker: string;
  text: string;
  /** Wall-clock time when the line was created (for chronicle merge / sort). */
  atMs: number;
};

export type WorldEventLogEntry = {
  text: string;
  atMs: number;
};

export type QuestState = {
  activeQuestId: string | null;
  progressByQuestId: Record<string, QuestProgress>;
  modifiers: ModifierMap;
  flags: string[];
  /** Player location label (e.g. Forest, Silver Lake). */
  currentLocation: string;
  playerName: string;
  experience: number; // Legacy aggregate XP field kept for migration compatibility.
  skills: {
    explorationXp: number;
    foragingXp: number;
    meleeAttackXp: number;
  };
  lastDailyXpDay: number;
  dialogueLog: DialogueLogEntry[];
  /** World chronicle lines; persisted with quest checkpoints. */
  worldEventLog: WorldEventLogEntry[];
  /** Quest reward item labels for the character sheet. */
  questItems: string[];
  /** Canonical race slug after reflection quest (permanent); null until assigned. */
  assignedRaceSlug: string | null;
  /**
   * IDs of quests that have been "unveiled" to the player at least once.
   * Drives the daily unveil cap (max 2 NEW per day) so eligible-but-not-yet-shown
   * quests sit in a hidden queue until day-rollover unveils them.
   */
  unveiledQuestIds: string[];
  /** Player health 0-100. Placeholder; reserved for future combat. */
  health: number;
};
