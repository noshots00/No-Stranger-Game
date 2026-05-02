Last reviewed: 2026-05-02

# Character modifiers reference

Human-maintained catalog of RPG modifier semantics. **Not** authoritative for the runtime: keys and balances live in quest definitions and [`src/components/rpg/modifiers/canonical.ts`](../../src/components/rpg/modifiers/canonical.ts). When you add `modifiersDelta` in a quest, add or update a bullet here so future-you (and collaborators) remember intent.

## Allowed `*Race` and `*Class` stems

**Required for new work:** organic **`Race`** stems must name a **subrace** from [`docs/RACES.md`](../../docs/RACES.md) (the thirteen entries under Human, Elf, Dwarf, Monster, and Animal). **`Class`** stems must name a **specialization** from [`docs/CLASSES.md`](../../docs/CLASSES.md), **or**—when the quest should advance the three subtitle paths—the core trio `WarriorClass`, `MageClass`, `RogueClass` used by [`getCharacterClass`](../../src/components/rpg/helpers.ts).

Examples: `WoodElfRace`, `River_KingdomRace`, `KnightClass`, `EnchanterClass`, `MageClass`.

Do **not** invent ad‑hoc races or classes (e.g. `SporebornRace`, `ScoutClass`) unless you first extend [`docs/RACES.md`](../../docs/RACES.md) / [`docs/CLASSES.md`](../../docs/CLASSES.md). Older quests may still carry legacy keys until migrated.

---

**Organic authoring:** append a suffix to the stem — `Class`, `Trait`, `Skill`, `Stat`, `Blessing`, or `Race` (e.g. `CourageTrait`, `WarriorClass`, `ElfRace`). Those normalize to canonical keys (`trait:courage`, `class:warrior`, `race:elf`). Legacy keys without a suffix stay **Misc**. **Race** points accumulate in modifiers until a quest effect locks your display race (see `assignRaceFromRaceModifiers` in the quest engine); after lock, new `race:*` modifier gains are ignored.

**Display labels:** stems lower-case into slugs; use **underscores or hyphens** in the stem for spaced titles (e.g. `Physical_AttackSkill` → “Physical Attack”). See [`formatOrganicSlugForDisplay`](../../src/components/rpg/helpers.ts).

**Maintenance:** prefer listing **canonical ids** in backticks for uniqueness. Update this file when you ship new modifiers.

---

### Class

**Canon:** specializations in [`docs/CLASSES.md`](../../docs/CLASSES.md) (Knight, Duelist, Elementalist, …). Prefer organic keys like `KnightClass`, `ElementalistClass` for narrative class flavor.

Core paths tracked for the subtitle class picker; `class:warrior`, `class:mage`, and `class:rogue` are hidden on the sheet but still accumulate.

- **`Warrior`** (`class:warrior`, organic `WarriorClass`) — martial focus; advances the Warrior path.
- **`Mage`** (`class:mage`, organic `MageClass`) — arcane focus; advances the Mage path.
- **`Rogue`** (`class:rogue`, organic `RogueClass`) — stealth or agility focus; advances the Rogue path.

New specialization modifiers must match [`docs/CLASSES.md`](../../docs/CLASSES.md); update that doc if you add a specialization.

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

**Canon:** subraces in [`docs/RACES.md`](../../docs/RACES.md) only. Organic `WoodElfRace` → `race:woodelf`. The **character sheet “Race” line** shows the **locked** slug set when a quest runs race assignment (highest `race:*` tally; deterministic tie-break). Until then, list candidate flavors here as you add quests.

*Add new subraces to [`docs/RACES.md`](../../docs/RACES.md) before using new `*Race` keys in quests.*

---

### Blessing

Divine or narrative boons; also listed on the Blessings line when present.

*Add entries as you design modifiers.*

---

### Quest shipment: fever dreams

[`quest-015-fever-dream`](../../src/components/rpg/quests/quest-015-fever-dream.ts)

- **Stats:** primary stats via organic `*Stat` — `ConstitutionStat`, `WisdomStat`, `IntelligenceStat`, `DexterityStat`, `StrengthStat` (prefer these over legacy bare `Strength`, …).
- **Traits:** everyday personality skews only — `CautiousTrait`, `CowardTrait`, `CourageTrait` (avoid uncommon adjectives like `DreadfulTrait`).
- **Characteristics (misc):** narrative descriptors without an organic suffix — `Haunted`, `Paranoid` — **not** `*Trait` if it reads like a mood or diagnosis rather than stable personality.
- **Spells:** spell names use a `Spell` stem ending in …Spell (same pattern as `SparkSpell`, `ElementalSpell`, `IllusionSpell`) — keys stay **misc** until/unless `Spell` is added to canonical routing.
- **Spellcasting:** use **`SpellcastingSkill`** for the general casting skill layer (not `Magic_ElementalSkill`-style labels).
- **Skills:** prefer plain stems already used in quests — `SwimmingSkill`, `StealthSkill`, `BashSkill`, etc.; avoid ornate `Category_FancySkill` unless needed.
- **Blessings:** do **not** add new blessing modifiers for fever-dream style content unless explicitly requested.

---

### Misc

Modifiers **without** an organic suffix (e.g. `Coward`, `Leader`) or anything that does not map to `class:|trait:|skill:|stat:|blessing:`.

*Add entries as you design modifiers.*
