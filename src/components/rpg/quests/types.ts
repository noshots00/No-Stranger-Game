import type { CombatEncounterId } from '../combat/combatEncounters';
import type { CombatLoadout } from '../combat/combatTypes';

export type ModifierMap = Record<string, number>;

/** Single asset under `public/` (no leading slash), `https` URL, `data:` URL, or `/` root-relative. */
export type QuestImageFit = 'cover' | 'contain';

export type QuestImageRef = {
  src: string;
  alt?: string;
  /** Default `cover` (portrait crop). Use `contain` for wide art shown letterboxed in the slot. */
  fit?: QuestImageFit;
};

/** Structured layout beats appended to the dialogue log before step narration. */
export type QuestVisualBeat =
  | { kind: 'image'; src: string; alt?: string; fit?: QuestImageFit }
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
  /** Post-village jobs unlocked when this choice resolves. */
  unlockJobSlugs?: string[];
  /** Lose this fraction of current health (0–1), e.g. `0.5` = half current HP removed. */
  healthLossFraction?: number;
  /** Add to `QuestState.health` (clamped 0–100). */
  healthDelta?: number;
  /** Set `QuestState.health` to this value (clamped 0–100). Applied after fractional loss / delta on the same effect. */
  healthSet?: number;
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
   * Omit this choice from the list unless ANY of these flags are set on the player.
   * Use with `disabledIfAnyFlags` on other choices for hub menus that grow over time.
   */
  enabledIfAnyFlags?: string[];
  /**
   * Render disabled when the player lacks the minimum count for any listed modifier key
   * (stackable `item:*` counts, etc.). All keys must satisfy `(modifiers[key] ?? 0) >= value`.
   */
  disabledUnlessModifiersAtLeast?: ModifierMap;
  /** Optional suffix appended to `label` when the choice is disabled (e.g. "(already explored)"). */
  disabledLabel?: string;
  /**
   * Resolve `nextStepId` at choice time: `probability` (default 0.5) chance of
   * `successStepId`, otherwise `failStepId`. Ignores `nextStepId` when set.
   */
  randomBranch?: {
    successStepId: string;
    failStepId: string;
    probability?: number;
  };
  /** Start this combat encounter; on victory or defeat, resolve this choice (next step, journal, etc.). */
  combatEncounterId?: CombatEncounterId;
};

type QuestStepBase = {
  id: string;
  text: string;
  completeQuest?: boolean;
  /** Play quest scene: NPC talk UI + portrait from `getQuestScenePortraitSrc`. */
  npcTalkId?: string;
};

export type MessageQuestStep = QuestStepBase & {
  type: 'message';
  nextStepId?: string;
  effects?: ChoiceEffect;
  /** When true, choice resolution stops here until the player taps Continue (not auto-skipped). */
  requireContinueTap?: boolean;
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

/** Pick one label from `QuestState.questItems`; consumes one matching entry on submit. */
export type InventoryPickQuestStep = QuestStepBase & {
  type: 'inventoryPick';
  submitLabel: string;
  nextStepId: string;
  /** Shown when `questItems` is empty. */
  emptyText?: string;
  /** Flags applied after a successful throw/pick. */
  effects?: ChoiceEffect;
  /** When set, also records `prefix + itemLabel` (e.g. thrown-item label flag). */
  thrownItemFlagPrefix?: string;
};

export type QuestStep = MessageQuestStep | ChoiceQuestStep | InputQuestStep | InventoryPickQuestStep;

export type QuestDefinition = {
  id: string;
  title: string;
  briefing: string;
  createdAt: number;
  startStepId: string;
  steps: Record<string, QuestStep>;
  isAvailable: (context: QuestContext) => boolean;
  /** Saga unveil only — omit to use `isAvailable` (location gates ignored when set). */
  isUnveilEligible?: (context: QuestContext) => boolean;
  /** When true, completing this quest credits daily pacing / XP for the current game-day slice (main storyline). */
  mainDailyQuest?: boolean;
  /** Pick first step from flags/state when opening progress (see `resolveQuestEntryStepId` in engine). */
  resolveInitialStepId?: (state: QuestState) => string;
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
  /** `title-overlay`: title on art at standard card size; `title-overlay-hero`: full-width card for marquee beats. */
  questCardLayout?: 'default' | 'title-overlay' | 'title-overlay-hero';
  /** Default two-column card: art column (default left). */
  questCardImageSide?: 'left' | 'right';
  /** Chronicle / quest card tone label (forest memoryless arc). */
  toneTag?: 'vision' | 'echo' | 'mundane';
  /** Always opens in the modal popup (not inline on Play). */
  locationPopup?: boolean;
  /** After completion, travel can reopen the popup (hub/actions) without resetting saga progress. */
  locationRepeats?: boolean;
  /** Only listed on Play when `currentLocation` matches (travel-menu entry). */
  locationGated?: boolean;
  /** Travel here before opening a location-gated popup from the quest card. */
  requiredPlayLocation?: string;
  /** When false, Play quest card is display-only (no click/hover affordance). Default true. */
  questCardInteractive?: boolean;
};

export type QuestContext = {
  currentLocation: string;
  forestSubLocation: string | null;
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
  /** Class archetype slug once locked; null until assigned. */
  lockedClassSlug: string | null;
  /** When false, `minDay` gates are ignored (forest / creation arc binge). */
  dayPacingActive: boolean;
  /** Day counter (1-indexed) used by `minDay` quest gating. */
  currentDay: number;
};

export type QuestProgress = {
  currentStepId: string;
  isCompleted: boolean;
  choiceHistory: string[];
  /** Narration from the most recent choice (skipped Continue bridges), for quest scene display. */
  lastBeatResponse?: string;
  /** Prior step ids for dev back navigation (testing). */
  devStepHistory?: string[];
  /** Modifier map when this quest was first opened (dev restart / rewind). */
  modifiersAtQuestOpen?: ModifierMap;
};

/** Play-feed styling for immediate character sheet change lines. */
export type CharacterUpdateKind = 'player_name' | 'character_level';

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
  /** When speaker is CHARACTER_UPDATE_SPEAKER — drives targeted Play feed styling. */
  characterUpdateKind?: CharacterUpdateKind;
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
  /** Play-tab lines under the quest recap (ember milestone styling). */
  playMilestones?: string[];
};

export type QuestState = {
  activeQuestId: string | null;
  progressByQuestId: Record<string, QuestProgress>;
  modifiers: ModifierMap;
  /**
   * Modifier map at the start of the current in-game day (`lastDailyXpDay`).
   * Day N Report diffs against this so gains during that day's quests appear in the report.
   */
  dayReportModifierBaseline?: ModifierMap;
  /** Character level at the end of the prior day report (quest-completion count). */
  dayReportCharacterLevelBaseline?: number;
  /**
   * `questItems` at the end of the prior day report — Day N Report lists items gained since then.
   */
  dayReportQuestItemsBaseline?: string[];
  /** Full modifier map after each quest completes (dev restart rewind). */
  modifiersAfterQuestComplete?: Record<string, ModifierMap>;
  flags: string[];
  /** Player location label (e.g. Forest, Silver Lake). */
  currentLocation: string;
  /** Forest sub-destination (e.g. Old Well); header stays on Forest. */
  forestSubLocation?: string | null;
  playerName: string;
  experience: number; // Legacy aggregate XP field kept for migration compatibility.
  skills: {
    explorationXp: number;
    foragingXp: number;
    meleeAttackXp: number;
  };
  lastDailyXpDay: number;
  /**
   * Eastern `yyyy-MM-dd` when village calendar pacing last ran (anchor or rollover).
   * Forest arc ignores this; village rollovers compare vs midnight America/New_York on login.
   */
  lastDailyXpGrantEasternYmd?: string | null;
  dialogueLog: DialogueLogEntry[];
  /** World chronicle lines; persisted with quest checkpoints. */
  worldEventLog: WorldEventLogEntry[];
  /** Play-tab story recap only (path summaries); Chronicle uses `dialogueLog` for full scenes. */
  journalLog: JournalLogEntry[];
  /** First time the player opened a quest card (ms) — anchors cards in the Play timeline. */
  questFirstOpenedAtMs?: Record<string, number>;
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
  /** Travel-menu location ids the player has selected (clears “new” pings). */
  acknowledgedTravelLocationIds?: string[];
  /** Current HP (absolute; max from level + CON). */
  health: number;
  /** Combat loadout: weapon, other equipment, two active skills/spells. */
  loadout: CombatLoadout;
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
  /** Post-village profession slugs the player may switch to at the Jobs Hall. */
  unlockedJobSlugs?: string[];
  /** Currently active profession (one at a time). */
  activeJobSlug?: string | null;
  /** Last in-game day each job daily action was used (`jobSlug` → day index). */
  jobDailyActionBySlug?: Record<string, { lastActionDay: number }>;
  /** Village community project resources (stone, iron, …). */
  resources?: Record<string, number>;
  /** When set, Play shows Continue before/after the pending day report instead of auto-advancing. */
  playDayRollStaging?: PlayDayRollStaging | null;
};

/** Snapshot for day-report deltas while the Play tab stages report / continue beats. */
export type DayReportPrevSnapshot = Pick<
  QuestState,
  | 'modifiers'
  | 'skills'
  | 'experience'
  | 'resources'
  | 'dayReportModifierBaseline'
  | 'dayReportQuestItemsBaseline'
  | 'questItems'
  | 'flags'
>;

/** Forest in-session day roll: report already in log; one Continue to begin next day. */
export type PlayDayRollStaging = {
  phase: 'await_continue';
  endingDay: number;
  nextDay: number;
  calendarDay: number;
  sessionOnly: boolean;
  completedQuestId: string;
  prevForReport: DayReportPrevSnapshot;
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
