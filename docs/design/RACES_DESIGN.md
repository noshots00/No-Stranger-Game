# Races (design)

Narrative and philosophy of the races in No Stranger Game.

The **canonical machine-readable list** of subraces lives at [docs/RACES.md](../RACES.md) and is referenced by `AGENTS.md` and `.agents/docs/character-modifiers.md`. Don't duplicate that list here — extend it instead.

This document is for the *story-side* of races: how each race feels, what they value, where they come from, and how they fit the world.

## How races are awarded

- Players accrue `*Race` modifier points across early quests.
- The race is **locked permanently** at the Silver Lake reflection (quest 018) by tallying `race:*` modifiers and picking the dominant slug (deterministic tie-break).
- Engine: `pickDominantRaceSlug` in [src/components/rpg/quests/engine.ts](../../src/components/rpg/quests/engine.ts).
- Race effects (stat bonuses, weakness, auto-traits) live in [src/components/rpg/races.ts](../../src/components/rpg/races.ts).

## Per-race notes

For each canonical race in [RACES.md](../RACES.md), Cliff to author:

- One-paragraph identity (voice, archetype, vibe).
- Cultural notes (homeland, language flavor, naming).
- How the race shows up mechanically (stat profile, signature traits).
- Any in-world rivals or kinships with other races.

_TBD — Cliff to author._

## Open questions

- Should races have visual identifiers in the UI (icon, color)?
- Are sub-race choices ever player-driven, or always emergent from quest decisions?
- _More TBD._
