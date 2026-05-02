# Quest class & race modifier counts

Generated from organic `*Class` and `*Race` keys inside `modifiersDelta` in [`src/components/rpg/quests`](/src/components/rpg/quests/) (`*.ts` only).

For each stem (e.g. `Warrior` + `Class`), **values are summed** across every occurrence (almost always `: 1` per choice).

**Regenerate:** from repo root run:

```bash
node scripts/count-quest-class-race-modifiers.mjs
```

Last generated: 2026-05-02

---

## Classes

| Class | Total delta |
| ----- | -----------:|
| Mage | 5 |
| Warrior | 5 |
| Rogue | 3 |
| Archer | 2 |
| Druid | 2 |
| Enchanter | 2 |
| Assassin | 1 |
| Blademaster | 1 |
| Channeller | 1 |
| Cleric | 1 |
| Elementalist | 1 |
| Knight | 1 |

## Races

| Race (organic stem) | Total delta |
| ------------------- | -----------:|
| Halfling | 17 |
| RiverKingdom | 16 |
| Goblin | 15 |
| NightElf | 14 |
| WoodElf | 14 |
| HighElf | 13 |
| Atlantians | 12 |
| Catfolk | 12 |
| Dwarf | 12 |
| Gnome | 12 |
| Orc | 12 |
| Sunborn | 12 |
| Troll | 6 |

_Note: Display names in UI use spaces (e.g. River Kingdom, Night Elf); organic keys are concatenated CamelCase._
