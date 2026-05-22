export type ModifierMap = Record<string, number>;

/** Single asset under `public/` (no leading slash), `https` URL, `data:` URL, or `/` root-relative. */
export type QuestImageRef = {
  src: string;
  alt?: string;
};

/** Structured layout beats appended to the dialogue log before step narration. */
export type QuestVisualBeat =
  | { kind: 'image'; src: string; alt?: string }
  | { kind: 'image-row'; images: QuestImageRef[] };

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
  /** When set (and valid in `VALID_SAVE_LOCATIONS`), updates `QuestState.currentLocation` after this choice. */
  setCurrentLocation?: string;
};

export type QuestChoice = {
  id: string;
  label: string;
  nextStepId?: string;
  completeQuest?: boolean;
  effects?: ChoiceEffect;
  /** World chronicle lines (`{playerName}` supported). */
  worldEventLogAdd?: string[];
  /** Play recap line appended immediately after this choice (`{playerName}` supported). */
  journalSummaryLineAdd?: string;
  /**
   * Render this choice as visible-but-disabled when ANY of these flags are set
   * on the player. Useful for one-shot branches the player has already explored.
   */
  disabledIfAnyFlags?: string[];
  /**
   * Render disabled when the player lacks the minimum count for any listed modifier key
   * (stackable `item:*` counts, etc.). All keys must satisfy `(modifiers[key] ?? 0) >= value`.
   */
  disabledUnlessModifiersAtLeast?: ModifierMap;
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
  /** When omitted, name submit does not advance `currentStepId` (e.g. origin ends at naming). */
  nextStepId?: string;
  minLength?: number;
  maxLength?: number;
  /** World chronicle lines after a successful name submit (`{playerName}` supported). */
  worldEventLogAfterSubmit?: string[];
  /** Play recap line after successful submit (`{playerName}` supported). */
  journalSummaryLineAfterSubmit?: string;
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
  /** When true, completing this quest credits daily pacing / XP for the current game-day slice (main storyline). */
  mainDailyQuest?: boolean;
  /** When set, the quest completes once all listed flags are present after a choice (union with `completeQuest`). */
  completionRequiresAllFlags?: string[];
  /**
   * Visual beats when entering a step (before that step’s narrator line).
   * Omitted step ids: no extra art (except `startStepId`, which keeps legacy shuffle portrait when omitted).
   * Set `startStepId` to `[]` to suppress the legacy portrait on quest open.
   */
  stepVisuals?: Partial<Record<string, QuestVisualBeat[]>>;
  /**
   * Play-tab recap lines when this quest completes (Chronicle still shows full `dialogueLog`).
   * Keys: choice ids joined with `|` in order (see `QUEST_JOURNAL_PATH_SEP` in `journalSummary.ts`).
   * Optional key `*` matches any path after exact keys fail. `{playerName}` supported.
   */
  journalSummariesByChoicePath?: Record<string, string>;
  /** When no path key matches (and no `*` entry), use this recap if set. */
  journalSummaryFallback?: string;
  /** Play-tab quest list card: title beside image (default) or overlaid on the card art. */
  questCardLayout?: 'default' | 'title-overlay';
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
  /** Story voices include `Narrator` (reply / outcome) and `NarratorPrompt` (choice framing). */
  speaker: string;
  text: string;
  /** Wall-clock time when the line was created (for chronicle merge / sort). */
  atMs: number;
  visualBeat?: QuestVisualBeat;
  /**
   * Quest whose UI produced this line. Play omits completed `sourceQuestId` dialogue so path summaries stay tidy;
   * Chronicle still uses full `dialogueLog`.
   */
  sourceQuestId?: string;
};

export type WorldEventLogEntry = {
  text: string;
  atMs: number;
};

/** Short recap on quest completion; shown on Play only (not Chronicle). */
export type JournalLogEntry = {
  id: string;
  questId: string;
  text: string;
  atMs: number;
  /** Modifier/item/skill gains attributed to this completion (may be empty). */
  completionRewards?: string[];
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
  /** Play-tab story recap only (path summaries); Chronicle uses `dialogueLog` for full scenes. */
  journalLog: JournalLogEntry[];
  /** Quest reward item labels for the character sheet. */
  questItems: string[];
  /** Canonical race slug after reflection quest (permanent); null until assigned. */
  assignedRaceSlug: string | null;
  /** Locked class archetype slug (`warrior`, `healer`, …); null until first track reaches CLASS_UNLOCK_POINTS. */
  lockedClassSlug: string | null;
  /**
   * IDs of quests that have been "unveiled" to the player at least once.
   * Drives the daily unveil cap (max 2 NEW per day) so eligible-but-not-yet-shown
   * quests sit in a hidden queue until day-rollover unveils them.
   */
  unveiledQuestIds: string[];
  /** Player health 0-100. Placeholder; reserved for future combat. */
  health: number;
  /**
   * Eastern calendar date (America/New_York, `yyyy-MM-dd`) when the player submitted their name
   * on the origin quest — immutable for this playthrough; used for day pacing and future verification.
   */
  characterCreationDateEastern: string | null;
  /**
   * App semver (`package.json` / `__APP_VERSION__`) recorded when the character was committed on the origin quest.
   * Used for occasional mandatory resets during early development.
   */
  characterCreatedAtAppVersion: string | null;
  /** Village arena W/L and personal fight history (synced from relay match events). */
  arenaRecord?: ArenaRecord;
  /** Active or last-left village guild membership (tab routing + checkpoint). */
  guildMembership?: GuildMembership | null;
  /** Last in-game day wolf-hide daily grants were applied (tavern repeatable). */
  lastWolfHideGrantDay?: number;
  /** Escrowed rewards for open player quests this client posted (keyed by quest `d` id). */
  tavernEscrowByQuestId?: Record<string, TavernEscrowEntry>;
  /** Escrowed goods for open market listings this client posted (keyed by listing `d` id). */
  marketEscrowByListingId?: Record<string, MarketEscrowEntry>;
};

export type TavernEscrowEntry = {
  questId: string;
  rewards: Array<
    | { kind: 'gold'; amount: number }
    | { kind: 'modifierItem'; key: string; quantity: number }
    | { kind: 'questItem'; label: string }
  >;
};

export type MarketEscrowEntry = {
  listingId: string;
  priceCopper: number;
  goods:
    | { kind: 'modifierItem'; key: string; quantity: number }
    | { kind: 'questItem'; label: string };
};

export type GuildMembership = {
  guildSlug: string;
  guildName: string;
  joinedAtMs: number;
  leftAtMs?: number;
};

export type ArenaFightRecord = {
  matchEventId: string;
  opponentName: string;
  opponentPubkey: string;
  won: boolean;
  myCombatRating: number;
  opponentCombatRating: number;
  atMs: number;
};

export type ArenaRecord = {
  wins: number;
  losses: number;
  /** Newest-first. */
  fights: ArenaFightRecord[];
};
