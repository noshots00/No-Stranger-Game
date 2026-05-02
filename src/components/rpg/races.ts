/**
 * Race table — single source of truth for the 13 subraces from docs/RACES.md.
 *
 * Each row drives:
 *   - Quest 18 race lock (engine reads bonusPlus2/bonusPlus1/weaknessMinus2 and applies them as
 *     one-shot stat:* deltas, plus auto-applied trait/characteristic keys, when assignRaceFromRaceModifiers fires)
 *   - Character tab subtitle (displayName + symbolEmoji)
 *
 * Slug shape: concatenated, lowercased; e.g. `wood elf` -> `woodelf`. The organic
 * key in quests is therefore `WoodElfRace` -> canonical `race:woodelf`.
 */

export type RaceArchetype = 'human' | 'elf' | 'dwarf' | 'monster' | 'animal';

export type PrimaryStatKey =
  | 'strength'
  | 'dexterity'
  | 'constitution'
  | 'intelligence'
  | 'wisdom'
  | 'charisma';

export type RaceDefinition = {
  /** Canonical slug stored as `race:<slug>` and on `assignedRaceSlug`. */
  slug: string;
  archetype: RaceArchetype;
  /** Human-readable race name (TitleCase, may include spaces). */
  displayName: string;
  /** Emoji rendered alongside the race name on the Character tab. */
  symbolEmoji: string;
  /** Plain-text symbol from the race guide (kept for docs / tooltips). */
  symbolLabel: string;
  /** +2 stat key applied as a one-shot canonical `stat:*` delta on lock. */
  bonusPlus2: PrimaryStatKey;
  /** +1 stat key applied as a one-shot canonical `stat:*` delta on lock. */
  bonusPlus1: PrimaryStatKey;
  /** -2 weakness stat key applied as a one-shot canonical `stat:*` delta on lock. */
  weaknessMinus2: PrimaryStatKey;
  /** Organic *Trait keys auto-merged on lock (e.g. `ProudTrait` -> `trait:proud`). */
  autoTraits: string[];
  /** Misc keys (no organic suffix) auto-merged on lock; surface under "Other modifiers". */
  autoCharacteristics: string[];
};

export const RACES: Record<string, RaceDefinition> = {
  atlantians: {
    slug: 'atlantians',
    archetype: 'human',
    displayName: 'Atlantians',
    symbolEmoji: '🔱',
    symbolLabel: 'Trident',
    bonusPlus2: 'strength',
    bonusPlus1: 'charisma',
    weaknessMinus2: 'intelligence',
    autoTraits: ['ProudTrait', 'CompetitiveTrait'],
    autoCharacteristics: ['HonorBound'],
  },
  sunborn: {
    slug: 'sunborn',
    archetype: 'human',
    displayName: 'Sunborn',
    symbolEmoji: '☀️',
    symbolLabel: 'Sun Disk',
    bonusPlus2: 'constitution',
    bonusPlus1: 'wisdom',
    weaknessMinus2: 'dexterity',
    autoTraits: ['ResilientTrait', 'SpiritualTrait'],
    autoCharacteristics: ['CommunityFocused'],
  },
  riverkingdom: {
    slug: 'riverkingdom',
    archetype: 'human',
    displayName: 'River Kingdom',
    symbolEmoji: '🪷',
    symbolLabel: 'Lotus Flower',
    bonusPlus2: 'intelligence',
    bonusPlus1: 'dexterity',
    weaknessMinus2: 'strength',
    autoTraits: ['DiplomaticTrait', 'AdaptableTrait'],
    autoCharacteristics: ['Scholarly'],
  },
  nightelf: {
    slug: 'nightelf',
    archetype: 'elf',
    displayName: 'Night Elf',
    symbolEmoji: '🌙',
    symbolLabel: 'Crescent Moon',
    bonusPlus2: 'dexterity',
    bonusPlus1: 'intelligence',
    weaknessMinus2: 'charisma',
    autoTraits: ['SecretiveTrait', 'VengefulTrait'],
    autoCharacteristics: ['Nocturnal'],
  },
  highelf: {
    slug: 'highelf',
    archetype: 'elf',
    displayName: 'High Elf',
    symbolEmoji: '✨',
    symbolLabel: 'Star Crystal',
    bonusPlus2: 'intelligence',
    bonusPlus1: 'charisma',
    weaknessMinus2: 'constitution',
    autoTraits: ['ArrogantTrait', 'StudiousTrait'],
    autoCharacteristics: ['Longlived'],
  },
  woodelf: {
    slug: 'woodelf',
    archetype: 'elf',
    displayName: 'Wood Elf',
    symbolEmoji: '🏹',
    symbolLabel: 'Leaf Arrow',
    bonusPlus2: 'dexterity',
    bonusPlus1: 'wisdom',
    weaknessMinus2: 'charisma',
    autoTraits: ['CautiousTrait', 'NatureLovingTrait'],
    autoCharacteristics: ['ForestDweller'],
  },
  dwarf: {
    slug: 'dwarf',
    archetype: 'dwarf',
    displayName: 'Dwarf',
    symbolEmoji: '🔨',
    symbolLabel: 'Steel Hammer',
    bonusPlus2: 'constitution',
    bonusPlus1: 'strength',
    weaknessMinus2: 'charisma',
    autoTraits: ['StubbornTrait', 'HardworkingTrait'],
    autoCharacteristics: ['GrudgeBearing'],
  },
  gnome: {
    slug: 'gnome',
    archetype: 'dwarf',
    displayName: 'Gnome',
    symbolEmoji: '⚙️',
    symbolLabel: 'Spinning Gear',
    bonusPlus2: 'intelligence',
    bonusPlus1: 'dexterity',
    weaknessMinus2: 'strength',
    autoTraits: ['CuriousTrait', 'WittyTrait'],
    autoCharacteristics: ['Tinkerer'],
  },
  halfling: {
    slug: 'halfling',
    archetype: 'dwarf',
    displayName: 'Halfling',
    symbolEmoji: '🪈',
    symbolLabel: 'Hollow Pipe',
    bonusPlus2: 'dexterity',
    bonusPlus1: 'charisma',
    weaknessMinus2: 'strength',
    autoTraits: ['CheerfulTrait', 'CautiousTrait'],
    autoCharacteristics: ['Lucky'],
  },
  orc: {
    slug: 'orc',
    archetype: 'monster',
    displayName: 'Orc',
    symbolEmoji: '💀',
    symbolLabel: 'Tusked Skull',
    bonusPlus2: 'strength',
    bonusPlus1: 'constitution',
    weaknessMinus2: 'intelligence',
    autoTraits: ['FuriousTrait', 'CourageTrait'],
    autoCharacteristics: ['Tribal'],
  },
  troll: {
    slug: 'troll',
    archetype: 'monster',
    displayName: 'Troll',
    symbolEmoji: '🦴',
    symbolLabel: 'Severed Arm',
    bonusPlus2: 'constitution',
    bonusPlus1: 'strength',
    weaknessMinus2: 'intelligence',
    autoTraits: ['StubbornTrait', 'BrutishTrait'],
    autoCharacteristics: ['Regenerative'],
  },
  goblin: {
    slug: 'goblin',
    archetype: 'monster',
    displayName: 'Goblin',
    symbolEmoji: '🔘',
    symbolLabel: 'Shiny Button',
    bonusPlus2: 'dexterity',
    bonusPlus1: 'intelligence',
    weaknessMinus2: 'constitution',
    autoTraits: ['SneakyTrait', 'CowardTrait'],
    autoCharacteristics: ['Greedy'],
  },
  catfolk: {
    slug: 'catfolk',
    archetype: 'animal',
    displayName: 'Catfolk',
    symbolEmoji: '🐾',
    symbolLabel: 'Golden Claw',
    bonusPlus2: 'dexterity',
    bonusPlus1: 'charisma',
    weaknessMinus2: 'strength',
    autoTraits: ['GracefulTrait', 'PridefulTrait'],
    autoCharacteristics: ['Nocturnal'],
  },
};

/**
 * Legacy `race:*` slugs that earlier quest content produced before the slug
 * shape settled on concatenated lowercase. The engine rolls these forward when
 * normalizing persisted state and when migrating modifier maps.
 */
export const LEGACY_RACE_SLUG_REWRITES: Record<string, string> = {
  river_kingdom: 'riverkingdom',
};

/** Lookup helper used by engine + UI; tolerant of `null` for un-locked state. */
export const getRaceDefinition = (slug: string | null | undefined): RaceDefinition | null => {
  if (!slug) return null;
  const rewrite = LEGACY_RACE_SLUG_REWRITES[slug] ?? slug;
  return RACES[rewrite] ?? null;
};
