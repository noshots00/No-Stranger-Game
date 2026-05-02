Last reviewed: 2026-05-02

# Character modifiers reference

Human-maintained catalog of RPG modifier semantics. **Not** authoritative for the runtime: keys and balances live in quest definitions and [`src/components/rpg/modifiers/canonical.ts`](../../src/components/rpg/modifiers/canonical.ts). When you add `modifiersDelta` in a quest, add or update a bullet here so future-you (and collaborators) remember intent.

## Allowed `*Race` and `*Class` stems

**Required for new work:** organic **`Race`** stems must name a **subrace** from [`docs/RACES.md`](../../docs/RACES.md) (the thirteen entries under Human, Elf, Dwarf, Monster, and Animal). **`Class`** stems must name one of the five **archetypes:** `WarriorClass`, `MageClass`, `RogueClass`, `HealerClass`, `RangerClass`—matching [`docs/CLASSES.md`](../../docs/CLASSES.md) archetypes (specializations like Knight or Elementalist are narrative only; do not use them as modifier keys).

Examples: `WoodElfRace`, `RiverKingdomRace`, `WarriorClass`, `MageClass`, `RangerClass`.

Do **not** invent ad‑hoc races or classes (e.g. `SporebornRace`, `ScoutClass`) unless you first extend [`docs/RACES.md`](../../docs/RACES.md) / [`docs/CLASSES.md`](../../docs/CLASSES.md). Older quests may still carry legacy keys until migrated.

---

**Organic authoring:** append a suffix to the stem — `Class`, `Trait`, `Skill`, `Stat`, `Blessing`, or `Race` (e.g. `CourageTrait`, `WarriorClass`, `ElfRace`). Those normalize to canonical keys (`trait:courage`, `class:warrior`, `race:elf`). Legacy keys without a suffix stay **Misc**. **Race** points accumulate in modifiers until a quest effect locks your display race (see `assignRaceFromRaceModifiers` in the quest engine); after lock, new `race:*` modifier gains are ignored.

**Display labels:** stems lower-case into slugs; use **underscores or hyphens** in the stem for spaced titles (e.g. `Physical_AttackSkill` → “Physical Attack”). See [`formatOrganicSlugForDisplay`](../../src/components/rpg/helpers.ts).

**Maintenance:** prefer listing **canonical ids** in backticks for uniqueness. Update this file when you ship new modifiers.

---

### Class

**Canon:** five archetypes in [`docs/CLASSES.md`](../../docs/CLASSES.md): Warrior, Mage, Rogue, Healer, Ranger. Quest `modifiersDelta` uses organic keys `WarriorClass`, `MageClass`, `RogueClass`, `HealerClass`, `RangerClass` only.

Core paths tracked for the subtitle class picker; `class:warrior`, `class:mage`, and `class:rogue` are hidden on the sheet but still accumulate.

- **`Warrior`** (`class:warrior`, organic `WarriorClass`) — martial focus; advances the Warrior path.
- **`Mage`** (`class:mage`, organic `MageClass`) — arcane focus; advances the Mage path.
- **`Rogue`** (`class:rogue`, organic `RogueClass`) — stealth or agility focus; advances the Rogue path.

`HealerClass` / `RangerClass` appear under Paths when present; they do not drive the three-way subtitle picker until extended in [`getCharacterClass`](../../src/components/rpg/helpers.ts).

Specialization names (Knight, Cleric, …) remain documentation-only unless you explicitly extend modifier rules.

---

### Trait

Persistent personality or narrative skews; shown under Traits on the character sheet.

*Add entries as you design modifiers.*

---

### Skill

Named techniques or combat abilities (modifier layer — not the exploration/foraging XP skills).

*Add entries as you design modifiers.*

---

### Stat

The six primary attributes use canonical `stat:*` slugs (`strength`, `dexterity`, …). Organic `StrengthStat` maps to `stat:strength`; legacy plain `Strength` migrates the same way.

- **`Strength`** (`stat:strength`, organic `StrengthStat` or legacy `Strength`)
- **`Dexterity`** (`stat:dexterity`, organic `DexterityStat` or legacy `Dexterity`)
- **`Constitution`** (`stat:constitution`, organic `ConstitutionStat` or legacy `Constitution`)
- **`Intelligence`** (`stat:intelligence`, organic `IntelligenceStat` or legacy `Intelligence`)
- **`Wisdom`** (`stat:wisdom`, organic `WisdomStat` or legacy `Wisdom`)
- **`Charisma`** (`stat:charisma`, organic `CharismaStat` or legacy `Charisma`)

*Add custom stats under Stat if you introduce non-primary `*Stat` keys.*

---

### Race

**Canon:** subraces in [`docs/RACES.md`](../../docs/RACES.md) only. Slug shape is **concatenated lowercase** — organic `WoodElfRace` → `race:woodelf`, `RiverKingdomRace` → `race:riverkingdom` (do **not** use `River_KingdomRace`; the engine rewrites the legacy slug for any persisted state via `LEGACY_RACE_SLUG_REWRITES` in [`races.ts`](../../src/components/rpg/races.ts)).

When a quest effect with `assignRaceFromRaceModifiers: true` fires (Quest 18 → "Lean forward"), the engine picks the highest `race:*` tally (deterministic tie-break) and **automatically** merges the row from [`races.ts`](../../src/components/rpg/races.ts):

- One-shot `stat:*` deltas: **+2 / +1 / -2** (net +1 per race; no floor).
- Auto-applied `*Trait` keys (e.g. `ProudTrait`).
- Auto-applied misc characteristic keys (e.g. `HonorBound`).
- One neutral world-log line: `A {Subrace} stares back from the water.`

The Character tab subtitle then reads `Level N {Emoji} {DisplayName} {Class}` instead of `Level N Unknown {Class}`.

*Add new subraces to [`docs/RACES.md`](../../docs/RACES.md) **and** [`races.ts`](../../src/components/rpg/races.ts) before using new `*Race` keys in quests.*

---

### Blessing

Divine or narrative boons; also listed on the Blessings line when present.

*Add entries as you design modifiers.*

---

### Quest shipment: fever dreams

[`quest-015-fever-dream`](../../src/components/rpg/quests/quest-015-fever-dream.ts)

- **Stats:** primary stats via organic `*Stat` — `ConstitutionStat`, `WisdomStat`, `IntelligenceStat`, `DexterityStat`, `StrengthStat` (prefer these over legacy bare `Strength`, …).
- **Traits:** everyday personality skews only — `CautiousTrait`, `CowardTrait`, `CourageTrait` (avoid uncommon adjectives like `DreadfulTrait`).
- **Characteristics (misc):** narrative descriptors without an organic suffix — e.g. uneasy sleep: `Haunted`, `Paranoid`; gentle sleep: `Hopeful`, `Peaceful`, `Content`, `Serene`, `Curious` — **not** `*Trait` if it reads like a passing mood rather than stable personality.
- **Spells:** spell names use a `Spell` stem ending in …Spell (same pattern as `SparkSpell`, `ElementalSpell`, `IllusionSpell`) — keys stay **misc** until/unless `Spell` is added to canonical routing.
- **Spellcasting:** use **`SpellcastingSkill`** for the general casting skill layer (not `Magic_ElementalSkill`-style labels).
- **Skills:** prefer plain stems already used in quests — `SwimmingSkill`, `StealthSkill`, `BashSkill`, etc.; avoid ornate `Category_FancySkill` unless needed.
- **Blessings:** do **not** add new blessing modifiers for fever-dream style content unless explicitly requested.

### Quest shipment: sweet dreams

[`quest-016-sweet-dream`](../../src/components/rpg/quests/quest-016-sweet-dream.ts)

Same conventions as fever dreams: `*Stat`, simple `*Trait`, misc characteristics, `*Spell` + `SpellcastingSkill` where applicable, plain `*Skill`, no new blessings. Introduces `HealingSpell`, `LightSpell`, `SpiritSpell`, and `ArcherySkill` alongside existing keys.

---

### Misc

Modifiers **without** an organic suffix (e.g. `Coward`, `Leader`) or anything that does not map to `class:|trait:|skill:|stat:|blessing:`.

*Add entries as you design modifiers.*
