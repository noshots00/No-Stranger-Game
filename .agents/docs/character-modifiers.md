Last reviewed: —

# Character modifiers reference

Human-maintained catalog of RPG modifier semantics. **Not** authoritative for the runtime: keys and balances live in quest definitions and [`src/components/rpg/modifiers/canonical.ts`](../../src/components/rpg/modifiers/canonical.ts). When you add `modifiersDelta` in a quest, add or update a bullet here so future-you (and collaborators) remember intent.

**Organic authoring:** append a suffix to the stem — `Class`, `Trait`, `Skill`, `Stat`, `Blessing`, or `Race` (e.g. `CourageTrait`, `WarriorClass`, `ElfRace`). Those normalize to canonical keys (`trait:courage`, `class:warrior`, `race:elf`). Legacy keys without a suffix stay **Misc**. **Race** points accumulate in modifiers until a quest effect locks your display race (see `assignRaceFromRaceModifiers` in the quest engine); after lock, new `race:*` modifier gains are ignored.

**Display labels:** stems lower-case into slugs; use **underscores or hyphens** in the stem for spaced titles (e.g. `Physical_AttackSkill` → “Physical Attack”). See [`formatOrganicSlugForDisplay`](../../src/components/rpg/helpers.ts).

**Maintenance:** prefer listing **canonical ids** in backticks for uniqueness. Update this file when you ship new modifiers.

---

### Class

Core paths tracked for the subtitle class picker; `class:warrior`, `class:mage`, and `class:rogue` are hidden on the sheet but still accumulate.

- **`Warrior`** (`class:warrior`, organic `WarriorClass`) — martial focus; advances the Warrior path.
- **`Mage`** (`class:mage`, organic `MageClass`) — arcane focus; advances the Mage path.
- **`Rogue`** (`class:rogue`, organic `RogueClass`) — stealth or agility focus; advances the Rogue path.

*Add entries as you design modifiers (e.g. `PaladinClass` → `class:paladin`).*

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

Fantasy ancestries; organic `ElfRace` → `race:elf`. The **character sheet “Race” line** shows the **locked** slug set when a quest runs race assignment (highest `race:*` tally; deterministic tie-break). Until then, list candidate flavors here as you add quests.

*Add entries as you design modifiers (e.g. Dwarf, Ogre).*

---

### Blessing

Divine or narrative boons; also listed on the Blessings line when present.

*Add entries as you design modifiers.*

---

### Misc

Modifiers **without** an organic suffix (e.g. `Coward`, `Leader`) or anything that does not map to `class:|trait:|skill:|stat:|blessing:`.

*Add entries as you design modifiers.*
