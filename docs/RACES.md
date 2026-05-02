# Playable races (design reference)

**Archetypes (5):** Human, Elf, Dwarf, Monster, Animal. Each has **subraces** with ability bonuses, cultural notes, and a symbol.

This list is for narrative and content planning. Runtime race modifiers use organic keys like `WoodElfRace` → `race:woodelf` (see [character modifiers](../.agents/docs/character-modifiers.md)). Primary stats in app code are Strength, **Dexterity**, Constitution, Intelligence, Wisdom, Charisma — **AGI** in the table means Dexterity.

Last reviewed: 2026-05-02

---

## Human

Subraces: Atlantians, Sunborn, River Kingdom.

### Atlantians

- **Bonuses:** +2 STR, +1 CHA
- **Characteristics:** Proud seafarers, competitive, honor-bound, value physical prowess and leadership.
- **Symbol:** Trident

### Sunborn

- **Bonuses:** +2 CON, +1 WIS
- **Characteristics:** Dark-skinned desert dwellers, resilient, spiritual, community-focused, wise elders.
- **Symbol:** Sun Disk

### River Kingdom

- **Bonuses:** +2 INT, +1 AGI (Dexterity)
- **Characteristics:** Civilized traders and scribes, adaptable, diplomatic, value knowledge and precision.
- **Symbol:** Lotus Flower

---

## Elf

Subraces: Night Elf, High Elf, Wood Elf.

### Night Elf

- **Bonuses:** +2 AGI (Dexterity), +1 INT
- **Characteristics:** Nocturnal, secretive, druidic, vengeful, attuned to shadows and moons.
- **Symbol:** Crescent Moon

### High Elf

- **Bonuses:** +2 INT, +1 CHA
- **Characteristics:** Arrogant, magically gifted, long-lived urbanites, pursue arcane perfection.
- **Symbol:** Star Crystal

### Wood Elf

- **Bonuses:** +2 AGI (Dexterity), +1 WIS
- **Characteristics:** Forest-dwellers, nature-loving, fleet-footed, distrustful of cities, skilled hunters.
- **Symbol:** Leaf Arrow

---

## Dwarf

Subraces: Dwarf, Gnome, Halfling.

### Dwarf

- **Bonuses:** +2 CON, +1 STR
- **Characteristics:** Stubborn, hardworking, master smiths, treasure-hoarders, grudge-bearing.
- **Symbol:** Steel Hammer

### Gnome

- **Bonuses:** +2 INT, +1 AGI (Dexterity)
- **Characteristics:** Curious tinkerers, illusionists, witty, love gems and mechanical contraptions.
- **Symbol:** Spinning Gear

### Halfling

- **Bonuses:** +2 AGI (Dexterity), +1 CHA
- **Characteristics:** Cheerful, lucky, comfort-loving, stealthy, fond of good food and gossip.
- **Symbol:** Hollow Pipe

---

## Monster

Subraces: Orc, Troll, Goblin.

### Orc

- **Bonuses:** +2 STR, +1 CON
- **Characteristics:** Tribal warriors, berserkers, honor-through-battle, scarred, shamanistic.
- **Symbol:** Tusked Skull

### Troll

- **Bonuses:** +2 CON, +1 STR
- **Characteristics:** Lumbering, regenerative, dim-witted, cave-dwelling, vulnerable to fire.
- **Symbol:** Severed Arm

### Goblin

- **Bonuses:** +2 AGI (Dexterity), +1 INT
- **Characteristics:** Sneaky, cowardly, inventive, greedy, breed quickly, love traps and explosives.
- **Symbol:** Shiny Button

---

## Animal

### Catfolk

- **Bonuses:** +2 AGI (Dexterity), +1 CHA
- **Characteristics:** Curious, graceful, prideful, nocturnal hunters, aloof but loyal.
- **Symbol:** Golden Claw

---

## Summary

| Archetype | Subraces | Count |
| --------- | -------- | ----- |
| Human | Atlantians, Sunborn, River Kingdom | 3 |
| Elf | Night Elf, High Elf, Wood Elf | 3 |
| Dwarf | Dwarf, Gnome, Halfling | 3 |
| Monster | Orc, Troll, Goblin | 3 |
| Animal | Catfolk | 1 |
| **Total** | | **13** |

When adding quests or `race:*` modifiers, align names with this sheet where possible so pool ties and dominant-race logic stay readable.

---

## Slugs, emoji, and lock-time deltas

When the engine locks a race (Quest 18 → Lean forward, via `assignRaceFromRaceModifiers`), it reads the table in [`src/components/rpg/races.ts`](../src/components/rpg/races.ts) and merges the deltas below as one-shot canonical modifiers. **Net per race: +1 stat point** (+2 + +1 - 2). Application is silent except for one neutral world-log line: `A {Subrace} stares back from the water.`

| Subrace | Slug | Organic key | Emoji | Symbol | +2 | +1 | -2 | Auto traits | Auto characteristics |
| ------- | ---- | ----------- | ----- | ------ | -- | -- | -- | ----------- | -------------------- |
| Atlantians | `race:atlantians` | `AtlantiansRace` | 🔱 | Trident | STR | CHA | INT | `ProudTrait`, `CompetitiveTrait` | `HonorBound` |
| Sunborn | `race:sunborn` | `SunbornRace` | ☀️ | Sun Disk | CON | WIS | DEX | `ResilientTrait`, `SpiritualTrait` | `CommunityFocused` |
| River Kingdom | `race:riverkingdom` | `RiverKingdomRace` | 🪷 | Lotus Flower | INT | DEX | STR | `DiplomaticTrait`, `AdaptableTrait` | `Scholarly` |
| Night Elf | `race:nightelf` | `NightElfRace` | 🌙 | Crescent Moon | DEX | INT | CHA | `SecretiveTrait`, `VengefulTrait` | `Nocturnal` |
| High Elf | `race:highelf` | `HighElfRace` | ✨ | Star Crystal | INT | CHA | CON | `ArrogantTrait`, `StudiousTrait` | `Longlived` |
| Wood Elf | `race:woodelf` | `WoodElfRace` | 🏹 | Leaf Arrow | DEX | WIS | CHA | `CautiousTrait`, `NatureLovingTrait` | `ForestDweller` |
| Dwarf | `race:dwarf` | `DwarfRace` | 🔨 | Steel Hammer | CON | STR | CHA | `StubbornTrait`, `HardworkingTrait` | `GrudgeBearing` |
| Gnome | `race:gnome` | `GnomeRace` | ⚙️ | Spinning Gear | INT | DEX | STR | `CuriousTrait`, `WittyTrait` | `Tinkerer` |
| Halfling | `race:halfling` | `HalflingRace` | 🪈 | Hollow Pipe | DEX | CHA | STR | `CheerfulTrait`, `CautiousTrait` | `Lucky` |
| Orc | `race:orc` | `OrcRace` | 💀 | Tusked Skull | STR | CON | INT | `FuriousTrait`, `CourageTrait` | `Tribal` |
| Troll | `race:troll` | `TrollRace` | 🦴 | Severed Arm | CON | STR | INT | `StubbornTrait`, `BrutishTrait` | `Regenerative` |
| Goblin | `race:goblin` | `GoblinRace` | 🔘 | Shiny Button | DEX | INT | CON | `SneakyTrait`, `CowardTrait` | `Greedy` |
| Catfolk | `race:catfolk` | `CatfolkRace` | 🐾 | Golden Claw | DEX | CHA | STR | `GracefulTrait`, `PridefulTrait` | `Nocturnal` |

**Slug shape:** concatenated lowercase. Multi-word stems must concat (e.g. `RiverKingdomRace`, **not** `River_KingdomRace`). The engine rewrites the legacy `race:river_kingdom` slug into `race:riverkingdom` automatically (see `LEGACY_RACE_SLUG_REWRITES` in [`races.ts`](../src/components/rpg/races.ts)).

**Subtitle:** once locked, the Character tab subtitle changes from `Level N Unknown {Class}` to `Level N {Emoji} {DisplayName} {Class}`.
