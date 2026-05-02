# Classes (design)

Narrative and philosophy of the five class archetypes in No Stranger Game.

The **canonical machine-readable list** of class archetypes lives at [docs/CLASSES.md](../CLASSES.md) and is referenced by `AGENTS.md` and `.agents/docs/character-modifiers.md`. Don't duplicate that list here — extend it instead.

This document is for the *story-side* of classes: identity, role, and how each class earns its place in the player's journey.

## How classes are unlocked

- Players accrue `*Class` modifier points across quests (e.g. `WarriorClass: 1`, `MageClass: 1`).
- A class **unlocks** at 5 points; see `CLASS_UNLOCK_POINTS` in [src/components/rpg/constants.ts](../../src/components/rpg/constants.ts).
- A player can unlock multiple classes; the displayed primary class falls back to "Stranger" until any class hits the threshold.
- Logic: `getCharacterClass` in [src/components/rpg/helpers.ts](../../src/components/rpg/helpers.ts) (currently returns Warrior / Rogue / Mage / Stranger; expand as more class UI lands).

## Per-class notes

For each canonical archetype in [CLASSES.md](../CLASSES.md):

- Warrior — _TBD — Cliff to author._
- Mage — _TBD — Cliff to author._
- Rogue — _TBD — Cliff to author._
- Healer — _TBD — Cliff to author._
- Ranger — _TBD — Cliff to author._

For each class, capture:

- Identity (voice, archetype, vibe).
- Role in a party (when parties exist).
- Signature skills / spells / job paths.
- Class-specific endgame hooks tied to the [Main Quest](./VISION.md#the-main-quest).

## Specializations

[CLASSES.md](../CLASSES.md) lists 11 design-reference specializations under the five archetypes. Specializations are **design reference only** — they do not generate `*Class` modifier keys. Quest authors stick to the five archetype keys.

_TBD — Cliff to author specialization narratives._

## Open questions

- When does a player choose a specialization within their archetype?
- Multi-classing: layered, gated, or freeform?
- Class-specific UI (icon, banner, palette)?
- _More TBD._
