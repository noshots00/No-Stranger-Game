# Playable classes (design reference)

**Class archetypes** group combat and support roles; each has **specializations** with a distinct fantasy and playstyle. This is for narrative, UI, and future `class:*` modifiers (see [character modifiers](../.agents/docs/character-modifiers.md)). The app currently elevates **Warrior**, **Mage**, and **Rogue** paths in the character subtitle; Healer and Ranger are design targets for when you wire more paths in code.

Last reviewed: 2026-05-02

---

## Warrior

- **Knight** — Heavy armor, sword and shield, defensive tactics, honor-bound protector.
- **Duelist** — Light armor, single rapier or blade, agile parrying, one-on-one specialist.

## Mage

- **Elementalist** — Commands fire, ice, and lightning for raw destructive power.
- **Channeller** — Crowd control master who summons spirits to attack for her.
- **Enchanter** — Master of illusion, buffs allies, debuffs enemies, and alters perception.

## Rogue

- **Assassin** — Stealth, poisons, critical strikes, specializes in eliminating single targets.
- **Blademaster** — Fast, precise swordplay, flourishes, and agile melee combat without stealth.

## Healer

- **Cleric** — Specializes in saving lives through huge, powerful heals.
- **Shaman** — Specializes in healing over time and debuffing enemies.

## Ranger

- **Archer** — Long-range bow specialist, precision shots, kiting enemies from a distance.
- **Druid** — Nature magic, shapeshifting, animal companions, and wilderness healing.

---

## Summary

| Archetype | Specializations | Count |
| --------- | ----------------- | ----- |
| Warrior | Knight, Duelist | 2 |
| Mage | Elementalist, Channeller, Enchanter | 3 |
| Rogue | Assassin, Blademaster | 2 |
| Healer | Cleric, Shaman | 2 |
| Ranger | Archer, Druid | 2 |
| **Total** | | **11** |

Organic modifier examples (canonical): `KnightClass` → `class:knight`, `ElementalistClass` → `class:elementalist`.
