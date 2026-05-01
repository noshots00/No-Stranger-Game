export type ModifierMap = Record<string, number>;

export type ChoiceEffect = {
  modifiersDelta?: ModifierMap;
  flagsSet?: string[];
};

export type QuestChoice = {
  id: string;
  label: string;
  nextStepId?: string;
  completeQuest?: boolean;
  effects?: ChoiceEffect;
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
};

export type InputQuestStep = QuestStepBase & {
  type: 'input';
  field: 'playerName';
  placeholder: string;
  submitLabel: string;
  nextStepId: string;
  minLength?: number;
  maxLength?: number;
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
};

export type QuestContext = {
  currentLocation: string;
  completedQuestIds: string[];
  flags: string[];
  /** Exploration skill level from `skills.explorationXp`. */
  explorationLevel: number;
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
  };
  lastDailyXpDay: number;
  dialogueLog: DialogueLogEntry[];
  /** World chronicle lines; persisted with quest checkpoints. */
  worldEventLog: WorldEventLogEntry[];
};
