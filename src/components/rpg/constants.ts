/** Set by Vite from `package.json` `version` — canonical in-app display version (see `vite.config.ts`). */
declare const __APP_VERSION__: string;

export const INTRO_DEV_MESSAGE = `Welcome to No Stranger Game! Your character is autonomous! He will act according to his own needs and desires. The primary means of progressing the game is by completing quests. Every choice has a permanent and irrevocable impact on the trajectory of your character, tread CAREFULLY! The game is designed to take about three minutes of your time each day. Be patient... it may seem like nothing is happening... but the game is MASSIVE and changes take place over Days, not seconds. For now your character will explore the forest around him, seeking food and shelter. Soon he will discover a village, which will unlock the next part of the Main Quest. The forest is very large, and your character may discover other locales before the village, and it could take longer than you are anticipating. I recommend you take a few minutes to look around the game, and then check your character's progress tomorrow.

If you have any questions please reach out to me on Nostr.

Thank you for playing!`;

export const SILVER_LAKE_FLAG = 'silver-lake-unlocked';
export const AIRSHIP_FLAG = 'airship-discovered';
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
export const QUEST_STATE_STORAGE_KEY = 'nsg:facsimile-quest-state';
export const CHARACTER_START_TS_STORAGE_KEY = 'nsg:character-start-timestamp';
export const DEV_DAY_OFFSET_STORAGE_KEY = 'nsg:dev-day-offset-ms';
/** When enabled in the game menu, advances in-game time by one day every 2s (dev only). */
export const DEV_RAPID_DAY_SIM_STORAGE_KEY = 'nsg:dev-rapid-day-simulation';
/** When enabled in the game menu, shows quest modifier breakdown on the Character tab. */
export const DEV_SHOW_MODIFIER_DETAILS_STORAGE_KEY = 'nsg:dev-show-modifier-details';
/** When enabled, Quests tab lists every quest for testing (dev only). */
export const DEV_UNLOCK_ALL_QUESTS_STORAGE_KEY = 'nsg:dev-unlock-all-quests';
export const DEV_RAPID_DAY_SIM_INTERVAL_MS = 2000;
export const DAY_IN_MS = 24 * 60 * 60 * 1000;
export const DAILY_XP = 1440;
export const NPC_AVATAR_URL = 'https://api.dicebear.com/8.x/adventurer/svg?seed=Elira';
export const CLASS_UNLOCK_POINTS = 5;
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
/** Legacy keys + canonical class keys for the three base paths (hidden from generic modifier lists). */
export const HIDDEN_CLASS_MODIFIER_KEYS = [
  'WarriorClass',
  'MageClass',
  'RogueClass',
  'class:warrior',
  'class:mage',
  'class:rogue',
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
export const PLAY_WORLD_RECENT_MAX = 40;
export const DIALOGUE_SCROLL_PIN_EPS = 80;
export const DIALOGUE_BREATHE_OVERFLOW_RATIO = 1.3;
/** Shown in the game header; always reflects `package.json` `version` (no second source of truth). */
export const UI_VERSION_LABEL = `v${__APP_VERSION__}${import.meta.env.DEV ? '-dev' : ''}`;

export const locationActions: Record<string, string[]> = {
  Town: ['Visit the tavern', 'Visit the market'],
  Forest: ['Interact with the old well', 'Visit the abandoned cabin'],
  'Silver Lake': ['Still waters', 'Light in the water'],
  Airship: [],
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

export type MobileTab = 'character' | 'quests' | 'play' | 'map' | 'social';
