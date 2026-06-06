# Activatable quests: Day 1 through the Village

Summary of quest content that can appear **before** the player completes **The Village** (`quest-036-the-village`). Sourced from quest definitions in `src/components/rpg/quests/` and unveil logic in `quest-saga.ts` (as of v0.5.427).

---

## How quests become activatable

Three layers matter:

1. **Unveiled** — the quest card appears in the Play journal / quest list.
2. **Available** — `isAvailable(context)` passes (prerequisites, location, flags, skills, day gates).
3. **Playable** — unveiled + available + not already completed.

**Manual saga gating** (`MANUAL_QUEST_GATING = true` in `quest-saga.ts`): only the **forest main chain** below auto-unveils, one quest at a time, when the prior quest is completed. Side quests do **not** drip-unveil on day rollover while this flag is on; they can still appear if dev tools unlock all quests, legacy saves, or future gating changes.

**Day pacing:** `minDay` requirements are **ignored** until the village sets `day-pacing-active`. Before the village, day-number gates in quest definitions do not block play.

**Unveil vs play:** For saga steps, `isUnveilEligible` often strips `minDay` and branch flags so the next main quest can surface even when full `isAvailable` is stricter.

---

## Main forest chain (auto-unveils in order)

This is the spine a new player follows from Day 1 to the village gates.

| Order | ID | Title | Unveils after | Play requires | Main daily? | Summary |
|------:|----|-------|---------------|---------------|:-----------:|---------|
| 1 | `quest-001-origin` | The Beginning | *(start)* | Always | — | Wake in the forest with no memory. Ask how/where you are, then **enter your character name** (Nostr anchor). |
| 2 | `quest-002-first-night` | Sunset | Origin complete | Origin complete | **Yes** | Dusk in the forest. Pick **one permanent first-night action** (shelter, food, water, trails, tree, pockets, call for help, high ground). Night may include a boar; you rest in a crude shelter. |
| 3 | `quest-003-dyers-crypt` | Dyer's Crypt | Sunset complete | Sunset complete | — | Opener reflects your Sunset choice. Find mushrooms (eat or leave — sets fever/sweet dream flags). Encounter a shambling skeleton; follow or flee toward **Ancient Cemetery** and rising dead. |
| 4 | `quest-004-abandoned-shelter` | Abandoned Shelter | Dyer's Crypt complete | Dyer's Crypt complete *(legacy: wandering-skeleton quest OK)* | — | Exhausted after wandering, you find a collapsed lean-to, enter, and loot a cache: buckler, parrying dagger, or strange book. |
| 5 | `quest-007-day-two-dream` | Dream | Abandoned Shelter complete | Abandoned Shelter + **`fever-dream-pending` or `sweet-dream-pending`** (from Crypt mushrooms) | **Yes** | Sleep resolves mushroom fallout: **fever nightmares** (Atlantian / Eastern / Moon / Arena visions) or **sweet dreams** (glade, feast, hall, lantern). Dawn breaks; quest completes. |
| 6 | `quest-005-forest-cave` | The Cave | Dream complete | Dream complete | **Yes** | Sunset path leads to a cave mouth. Knocked out (stream, bear, spores, mine shaft, etc.), dream vignettes play, you wake a day later changed; cave is marked discovered. |
| 7 | `quest-004-b-the-door` | The Door | Forest Cave complete | Forest Cave complete | — | A thunderous voice stops you on the trail. Meet **Carl** at a strange forest door; dialog farewell completes the beat. |
| 8 | `quest-036-the-village` | The Village | The Door complete | The Door complete | — | **Endpoint of this document.** Smoke and cobbles beyond the trees; approaching sets **village phase**, enables day pacing, unlocks village jobs, moves location to Village. |

**Journal one-liners (main chain):**

- Origin — *You awoke in the forest with no memory — except your name.*
- Sunset — *You had a strange night in the forest.*
- Dyer's Crypt — *Dyer's Crypt*
- Abandoned Shelter — *(title only)*
- Dream — *Dream*
- The Cave — *You entered a cave and woke a day later, changed by strange memories.*
- The Door — *Answered the voice beyond the forest door.*

---

## Alternate main spine (not auto-unveiled today)

`MAIN_SAGA_QUEST_IDS` in `quest-saga.ts` describes a longer chain used when manual gating is off. These quests **exist in code** and can be activatable if unveiled, but they are **not** in the current manual unveil sequence:

| ID | Title | Play requires | Summary |
|----|-------|---------------|---------|
| `quest-002-b-will-i-starve` | The Old Well | Sunset complete + player at **Old Well** | Location popup: turn handle, throw items, retrieve a strange coin. |
| `quest-003-b-meet-merchant` | You meet a merchant | Old Well quest complete | Traveling merchant intro; visit via location button. |
| `quest-005-b-home` | Smoke test — home | The Door complete | Placeholder acknowledgment after The Door. |
| `quest-005-c-wolf-pelt-tribute` | Three pelts | Home quest complete | Trail marker wants 3 wolf pelts from merchant; turn in for brass ring. |

---

## Side quests activatable before the village (if unveiled)

None of these auto-unveil under `MANUAL_QUEST_GATING`. Each row is **playable before village** if the quest is surfaced and gates pass.

### Exploration / skill gates

| ID | Title | Availability gates | Summary |
|----|-------|-------------------|---------|
| `quest-002-boar-ambush` | Boar in the Brush | Exploration ≥ 2, min day 2* | Boar charges while exploring; fight, spell, dodge, or flee. |
| `quest-003-silver-lake` | Silver Lake | Exploration ≥ 4, min day 5* | Still lake; wade or leave (`silver-lake-unlocked`). |
| `quest-007-green-hand` | The Green Hand | Foraging ≥ 2, min day 4* | Trip over buried green hand/arm statue; dig to expose more. |
| `quest-009-waterfall` | The Waterfall | Exploration ≥ 3, min day 4* | Ten-foot falls; climb top and explore behind (both branches). |

\*Min day inactive until village enables day pacing.

### Placeholder forest beats (min-day gated in data; inactive pre-village)

| ID | Title | Summary |
|----|-------|---------|
| `quest-023-whispering-tree` | Whispering Tree | Tend bark or read tracks. |
| `quest-024-lone-sapling` | Lone Sapling | Water a sapling in a burned clearing. |
| `quest-025-crooked-cairn` | Crooked Cairn | Follow disturbance or pocket hidden item. |
| `quest-026-sun-bleached-bone` | Sun-Bleached Bone | Bury bone or take pouch. |
| `quest-027-sleeping-hare` | Sleeping Hare | Stalk or mend wounded hare. |
| `quest-028-toppled-stones` | Toppled Stones | Re-erect, decipher, or investigate marker. |
| `quest-029-hidden-spring` | Hidden Spring | Bottle water or mark spring. |
| `quest-030-charcoal-sigil` | Charcoal Sigil | Erase or copy sigil on ironwood. |
| `quest-031-fallen-companion` | Fallen Companion | Bind a wounded traveller's wound. |
| `quest-032-distant-smoke` | Distant Smoke | Charge, read wind, or circle wide toward smoke. |
| `quest-033-twin-mounds` | Twin Mounds | Walk boundary or listen between mounds. |
| `quest-034-carved-acorns` | Carved Acorns | Pocket acorns or call out at spiral. |
| `quest-035-buried-lantern` | Buried Lantern | Claim lantern or carry to shrine. |

### Daily-flag moral vignettes

Activated when the corresponding daily flag is set (typically day-roll systems; flags can exist pre-village in theory):

| ID | Title | Flag required | Summary |
|----|-------|---------------|---------|
| `quest-008-wolf-attack` | Wolf Attack | `wolf-attack-daily-active` | Recount surviving a wolf (fight, spell, fork, flee). |
| `quest-010-find-earring` | Find an Earring | `earring-daily-active` | Pick up or leave. |
| `quest-011-find-bracelet` | Find a Bracelet | `bracelet-daily-active` | Pick up or leave. |
| `quest-012-find-shoe` | Find a Shoe | `shoe-daily-active` | Pick up or leave. |
| `quest-013-find-hat` | Find a Hat | `hat-daily-active` | Pick up or leave. |
| `quest-017-ironwood-switch` | The Ironwood Switch | `trolley-daily-active` | Ore-cart trolley problem at a lever. |
| `quest-019-plaguebloom-phial` | The Plaguebloom Phial | `heinz-daily-active` | Beg, demand, or steal plague cure. |
| `quest-020-iron-cage` | The Iron Cage | `prisoner-daily-active` | Prisoner's dilemma with magistrate. |
| `quest-021-nine-oar-raft` | The Nine-Oar Raft | `lifeboat-daily-active` | Lifeboat ethics — who gets an oar. |
| `quest-022-warlords-choice` | The Warlord's Choice | `sophie-daily-active` | Choose which child lives, refuse, or sacrifice self. |

### Race assignment (Silver Lake follow-up)

| ID | Title | Availability | Summary |
|----|-------|--------------|---------|
| `quest-018-silver-lake-reflection` | Silver Lake reflection | `silver-lake-unlocked`, character level ≥ 10, race not yet assigned | Lean into the water; vision assigns race from modifier lean. *Alternate path to village unveil when manual gating is off.* |

---

## Not activatable before village (by design)

| ID | Title | Reason |
|----|-------|--------|
| `quest-002-c-strange-egg-tree` | The High Tree | `isAvailable: () => false` |
| `quest-014-mushroom-patch` | Mushroom Patch | `minDay: 99` + quest001 flag |
| `quest-015-fever-dream` | Fever Dream | `minDay: 99`; content folded into `quest-007-day-two-dream` |
| `quest-016-sweet-dream` | Sweet Dream | Same as fever dream |
| `quest-037`–`quest-041` | Cemetery, Quarry, Mine, Pick a Job, Mayor | Require **village phase** flag |

---

## Legacy note

**Quest 006** does not exist as its own file. Saves referencing `quest-006-wandering-skeleton` are treated as Dyer's Crypt complete for Abandoned Shelter prerequisites.

---

## Related docs

- Narrative outline (plain-speak): [`MAIN_QUEST.md`](./MAIN_QUEST.md)
- Copy voice: [`QUEST_COPY_STYLE.md`](./QUEST_COPY_STYLE.md)
- Unveil implementation: `src/components/rpg/quests/quest-saga.ts`
