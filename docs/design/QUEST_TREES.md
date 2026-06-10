# Quest pictogram (wired spine)

One compact diagram **per day**, top to bottom. Forks are diamonds; ↺ hub = return to sunset choices.
Step-level copy lives in quest files and `MAIN_QUEST.md`.

Regenerate: `npx vite-node scripts/generate-quest-trees.mjs --out docs/design/QUEST_TREES.md`

---

## Spine

```
Day 1: 001 Origin → 002 Sunset
Day 2: 003 Dyer's Crypt → 004 Shelter → 007 Dream
Day 3: 005 Forest Cave → 004b The Door
Village: 036 → 042 → 040 → 041
```

## Day 1

*001 Origin → 002 Sunset*

```mermaid
flowchart TB
  wake[Wake in forest] --> open{{How? or Where?}}
  open --> name[Name]
  name --> hub{{Sunset — what now?}}

  hub --> sh[Shelter ↺ hub]
  hub --> pk[Pockets ↺ hub]
  hub --> tree[Climb tree ↺ hub]
  hub --> help[Call help ↺ hub]

  hub --> food[Lemon tree → snake]
  hub --> stream[Stream]
  hub --> trails[Trails L/R]
  hub --> north[North steep]

  food & stream & trails & north --> boar{{Boar}}
  boar --> fight{{Attack · Spell · Dodge · Run}}
  fight --> night[Night rest]
```

## Day 2

*003 Dyer's Crypt → 004 Shelter → 007 Dream*

```mermaid
flowchart TB
  crypt[Dyer's Crypt] --> mush{{Mushrooms?}}
  mush --> skel{{Skeleton at trunk}}
  skel --> cem{{Cemetery?}}
  cem --> shelter[Abandoned shelter]
  shelter --> crawl{{Crawl in or shout?}}
  crawl --> loot[Loot & sleep]
  loot --> dream[Day-two dream]
  dream --> nightmare{{Pick nightmare}}
  nightmare --> vision{{Flying · swim · mind}}
  vision --> dawn[Dawn]
```

## Day 3

*005 Forest Cave → 004b The Door*

```mermaid
flowchart TB
  cave[Forest cave] --> ko[Knocked out]
  ko --> wake[Wake inside]
  wake --> vig[Five vignettes]
  vig --> door[The door]
  door --> approach{{Yell · knock · hide}}
  approach --> farewell[Farewell]
```

## Village

*036 → 042 → 040 → 041*

```mermaid
flowchart LR
  village[Village arrival] --> shannon[Mayor Shannon] --> job[Pick a job] --> mayor[Mayor]
```
