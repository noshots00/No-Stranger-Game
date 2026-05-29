Last reviewed: 2026-05-28 (full quest inventory persisted)

# Character modifiers reference

Human-maintained catalog of RPG modifier semantics. **Not** authoritative for the runtime: keys and balances live in quest definitions and [`src/components/rpg/modifiers/canonical.ts`](../../src/components/rpg/modifiers/canonical.ts). When you add `modifiersDelta` in a quest, add or update a row in the inventory below.

---

## Authoring rules (short)

**Organic suffixes** — append `Class`, `Trait`, `Skill`, `Stat`, `Blessing`, `Race`, or `Injury` to a stem (e.g. `CourageTrait`, `WarriorClass`, `AnkleInjury`). These normalize to `trait:courage`, `class:warrior`, `injury:ankle`, etc.

**Legacy / misc** — keys **without** a suffix stay **misc** unless they are one of the six primary stat labels (`Strength`, `Dexterity`, …), which fold to `stat:*` via `PRIMARY_STAT_MODIFIER_LABEL` in [`constants.ts`](../../src/components/rpg/constants.ts).

**Prefer** `StrengthStat` over bare `Strength` in new quest work.

**Race** points accumulate until Quest 18 (`assignRaceFromRaceModifiers`); after lock, new `race:*` gains are ignored.

**Display labels:** use underscores in stems for spaced titles (`Physical_AttackSkill` → “Physical Attack”). See [`formatOrganicSlugForDisplay`](../../src/components/rpg/helpers.ts).

### Allowed `*Race` and `*Class` stems

**Required for new work:** `*Race` must name a **subrace** from [`docs/RACES.md`](../../docs/RACES.md). `*Class` must be one of: `WarriorClass`, `MageClass`, `RogueClass`, `HealerClass`, `RangerClass` ([`docs/CLASSES.md`](../../docs/CLASSES.md)).

Do **not** invent ad‑hoc races or classes unless you extend those docs and [`races.ts`](../../src/components/rpg/races.ts) first.

---

## Sheet buckets and unlock thresholds

Routing: [`getModifierSheetBucket`](../../src/components/rpg/helpers.ts). Unlock: [`CharacterTab.tsx`](../../src/components/rpg/tabs/CharacterTab.tsx).

| Bucket | Storage pattern | Shows on sheet at |
|--------|-----------------|-------------------|
| **Primary stats** | `stat:strength`, … | Always in stat columns (base **1** + delta) |
| **Skills** | `skill:…` or organic `*Skill` | ≥ **1** |
| **Spells** | organic `*Spell` (storage key unchanged) | ≥ **1** (`/Spell$/` bucket rule) |
| **Injuries** | `injury:…` or `*Injury` | ≥ **1** (`INJURY_SHEET_UNLOCK_POINTS`) |
| **Traits** | `trait:…` | ≥ **5** (`CLASS_UNLOCK_POINTS`) |
| **Blessings** | `blessing:…` | ≥ **5** |
| **Class paths** | `class:…` | ≥ **5**; warrior/mage/rogue hidden from granular gain lines |
| **Misc** | no suffix | ≥ **5** (“Other modifiers”) |
| **Currency** | `currency:copper` | Coin line (from `Copper` / `Silver` / `Gold` authoring) |

**Class subtitle picker** (warrior / mage / rogue only at 5+): `HealerClass` / `RangerClass` accumulate but do not drive the three-way picker until [`getCharacterClass`](../../src/components/rpg/helpers.ts) is extended.

**Injury display:** `ankle (minor)` at magnitude 1; 2 → moderate; 3+ → severe.

---

## Suffix → canonical mapping

| Suffix | Example organic | Canonical |
|--------|-------------------|-----------|
| `Class` | `WarriorClass` | `class:warrior` |
| `Trait` | `CourageTrait` | `trait:courage` |
| `Skill` | `BashSkill` | `skill:combat:bash` (see skill table) |
| `Stat` | `StrengthStat` | `stat:strength` |
| `Blessing` | `GroundedSpiritBlessing` | `blessing:groundedspirit` |
| `Race` | `WoodElfRace` | `race:woodelf` |
| `Injury` | `AnkleInjury` | `injury:ankle` |
| (none) | `Coward`, `Leader` | unchanged (misc) |
| (legacy stat) | `Strength` | `stat:strength` |

Skill categories on sheet: `combat`, `weapon`, `magic`, `crafting`, `general` ([`SKILL_MODIFIER_CATEGORY_*`](../../src/components/rpg/constants.ts)).

---

## Inventory: Class (5)

All five archetypes appear in quests. Organic → canonical.

| Organic | Canonical | Notes |
|---------|-----------|--------|
| `WarriorClass` | `class:warrior` | Subtitle path; hidden gain line |
| `MageClass` | `class:mage` | Subtitle path; hidden gain line |
| `RogueClass` | `class:rogue` | Subtitle path; hidden gain line |
| `HealerClass` | `class:healer` | Paths section only |
| `RangerClass` | `class:ranger` | Paths section only |

---

## Inventory: Race (13)

All canon subraces from [`docs/RACES.md`](../../docs/RACES.md) are used in quest `modifiersDelta`.

| Organic | Canonical | Archetype |
|---------|-----------|-----------|
| `AtlantiansRace` | `race:atlantians` | Human |
| `SunbornRace` | `race:sunborn` | Human |
| `RiverKingdomRace` | `race:riverkingdom` | Human |
| `NightElfRace` | `race:nightelf` | Elf |
| `HighElfRace` | `race:highelf` | Elf |
| `WoodElfRace` | `race:woodelf` | Elf |
| `DwarfRace` | `race:dwarf` | Dwarf |
| `GnomeRace` | `race:gnome` | Dwarf |
| `HalflingRace` | `race:halfling` | Dwarf |
| `OrcRace` | `race:orc` | Monster |
| `TrollRace` | `race:troll` | Monster |
| `GoblinRace` | `race:goblin` | Monster |
| `CatfolkRace` | `race:catfolk` | Animal |

**Race lock (Quest 18):** highest `race:*` tally wins; engine applies +2/+1/−2 `stat:*`, auto traits, and auto misc from [`races.ts`](../../src/components/rpg/races.ts). World line: `A {Subrace} stares back from the water.`

### Auto-applied on race lock only (not in quest deltas today)

| Subrace | Auto traits | Auto misc |
|---------|-------------|-----------|
| Atlantians | `ProudTrait`, `CompetitiveTrait` | `HonorBound` |
| Sunborn | `ResilientTrait`, `SpiritualTrait` | `CommunityFocused` |
| River Kingdom | `DiplomaticTrait`, `AdaptableTrait` | `Scholarly` |
| Night Elf | `SecretiveTrait`, `VengefulTrait` | `Nocturnal` |
| High Elf | `ArrogantTrait`, `StudiousTrait` | `Longlived` |
| Wood Elf | `CautiousTrait`, `NatureLovingTrait` | `ForestDweller` |
| Dwarf | `StubbornTrait`, `HardworkingTrait` | `GrudgeBearing` |
| Gnome | `CuriousTrait`, `WittyTrait` | `Tinkerer` |
| Halfling | `CheerfulTrait`, `CautiousTrait` | `Lucky` |
| Orc | `FuriousTrait`, `CourageTrait` | `Tribal` |
| Troll | `StubbornTrait`, `BrutishTrait` | `Regenerative` |
| Goblin | `SneakyTrait`, `CowardTrait` | `Greedy` |
| Catfolk | `GracefulTrait`, `PridefulTrait` | `Nocturnal` |

---

## Inventory: Stat (six primaries)

| Canonical | Organic (preferred) | Legacy bare (still in quests) |
|-----------|---------------------|-------------------------------|
| `stat:strength` | `StrengthStat` | `Strength` |
| `stat:dexterity` | `DexterityStat` | `Dexterity` |
| `stat:constitution` | `ConstitutionStat` | `Constitution` |
| `stat:intelligence` | `IntelligenceStat` | `Intelligence` |
| `stat:wisdom` | `WisdomStat` | `Wisdom` |
| `stat:charisma` | `CharismaStat` | `Charisma` |

**Bare stats** dominate micro-forest quests (`quest-024` … `quest-035`) and the first-night boar. **`*Stat`** is used in fever/sweet dreams and some skeleton branches.

---

## Inventory: Trait (quest-authored)

| Organic | Canonical | Example quests |
|---------|-----------|----------------|
| `CautiousTrait` | `trait:cautious` | Fever, sweet, mushroom, skeleton |
| `CowardTrait` | `trait:coward` | Fever, wolf flee, skeleton |
| `CourageTrait` | `trait:courage` | Fever, wolf, sweet, skeleton |
| `FoolhardyTrait` | `trait:foolhardy` | Skeleton fight |
| `TemperanceTrait` | `trait:temperance` | Mushroom, plaguebloom, nine-oar raft, iron cage |

See **race lock** table for traits applied only when a subrace is locked.

---

## Inventory: Skill (modifier layer)

Not the same as **exploration / foraging / melee XP** on save state (see [Separate progression](#separate-progression-not-modifiers)).

| Organic | Canonical (typical) | Notes |
|---------|---------------------|--------|
| `BashSkill` | `skill:combat:bash` | |
| `Combat_AttackSkill` | `skill:combat:attack` | |
| `Critical_AttackSkill` | `skill:combat:critical_attack` | |
| `AttackSkill` | `skill:attack` | General bucket, not `combat` |
| `StealthSkill` | `skill:stealth` | |
| `SneakSkill` | `skill:sneak` | |
| `SurvivalSkill` | `skill:survival` | |
| `SwimmingSkill` | `skill:swimming` | |
| `RunningSkill` | `skill:running` | |
| `ClimbingSkill` | `skill:climbing` | |
| `ArcherySkill` | `skill:archery` | Sweet dream |
| `HerbalismSkill` | `skill:herbalism` | |
| `SpellcastingSkill` | `skill:spellcasting` | |
| `Magic_SpellcastingSkill` | `skill:magic:spellcasting` | Skeleton |
| `SparkMagicSkill` | `skill:sparkmagic` | Skeleton |
| `Survival_MycologySkill` | `skill:survival:mycology` | Mushroom patch |

---

## Inventory: Spell

Organic `*Spell` keys use the **Spells** sheet bucket at 1 pt. Storage remains the organic string (no `spell:` prefix in canonical map yet).

| Organic | Example quests |
|---------|----------------|
| `ElementalSpell` | Fever dream |
| `IllusionSpell` | Fever dream |
| `HealingSpell` | Sweet dream |
| `LightSpell` | Sweet dream |
| `SpiritSpell` | Sweet dream |
| `SparkSpell` | Wolf attack |

---

## Inventory: Blessing

| Organic | Canonical | Quest |
|---------|-----------|--------|
| `GroundedSpiritBlessing` | `blessing:groundedspirit` | Mushroom patch (sweet path) |

---

## Inventory: Injury

| Organic | Canonical | Quest / note |
|---------|-----------|--------------|
| `AnkleInjury` | `injury:ankle` | First night tree fall |
| `Maimed_ShoulderInjury` | `injury:maimed_shoulder` | Skeleton fight flee; underscore stem → spaced display |

---

## Inventory: Misc (no suffix)

Shown under **Other modifiers** at ≥ 5 pt unless noted.

### First night / boar / shelter

| Key | Source |
|-----|--------|
| `Drunk`, `Social`, `Confident`, `Leadership`, `Fighter`, `Brash`, `Rude`, `Antisocial` | Flask pockets |
| `Reckless` | Cigarettes |
| `Coward`, `FastFeet`, `SurvivalInstinct` | Boar run |
| `Dodge`, `Evasion` | Boar dodge |
| `Leader`, `Scoundrel` | Abandoned shelter |
| `Placeholder` | Cell phone stub |
| `PlaceholderDrink` | Stream drink stub |

### Dream moods

| Key | Tone |
|-----|------|
| `Haunted`, `Paranoid` | Fever (uneasy) |
| `Hopeful`, `Peaceful`, `Content`, `Serene`, `Curious` | Sweet (gentle) |

### Daily / NPC quests

| Key | Quests |
|-----|--------|
| `Resolute` | Ironwood, iron cage, plaguebloom, nine-oar raft, warlord |
| `Selfless` | Ironwood, nine-oar raft |
| `Food_LoverCharacteristic` | Mushroom patch (fever path) |

### Stubs

| Key | Note |
|-----|------|
| `Ik` | Waterfall vista — placeholder tally |

### Overlap to avoid duplicating

- **`Coward`** (misc) vs **`CowardTrait`** (trait) vs goblin lock auto **`CowardTrait`**
- **`AttackSkill`** (`skill:attack`) vs **`Combat_AttackSkill`** (`skill:combat:attack`)

---

## Currency

**Authoring keys:** `Copper`, `Silver`, `Gold` (`Coins` = copper alias).

**Conversion** (folded to `currency:copper`):

- 1 silver = 12 copper  
- 1 gold = 20 silver = 240 copper  

**Quest `modifiersDelta`:** none yet (merchant/listings use `priceCopper` separately).

---

## Quest shipment conventions

### Fever dreams — [`quest-015-fever-dream`](../../src/components/rpg/quests/quest-015-fever-dream.ts)

- **Stats:** `*Stat` preferred.
- **Traits:** `CautiousTrait`, `CowardTrait`, `CourageTrait`.
- **Misc moods:** `Haunted`, `Paranoid` (not `*Trait` for passing moods).
- **Spells:** `*Spell` + `SpellcastingSkill`.
- **Skills:** `SwimmingSkill`, `StealthSkill`, `BashSkill`, etc.
- **No new blessings** unless requested.

### Sweet dreams — [`quest-016-sweet-dream`](../../src/components/rpg/quests/quest-016-sweet-dream.ts)

Same as fever; adds `HealingSpell`, `LightSpell`, `SpiritSpell`, `ArcherySkill`, gentle misc moods.

### Micro forest beats — `quest-024` … `quest-035`

Pattern: one `*Class` + one **bare** primary stat per choice. **Migrate to `*Stat` when touching these files.**

---

## Flags (gating, not modifiers)

Quest hub / availability flags (set via `flagsSet`, checked via `requiresAnyFlags`, `disabledIfAnyFlags`).

### Global ([`constants.ts`](../../src/components/rpg/constants.ts))

`silver-lake-unlocked`, `airship-discovered`, `wolf-attack-daily-active`, `earring|bracelet|shoe|hat-daily-active`, `fever-dream-pending` / `fever-dream-unlocked`, `sweet-dream-pending` / `sweet-dream-unlocked`, `trolley|heinz|prisoner|lifeboat|sophie-daily-active`, `quest001-opened`, `discovered-cemetery|quarry|mine`, `village-phase`, `day-pacing-active`, `wolf-hides-daily-active` (tavern).

### Per-quest examples

| Flag | Quest / use |
|------|-------------|
| `quest-002-first-night-*` | Shelter, pockets, tree, water, trails, call help |
| `quest-009-waterfall-*` | Climb / behind hub |
| `abandoned-shelter-complete` | Shelter loot |
| `quest002-complete` | Boar ambush legacy |
| `quest001-complete` | Skeleton, mushroom availability |
| Origin asked how/where | Quest 1 hub |

### Availability dimensions ([`branching-quest-template.ts`](../../src/components/rpg/quests/branching-quest-template.ts))

`minDay`, `minExplorationLevel`, `minForagingLevel`, `minCharacterLevel`, `requiresAnyCompletedQuestIds`, `requiresAnyFlags`. **`minDay` is ignored until `day-pacing-active`.**

---

## Separate progression (not modifiers)

Do **not** put these in `modifiersDelta`; they live on quest/save state:

| Field | Purpose |
|-------|---------|
| `explorationXp` / `explorationLevel` | Forest exploration + Day 1 report |
| `foragingXp` / `foragingLevel` | Foraging + Day 1 report |
| `meleeAttackXp` | Melee track |
| `experience` / `characterLevel` | Character level |
| `health`, `wins`, `losses` | Combat meta |

---

## Proactive cleanup checklist

1. **Standardize primaries** — `*Stat` in new work; replace bare `Strength`, etc. when editing quests (especially `quest-024`–`035` and boar).
2. **Misc combat knobs** — decide whether `Evasion` / `Dodge` stay misc or become skills/traits.
3. **Coward family** — one convention: misc `Coward`, trait `CowardTrait`, or race auto only.
4. **Attack skills** — prefer `Combat_AttackSkill` over bare `AttackSkill` for martial choices.
5. **Injury stems** — prefer `ShoulderInjury` over `Maimed_ShoulderInjury` unless compound stems are documented.
6. **Placeholders** — grep `Placeholder`, `PlaceholderDrink`, `Ik` before shipping follow-ups.
7. **Race-lock traits** — avoid double-awarding traits the lock already grants (e.g. Wood Elf + `CautiousTrait`).
8. **Currency** — use `Copper` / `Silver` / `Gold` in `modifiersDelta` when quests grant coin.
9. **Update this file** when adding any new key to a quest.

---

## Counts (quest `modifiersDelta` inventory)

| Category | Distinct keys (approx.) |
|----------|-------------------------|
| Class | 5 |
| Race | 13 |
| Stat (12 authoring forms → 6 stats) | 12 |
| Trait (quest-authored) | 5 |
| Skill | 15 |
| Spell | 6 |
| Blessing | 1 |
| Injury | 2 |
| Misc | ~35 |
| **Total** | **~86** |

Regenerate rough counts: search `modifiersDelta` under `src/components/rpg/quests/`.
