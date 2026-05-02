# Quest class & race modifier counts

Generated from organic `*Class` and `*Race` keys inside `modifiersDelta` in [`src/components/rpg/quests`](/src/components/rpg/quests/) (`*.ts` only).

For each stem (e.g. `Warrior` + `Class`), **values are summed** across every occurrence (almost always `: 1` per choice).

**Regenerate:** from repo root run:

```bash
node scripts/count-quest-class-race-modifiers.mjs
```

Last generated: 2026-05-02 (after dilemma quests 017/019/020/021/022)

---

## Classes

| Class | Total delta |
| ----- | -----------:|
| Mage | 16 |
| Healer | 12 |
| Warrior | 12 |
| Ranger | 8 |
| Rogue | 8 |

## Races

| Race (organic stem) | Total delta |
| ------------------- | -----------:|
| RiverKingdom | 22 |
| Halfling | 21 |
| Sunborn | 19 |
| Catfolk | 18 |
| NightElf | 18 |
| Atlantians | 17 |
| Goblin | 17 |
| Dwarf | 16 |
| Orc | 16 |
| WoodElf | 16 |
| HighElf | 15 |
| Gnome | 14 |
| Troll | 11 |

_Note: Display names in UI use spaces (e.g. River Kingdom, Night Elf); organic keys are concatenated CamelCase._
