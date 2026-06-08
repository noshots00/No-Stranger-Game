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

Combat skills are martial techniques used in encounters. Runtime behavior is defined in [`src/components/rpg/combat/skillRegistry.ts`](../../src/components/rpg/combat/skillRegistry.ts).

**Authoring checklist** (add a `SkillDef` entry in `skillRegistry.ts`):

| Field | Notes |
|-------|--------|
| `id` | Canonical key, e.g. `skill:combat:bash` |
| `aliases` | Organic keys (`BashSkill`, …) |
| `kind` | `active` (slotted), `defensive` (on incoming hit), or `passive` (always on, no slot) |
| Behavior | Damage bonus, random range, debuff, miss/parry % — implement in `resolveActiveSkill` / `resolveDefense` |

Players equip two **active** skills/spells on the character sheet loadout; passives (Evasion, Dodge as passive, etc.) apply without a slot.

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
