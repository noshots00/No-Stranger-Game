/** Set by Vite from `package.json` `version` — canonical in-app display version (see `vite.config.ts`). */
declare const __APP_VERSION__: string;

/** Same as `UI_VERSION_LABEL` without prefix/suffix — use when storing semver in save data. */
export const APP_VERSION = __APP_VERSION__;

export const SILVER_LAKE_FLAG = 'silver-lake-unlocked';
/** @deprecated Legacy saves — airship quest replaced by forest cave. */
export const AIRSHIP_FLAG = 'airship-discovered';
export const FOREST_CAVE_DISCOVERED_FLAG = 'forest-cave-discovered';
export const QUEST_FOREST_CAVE_ID = 'quest-005-forest-cave';
export const WOLF_ATTACK_DAILY_FLAG = 'wolf-attack-daily-active';
export const WOLF_ATTACK_DAILY_CHANCE = 0.1;
export const DAILY_ITEM_QUEST_CHANCE = 0.025;
export const EARRING_DAILY_FLAG = 'earring-daily-active';
export const BRACELET_DAILY_FLAG = 'bracelet-daily-active';
export const SHOE_DAILY_FLAG = 'shoe-daily-active';
export const HAT_DAILY_FLAG = 'hat-daily-active';
export const FEVER_DREAM_PENDING_FLAG = 'fever-dream-pending';
export const FEVER_DREAM_UNLOCKED_FLAG = 'fever-dream-unlocked';
export const SWEET_DREAM_PENDING_FLAG = 'sweet-dream-pending';
export const SWEET_DREAM_UNLOCKED_FLAG = 'sweet-dream-unlocked';
export const DILEMMA_DAILY_CHANCE = 0.05;
export const TROLLEY_DAILY_FLAG = 'trolley-daily-active';
export const HEINZ_DAILY_FLAG = 'heinz-daily-active';
export const PRISONER_DAILY_FLAG = 'prisoner-daily-active';
export const LIFEBOAT_DAILY_FLAG = 'lifeboat-daily-active';
export const SOPHIE_DAILY_FLAG = 'sophie-daily-active';

/** Pending flags promoted to unlocked on the next daily reset (one-day delay). */
export const DELAYED_QUEST_UNLOCKS: ReadonlyArray<{ pending: string; unlocked: string }> = [
  { pending: FEVER_DREAM_PENDING_FLAG, unlocked: FEVER_DREAM_UNLOCKED_FLAG },
  { pending: SWEET_DREAM_PENDING_FLAG, unlocked: SWEET_DREAM_UNLOCKED_FLAG },
];
export const QUEST_ORIGIN_ID = 'quest-001-origin';
/** Mainline forest / first night (`flavor-five` → endings); grants `quest001-complete` when done. */
export const QUEST_FIRST_NIGHT_ID = 'quest-002-first-night';
/** Forest beat after first night — The Old Well (Door-style popup). */
export const QUEST_002B_WILL_I_STARVE_ID = 'quest-002-b-will-i-starve';
export const QUEST_002B_WELL_HALT_STEP_ID = 'well-halt';
export const QUEST_002B_WELL_HUB_STEP_ID = 'well-hub';
/** Story beat: after 2b, unlocks merchant travel (`quest-003-b-meet-merchant`). */
export const QUEST_003B_MEET_MERCHANT_ID = 'quest-003-b-meet-merchant';

/** Forest parent hub in the header travel menu (persisted `currentLocation`). */
export const FOREST_PARENT_LOCATION = 'Forest';
/** Day 2 forest beat — Dyer's Crypt (main quest 3). */
export const QUEST_DYERS_CRYPT_ID = 'quest-003-dyers-crypt';
/** Day 2 forest beat — fever or sweet dream (ends the calendar day). */
export const QUEST_DAY_TWO_DREAM_ID = 'quest-007-day-two-dream';
/** Forest sub-location reached via Wandering Skeleton. */
export const ANCIENT_CEMETERY_LOCATION = 'Ancient Cemetery';
export const ANCIENT_CEMETERY_DISCOVERED_FLAG = 'ancient-cemetery-discovered';
/** Unlocks under The Forest when quest 3 is unveiled. */
export const OLD_WELL_LOCATION = 'Old Well';
/** Player entered the Old Well popup quest at least once. */
export const QUEST_002B_WELL_OPENED_FLAG = 'quest-002-b-well-opened';
/** Player threw an item into the well (see `quest-002-b-thrown-item-*`). */
export const QUEST_002B_WELL_THREW_FLAG = 'quest-002-b-well-threw-item';
/** Strange coin already retrieved from the bucket. */
export const QUEST_002B_WELL_COIN_FLAG = 'quest-002-b-well-coin-received';
/** `quest-002-b-thrown:<item label>` — thrown item label for well copy. */
export const QUEST_002B_THROWN_LABEL_PREFIX = 'quest-002-b-thrown:';

export function thrownItemLabelFromFlags(flags: readonly string[]): string | null {
  const hit = flags.find((f) => f.startsWith(QUEST_002B_THROWN_LABEL_PREFIX));
  if (!hit) return null;
  const label = hit.slice(QUEST_002B_THROWN_LABEL_PREFIX.length).trim();
  return label.length > 0 ? label : null;
}

export function thrownItemFlagForLabel(label: string): string {
  return `${QUEST_002B_THROWN_LABEL_PREFIX}${label.trim()}`;
}
/** Quest 4b — Carl at the door (NPC dialog template). */
export const QUEST_004_B_THE_DOOR_ID = 'quest-004-b-the-door';
export const QUEST_004_B_CARL_HUB_STEP_ID = 'carl-hub';
export const DOOR_APPROACH_YELL_FLAG = 'door-approach-yell';
export const DOOR_APPROACH_KNOCK_FLAG = 'door-approach-knock';
export const DOOR_APPROACH_HIDE_FLAG = 'door-approach-hide';
/** Set when the player submits their name on origin (distinct from `quest001-complete`). */
export const QUEST001_NAMED_FLAG = 'quest001-named';
/** Matches quest choice / transcript CSS in `index.css` (`.choice-fade-out`, `.quest-body-*`, `.quest-transcript-burn-in`). */
export const QUEST_TRANSITION_MS = 320;
export const QUEST_STATE_STORAGE_KEY = 'nsg:facsimile-quest-state';
/** @deprecated legacy numeric ms; prefer CHARACTER_CREATION_DATE_STORAGE_KEY */
export const CHARACTER_START_TS_STORAGE_KEY = 'nsg:character-start-timestamp';
/** Eastern `yyyy-MM-dd` when the player named their character (game pacing + future verification). */
export const CHARACTER_CREATION_DATE_STORAGE_KEY = 'nsg:character-creation-date-eastern';

/** Per-pubkey creation date (preferred when logged in — avoids cross-account bleed from a global key). */
export function characterCreationDateStorageKeyForPubkey(pubkey: string): string {
  return `${CHARACTER_CREATION_DATE_STORAGE_KEY}:${pubkey}`;
}
/** After "Reset story", ignore relay kind 10031 until a new creation date exists in quest state. */
export const CHARACTER_CREATION_RESET_PENDING_STORAGE_KEY = 'nsg:character-creation-reset-pending';
export const DEV_DAY_OFFSET_STORAGE_KEY = 'nsg:dev-day-offset-ms';
/** When enabled in the game menu, shows quest modifier breakdown on the Character tab. */
export const DEV_SHOW_MODIFIER_DETAILS_STORAGE_KEY = 'nsg:dev-show-modifier-details';
/** When enabled, quest choices show modifiersDelta and quest items (dev only). */
export const DEV_SHOW_QUEST_CHOICE_MODIFIERS_STORAGE_KEY = 'nsg:dev-show-quest-choice-modifiers';
/** When enabled, quest choices show flags, routing, and non-modifier effects (dev only). */
export const DEV_SHOW_QUEST_CHOICE_EFFECTS_STORAGE_KEY = 'nsg:dev-show-quest-choice-effects';
/** When enabled, Quests tab lists every quest for testing (dev only). */
export const DEV_UNLOCK_ALL_QUESTS_STORAGE_KEY = 'nsg:dev-unlock-all-quests';
/** When enabled, Play quest interactions use the legacy modal popup instead of inline expansion. */
export const DEV_USE_QUEST_POPUP_STORAGE_KEY = 'nsg:dev-use-quest-popup';
/** Quest step back arrow on choice/message panes (dev testing). */
/** Dev quest-step rewind UI (removed from Play; logic remains in `questStepBack.ts`). */
export const SHOW_QUEST_STEP_BACK = false;
/** Set once the player opens quest 1 at least once this run/save. */
export const ORIGIN_QUEST_OPENED_FLAG = 'quest001-opened';
export const DAY_IN_MS = 24 * 60 * 60 * 1000;
export const DAILY_XP = 1440;
/** When false, end-of-day rolls advance `lastDailyXpDay` only (no character XP or skill XP). */
export const DAILY_XP_GRANTS_ENABLED = false;

/** Play/Chronicle “prints”: `worldEventLog` lines + journal `playMilestones` (name, level-up, …) — off while authoring. */
export const WORLD_EVENT_PRINTS_ENABLED = false;
export const NPC_AVATAR_URL = 'https://api.dicebear.com/8.x/adventurer/svg?seed=Elira';
export const CLASS_UNLOCK_POINTS = 5;
/** Injury modifiers appear on the character sheet at this magnitude (1 = minor). */
export const INJURY_SHEET_UNLOCK_POINTS = 1;
/** Modifier magnitude for severe injuries (`minor` = 1, `moderate` = 2). */
export const SEVERE_INJURY_MAGNITUDE = 3;
/** Dyer's Crypt cemetery skeleton fight → character sheet injury row. */
export const WOUNDED_SHOULDER_INJURY_KEY = 'injury:wounded_shoulder';

/** Canonical class archetype slugs (`class:<slug>`); single-class lock picks one at ≥ CLASS_UNLOCK_POINTS. */
export const CLASS_ARCHETYPE_SLUGS = ['warrior', 'rogue', 'mage', 'healer', 'ranger'] as const;
export const CHARACTER_START_KIND = 10031;
export const CHARACTER_START_D_TAG = 'character-start';
export const FOLLOW_LIST_KIND = 3;
export const GOLD_MODIFIER_KEYS = ['Gold', 'gold', 'Coins', 'coins'] as const;
export const COPPER_PER_SILVER = 12;
export const SILVER_PER_GOLD = 20;
export const COPPER_PER_GOLD = COPPER_PER_SILVER * SILVER_PER_GOLD;

export const CURRENCY_COPPER_KEY = 'currency:copper';

/** Lowercase coin authoring key -> value in coppers. Folded into CURRENCY_COPPER_KEY at canonicalize time. */
export const COIN_AUTHORING_KEY_VALUE: Record<string, number> = {
  copper: 1,
  silver: COPPER_PER_SILVER,
  gold: COPPER_PER_GOLD,
  coins: 1,
};
/** Legacy keys + canonical class keys for archetype paths (hidden from granular modifier gain lines). */
export const HIDDEN_CLASS_MODIFIER_KEYS = [
  'WarriorClass',
  'MageClass',
  'RogueClass',
  'HealerClass',
  'RangerClass',
  'class:warrior',
  'class:mage',
  'class:rogue',
  'class:healer',
  'class:ranger',
] as const;
export const PRIMARY_STAT_MODIFIER_LABEL: Record<string, string> = {
  Strength: 'strength',
  Dexterity: 'dexterity',
  Constitution: 'constitution',
  Intelligence: 'intelligence',
  Wisdom: 'wisdom',
  Charisma: 'charisma',
};

/** Modifier skill keys `skill:<category>:<slug>` — display names for character sheet sections. */
export const SKILL_MODIFIER_CATEGORY_LABEL: Record<string, string> = {
  general: 'General',
  combat: 'Combat',
  weapon: 'Weapon',
  magic: 'Magic',
  crafting: 'Crafting',
};

/** Sort order for skill category sections (unknown categories sort after these). */
export const SKILL_MODIFIER_CATEGORY_ORDER: string[] = [
  'combat',
  'weapon',
  'magic',
  'crafting',
  'general',
];
export const PLAY_DIALOGUE_RECENT_MAX = 120;
/** Play tab: cap journal recap entries merged into the feed (Chronicle ignores journal). */
export const PLAY_JOURNAL_RECENT_MAX = 80;
export const PLAY_WORLD_RECENT_MAX = 40;
export const DIALOGUE_SCROLL_PIN_EPS = 80;
/** Shown in the game header; always reflects `package.json` `version` (no second source of truth). */
export const UI_VERSION_LABEL = `v${__APP_VERSION__}${import.meta.env.DEV ? '-dev' : ''}`;

/** Persisted `QuestState.currentLocation` must be one of these; others normalize to Forest on load. */
export const VALID_SAVE_LOCATIONS = new Set<string>([
  'Forest',
  'Old Well',
  'Ancient Cemetery',
  'Merchant',
  'Silver Lake',
  'Forest Cave',
  'Airship',
  'Town',
  'Village',
  'Cemetery',
  'Quarry',
  'Mine',
]);

/** Header/role display only — persisted `currentLocation` stays title-case. */
export const LOCATION_LABEL_DISPLAY: Readonly<Record<string, string>> = {
  Village: 'VILLAGE',
  Forest: 'THE FOREST',
  Merchant: 'MERCHANT',
  'Old Well': 'OLD WELL',
  'Ancient Cemetery': 'ANCIENT CEMETERY',
  Cemetery: 'CEMETERY',
  Quarry: 'QUARRY',
  Mine: 'MINE',
};

/** Post-village job slugs (Explorer granted on village arrival). */
export const JOB_SLUG_EXPLORER = 'explorer';
export const JOB_SLUG_ADVENTURER = 'adventurer';
export const JOB_SLUG_STONECUTTER = 'stonecutter';
export const JOB_SLUG_MINER = 'miner';
export const JOB_SLUG_WOODCUTTER = 'woodcutter';

export const ALL_JOB_SLUGS = [
  JOB_SLUG_EXPLORER,
  JOB_SLUG_ADVENTURER,
  JOB_SLUG_STONECUTTER,
  JOB_SLUG_MINER,
  JOB_SLUG_WOODCUTTER,
] as const;

export type JobSlug = (typeof ALL_JOB_SLUGS)[number];

/** Forest sub-location discovery flags (set by discovery quests). */
export const DISCOVERED_CEMETERY_FLAG = 'discovered-cemetery';
export const DISCOVERED_QUARRY_FLAG = 'discovered-quarry';
export const DISCOVERED_MINE_FLAG = 'discovered-mine';

export const QUEST_DISCOVER_CEMETERY_ID = 'quest-037-discover-cemetery';
export const QUEST_DISCOVER_QUARRY_ID = 'quest-038-discover-quarry';
export const QUEST_DISCOVER_MINE_ID = 'quest-039-discover-mine';

/** Canonical resource keys on `QuestState.resources`. */
export const RESOURCE_STONE = 'stone';
export const RESOURCE_IRON = 'iron';
export const RESOURCE_LOGS = 'logs';
export const RESOURCE_COPPER_ORE = 'copperOre';
export const RESOURCE_ADVENTURES = 'adventures';

export const QUEST_018_SILVER_LAKE_REFLECTION_ID = 'quest-018-silver-lake-reflection';
export const QUEST_VILLAGE_ARRIVAL_ID = 'quest-036-the-village';
export const QUEST_MAYOR_SHANNON_ID = 'quest-042-mayor-shannon';
export const QUEST_PICK_A_JOB_ID = 'quest-040-pick-a-job';
export const QUEST_MAYOR_ID = 'quest-041-mayor';

/** Jobs Hall professions (Explorer is forest-only; not choosable in village). */
export const VILLAGE_CHOOSEABLE_JOB_SLUGS = ALL_JOB_SLUGS.filter(
  (slug) => slug !== JOB_SLUG_EXPLORER
);
/** Set when the player finishes the village arrival quest; enables endgame hub UI. */
export const VILLAGE_PHASE_FLAG = 'village-phase';
/** Real-life calendar pacing (minDay, daily XP, day-roll unveil) starts when this is set. */
export const DAY_PACING_ACTIVE_FLAG = 'day-pacing-active';

export const locationActions: Record<string, string[]> = {
  Town: ['Visit the tavern', 'Visit the market'],
  Forest: ['Interact with the old well', 'Visit the abandoned cabin'],
  'Old Well': ['Interact with the old well'],
  'Silver Lake': ['Still waters', 'Light in the water'],
  'Forest Cave': [],
  Merchant: [],
  Airship: [],
  /** Placeholders for future building scenes / mechanics. */
  Village: ['North hall', 'Market row', 'Forge lane'],
  Cemetery: ['Enter the crypt'],
  Quarry: ['Work the face'],
  Mine: ['Descend the shaft'],
};

/** Play-tab location button label → quest id (Silver Lake repeatable scenes). */
export const SILVER_LAKE_SCENE_ACTION_QUEST: Record<string, string> = {
  'Still waters': 'quest-003-silver-lake',
  'Light in the water': 'quest-018-silver-lake-reflection',
};
export const HIDDEN_LOCATION_ACTIONS = new Set([
  'Interact with the old well',
  'Visit the abandoned cabin',
]);

export const characterStats = [
  ['Strength', '1'],
  ['Dexterity', '1'],
  ['Constitution', '1'],
  ['Intelligence', '1'],
  ['Wisdom', '1'],
  ['Charisma', '1'],
];

export type MobileTab = 'character' | 'chronicle' | 'play' | 'social';
