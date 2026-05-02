# Modifiers

The full library of non-class, non-race, non-skill modifiers that make a character distinct.

The **authoring rules** (organic key naming, canonicalization, etc.) live at [.agents/docs/character-modifiers.md](../../.agents/docs/character-modifiers.md). Don't duplicate them here — extend with narrative.

## Categories

### Stats

The familiar core attributes: Strength, Constitution, Dexterity, Intelligence, Wisdom, Charisma.

- Quest authoring: write `Strength: 1` etc. in `effects.modifiersDelta`; canonicalized to `stat:strength`.
- Race-locking applies one-shot stat deltas (`bonusPlus2`, `bonusPlus1`, `weaknessMinus2`).

### Traits

Personality traits the player demonstrated through choices. Examples in code: `CautiousTrait`, `TemperanceTrait`.

_TBD — Cliff to author the full library._

### Characteristics

Identifiable, often physical or mannerism characteristics. Examples in code: `Food_LoverCharacteristic`.

_TBD — Cliff to author._

### Blessings

Earned or granted spiritual favors. Examples in code: `GroundedSpiritBlessing`.

_TBD — Cliff to author._

### Other modifier surfaces

- Coward, FastFeet, SurvivalInstinct, etc. — situational tags from quest choices.
- _Cliff to formalize categories over time._

## Cross-links

- Authoring rules: [.agents/docs/character-modifiers.md](../../.agents/docs/character-modifiers.md)
- Canonicalization: [src/components/rpg/modifiers/canonical.ts](../../src/components/rpg/modifiers/canonical.ts)
- Race effects: [src/components/rpg/races.ts](../../src/components/rpg/races.ts)
