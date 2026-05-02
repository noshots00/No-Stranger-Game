# Skills

Skills are anything a character can get better at. They include spells, combat techniques, job skills, and other learned abilities.

This document is the human-curated reference. Per-skill machine data lives in code; cross-links below.

## Spells (a special kind of skill)

Spells are skills that consume some resource (mana / focus / time / cost) and produce a magical effect.

_TBD — Cliff to author._

For each spell, capture:

- School (elemental / arcane / divine / shadow / etc.)
- Cost / cooldown / range
- Class affinity (Mage, Healer, etc.)
- In-world flavor

## Combat skills

Combat skills are martial techniques used in encounters. Examples already in code as modifier keys: `ClimbingSkill`, `Evasion`, `Dodge`.

_TBD — Cliff to author._

For each combat skill, capture:

- Stance / weapon family / unarmed
- Class affinity
- How it interacts with the (future) health system.

## Job skills

Job skills are non-combat professions: foraging, mycology, herbalism, blacksmithing, etc. Examples in code: `Survival_MycologySkill`, `HerbalismSkill`.

_TBD — Cliff to author._

For each job skill, capture:

- Crafting / gathering / social / lore
- Whether it has a daily XP source (today: only the three primary XP pools — `explorationXp`, `foragingXp`, `meleeAttackXp` — see [src/components/rpg/quests/skills-config.ts](../../src/components/rpg/quests/skills-config.ts)).

## Other skills

Anything that doesn't fit above: language, instruments, etiquette, etc.

_TBD — Cliff to author._

## Cross-links

- Daily skill XP distribution: [src/components/rpg/quests/skills-config.ts](../../src/components/rpg/quests/skills-config.ts)
- Modifier authoring rules for skills: [.agents/docs/character-modifiers.md](../../.agents/docs/character-modifiers.md)
- Level curve: `getLevelFromXp` in [src/components/rpg/quests/engine.ts](../../src/components/rpg/quests/engine.ts)
