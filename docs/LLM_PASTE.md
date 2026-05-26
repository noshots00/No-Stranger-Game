# LLM Paste — No Stranger Game

**Purpose:** Copy this entire file into another LLM (DeepSeek, ChatGPT, etc.) when brainstorming story, systems, or design for *this* game.

**Last updated:** 2026-05-21 · **App version:** see `package.json` · **Maintainer:** Cliff

**Keep in sync:** When you change game design in `docs/design/FEATURES.md`, `MAIN_QUEST.md`, `RACES.md`, or `CLASSES.md`, update the matching sections here.

---

## How to use with another LLM

Paste this file once at the start of a chat. Then ask questions normally. Tell the model:

- Treat everything below as **ground truth** for what exists today.
- **Do not** invent a central game server, hidden authoritative inventory on relays, or per-player relay shards — the game is a browser client + public Nostr events on **shared game relays**.
- **Tone:** literary, choice-driven, Eastern-calendar day pacing — not a grind MMO.
- **Constraints:** calendar pacing starts at village (`day-pacing-active`); forest arc is bingeable. Post-village: daily unveil cap (~2 new quests/day), `minDay` gates, race lock at Silver Lake, class lock at 5 archetype points, modifier keys from canon lists below.

---

# Part 1 — What this game is (framing)

**No Stranger Game** is a browser RPG built on Nostr:

1. **Solo story first** — branching quests (TypeScript modules), narrator lines + player choices on the **Play** tab. Pre-village: bingeable (all eligible quests visible; `minDay` ignored). Post-village: gates on level, Eastern calendar day, flags, location, completed quests; ~two new quests unveil per in-game day.

2. **Character growth through choices** — Choices apply `modifiersDelta` (stats, traits, race points, class points, currency, etc.). **Race** locks at **Silver Lake reflection** (quest 018): dominant `race:*` tally becomes your subrace. **Class** locks when any of five archetypes reaches **5** points: Warrior, Mage, Rogue, Healer, Ranger.

3. **Day pacing** — Eastern **creation date** is stored at naming (kind **10031**, for account-age metadata). **Calendar pacing** (`day-pacing-active`) starts at village arrival. Until then the header reads **The Forest**; after village, “Day N” and daily rollover (skill XP, unveil queue, **Day Report**).

4. **Forest district** — Early game locations include Forest, Silver Lake, Waterfall, and related scene actions. The **main quest spine** runs Forest → (mid-game branches TBD) → **Village**.

5. **Village hub (multiplayer, live)** — After `quest-036-the-village` (race + class locked, Silver Lake reflection done; flags `village-phase` + `day-pacing-active`), players share a **Village** location with:
   - **Arena** — open registration queue, automated pairing, match results on relays
   - **Mayor’s Hut** — candidacy and voting
   - **Tavern** — player-posted bounties/quests with gold escrow in save state
   - **Market** — player listings and NPC supply purchases
   - **Guilds** — design doc exists; full guild flow still evolving

   All village/arena/mayor/market/tavern **reads and writes** use two fixed game relays: `wss://relay.ditto.pub` and `wss://relay.dreamith.to` (not each player’s personal Nostr relay list).

6. **Persistence** — Full save in **kind 10032** (`quest-state`, public JSON) plus **localStorage** fallback. Creation anchor **kind 10031** at naming (Eastern date; pacing gates use `day-pacing-active` at village). Character display name syncs to **kind 0** on naming.

7. **UI tabs** — **Character** (sheet, chronicle), **Quests**, **Play** (story), **Map**, **Social** (strangers/kindred, activity feed, global lobby chat).

8. **Chat** — Room chat on game relays (kind **1** + `t` room tags for village rooms; legacy kind 9 still read). Global lobby on Social tab. Chat does not appear on players’ normal profile feeds.

9. **What we do not have yet** — Server-side anti-cheat, maintainer integrity feed, ban list, E2E private inventory, or a filled-in **VISION.md** (tone/premise still TBD in docs).

---

# Part 2 — Implemented features (inventory)

## Quests

- Branching, choice-driven scenes; each quest is a TypeScript module.
- Engine: `src/components/rpg/quests/engine.ts`
- Registry: `src/components/rpg/quests/registry.ts`
- Template: `src/components/rpg/quests/branching-quest-template.ts`

### Quest gating and pacing

- Per-quest `availability` (level, day, flags, completed-quests, race/class lock, location).
- **Pre-village binge**: `dayPacingActive` false — all eligible quests on Play; `minDay` ignored (`meetsMinDay` helper).
- **Post-village**: daily unveil cap (~2 new/day), `minDay`, daily rollover bundle (flags, unveil drain, “Day N began.”, **Day Report**).
- **Village quest**: `quest-036-the-village` requires quest 018 + locked race + locked class; sets `village-phase` and `day-pacing-active`.

## Day cycle and Eastern pacing

- **Creation anchor** at naming: `characterCreationDateEastern` + kind **10031** (account-age metadata).
- **Pacing flag** at village: `day-pacing-active` — enables header “Day N”, daily XP catch-up, day gates.
- **Day index**: calendar days from creation through “today” in Eastern + 1 (`America/New_York`).
- **Hydration gate**: quest state hydrated + pacing resolved (“Loading your ledger…”).

## Skills and XP

- Three skill XP pools: `explorationXp`, `foragingXp`, `meleeAttackXp`.
- Daily XP distribution across skills; character level derived from total XP curve.

## Race lock

- Players accrue `race:*` modifier points across quests; dominant race is assigned at **Silver Lake reflection** (quest 018).
- One-shot stat/trait flavor applied on lock; `assignedRaceSlug` stored on state.
- Milestone dialogue uses Day Report voice (“The lake answers”) plus world/event copy.
- Canonical races: see **Part 4** below.

## Class lock (archetypes)

- Five archetypes tracked as `class:<slug>` modifiers.
- When any track reaches **5** points, the character **locks** to that archetype (`lockedClassSlug`).
- Milestone: Day Report-style block titled **Path secured** plus world line (“… is a \<Class\>!”).
- Canonical classes: see **Part 5** below.

## Modifiers

- Traits, characteristics, blessings, coins/items, skills, and organic keys beyond race/class.
- Authoring rules: see **Part 6** below.

## Persistence

- **Quest checkpoints**: kind **10032**, d-tag `quest-state`, JSON payload with full quest state.
- **Character creation anchor**: kind **10031**, `creationDateEastern`.
- **Local fallback**: per-pubkey localStorage; load relay first, merge with local on hydrate when local is ahead.
- **Reset story** (game menu): clears creation-date keys, resets to initial state, republishes checkpoint.

## Shell UI (tabs)

- **Character**: sheet (stats, modifiers, portrait by race), chronicle entry point.
- **Quests**: available/completed lists, track quest.
- **Play**: branching dialogue, choices, location actions (Silver Lake scenes map to quests).
- **Map**: locations gated by flags (e.g. Silver Lake, airship, Village).
- **Social**: strangers/kindred counts, activity feed, global lobby chat.

### First session and gameflow

- Teach through **UI affordance**, not a heavy tutorial: players must recognize when **story beats** end and **their turn** begins.
- **Play column**: Distinct treatment for the choice / input block below the scrollback.
- **Hints**: Short UI-only notes read as interface copy, not narrator voice.
- **Character sheet**: Skills listed only once any skill reaches **level 1**; quest-items row only when non-empty.

## Chat

- Global lobby on Social tab; per-location/district rooms from Play when implemented.
- On **game relays** so traffic does not spam the user’s normal nostr feed.
- Membership: non-empty `playerName` (character named).
- Display names: own messages use `questState.playerName`; others from latest kind **10032**, then kindred map, then fallback.

## Social signals and activity

- Strangers / Kindred counts from peer checkpoints.
- **Activity** rows: latest checkpoint per author; if race is set, shows lake-return summary with level, race, and class label.

## Status strip (game header)

- Location pill, ambient mute; health bar and day countdown may be hidden for density in current UI.

## Ambient audio

- Ambient pad / optional Silver Lake MP3 when game shell is ready; mute persists in localStorage.

## Chronicle

- Merges dialogue + world events for reading in a modal.

## Village hub (multiplayer)

- **Unlock:** `quest-036-the-village` sets `village-phase` flag and Village location.
- **Arena:** kind **30333** open registration; kind **10050** match results; combat rating at register time.
- **Mayor:** kinds **30338** (candidacy), **30339** (vote); client shows leading candidate.
- **Tavern:** kind **30336** player-posted quests; bounty/gold escrow tracked in quest save.
- **Market:** kind **30337** listings; NPC supply table in client; copper/gold/silver in modifiers.
- **Relays:** all village queries/publishes use **ditto.pub + dreamith.to** only.
- **UX:** panels poll while open (~20s); manual **Update** on Arena, Mayor, Market.

## Developer / debug tools (Vite dev only)

- Advance 24 hours, 5-minute game days, rapid day simulation, unlock all quests, modifier breakdown — dev menu only.

## Jobs (post-village)

- Explorer auto-granted at village; one active job; daily shift; resources on `QuestState.resources`.
- Discovery quests 037–039 unlock Cemetery/Quarry/Mine and Adventurer / Stone Cutter / Miner jobs.
- Forest remains reachable from village travel after `village-phase`.

## Village community projects

- Kind **30340** (mayor project definition, author-filtered); kind **30341** (contributions).
- Mayor picks project from catalog; players spend stockpiled stone/iron.

## Guilds

- Design notes in `docs/design/GUILDS.md`; Nostr kinds **30334–30335** defined in `NIP.md`; not fully productized in UI.

## Main Quest (narrative doc)

- Full outline in **Part 3** below. Quest 001 implemented; mid-game and village gates partly skeleton.

---

# Part 3 — Main quest outline

The spine of the player's journey from the Forest to the Village.

This section uses plain-speak format. Each quest section maps 1:1 to a quest file.

## How to read quest notation

### Step notation

```
STEP: step-id
"Narrator text the player sees."
```

### Choice notation

```
STEP: my-choice-step
"What do you do?"
  A) Choice label here        --> next-step-id
  B) Another choice           --> other-step-id   [COMPLETE]
```

- `-->` points to the next step after picking that choice.
- `[COMPLETE]` means this choice ends the quest.
- `[MAIN]` marks a choice on the critical main-quest path.

### Branch and converge notation

```
=== BRANCH at step-id: "short reason" ===

--- Path A: "label" ---
STEP: ...

=== CONVERGE at reunion-step-id ===
```

### Effects shorthand

```
  A) Attack   --> aftermath   {+Warrior, +Strength, +Orc, +Dwarf}
```

## Quest map (bird's-eye view)

```
Quest 001 — The Beginning (Forest, Day 1)
    |
    |--- (flavor choice: call for help / check pockets / climb tree / etc.)
    |--- (compass choice: N / E / S / W)
    |
    v
  Boar encounter
    |
    v
  === BRANCH at dusk-choice ===
    |
    |--- Path A: "Keep going"  ---> darkness sequence
    |       |
    |       === BRANCH at dark-branch ===
    |           |--- "Creep forward"   --> moonlit rock     [COMPLETE Day 1]
    |           |--- "Stay in place"   --> blue bugs
    |           |       |--- "Follow lights" --> ravine     [COMPLETE Day 1]
    |           |       |--- "Take shelter"                 [COMPLETE Day 1]
    |           |--- "Yell for help"                        [COMPLETE Day 1]
    |
    |--- Path B: "Build shelter" --> lean-to                [COMPLETE Day 1]
    |
  === All paths end Day 1 — Quest 001 complete ===
    |
    v
  Quest 002+ (Day 2 onward) — [SKELETON: to be outlined below]
    |
    ...
    |
    v
  Final quest — Arrival at the Village [SKELETON]
```

## Quest 001 — The Beginning

- **File:** `quest-001-origin.ts`
- **Type:** MAIN
- **Prerequisite:** none (first quest)
- **Day gate:** Day 1
- **Main daily quest:** yes
- **Ends at:** shelter-lean-end, yell-help-end, creep-sleep-end, bugs-shelter-end, follow-outcrop-end

### Steps (summary)

- Tutorial A/B/C choice (flavor only) → “How did I get here?” → name input (sets `playerName`, creation date, kind 10031/0 sync).
- Flavor “what do you do?” (five options, no mechanical effect).
- Compass N/E/S/W (flavor; all lead to boar).
- **Boar encounter** — first meaningful choice: Attack / Cast spell / Dodge / Run (pushes race/class modifiers).
- **Dusk branch:** Keep going (darkness sub-branches) vs Build shelter (short complete).
- All five endings complete Quest 001; Day 2 quests unlock.

## Quest 002+ onward — main quest skeletons

### Quest ??? — [SKELETON] Morning After

- Player wakes from Q001 ending; establish Day 2. All Q001 endings converge.

### Quest ??? — [SKELETON] First Sign of Civilization

- First evidence of other people — trail marker, campfire, footprints. Natural `[SIDE HOOK]` for airship.

### Quest ??? — [SKELETON] The Fork (mid-game branch point)

- Big structural branch: 2–3 parallel mid-game chains (river / mountain / underground TBD).

### Quest ??? — [SKELETON] The Approach

- All paths converge; Village visible; tone shift to social/political.

### Quest ??? — [SKELETON] Village Gates

- Enter Village; endgame begins. Race/class should be locked.

### Quest ??? — [SKELETON] Endgame / Final Quest

- Climax; why did the player wake with no memory?

## Side quest hooks (selected)

| Side Quest | Hooks onto | Gate | Notes |
|---|---|---|---|
| 002 Boar Ambush | after Q001 | exploration >= 2, day >= 2 | class/race modifier push |
| 003 Silver Lake | after Q001 | exploration >= 3 | unlocks Silver Lake location |
| 005 Airship | after Q001 | exploration >= 5, day >= 6 | discovery flag |
| 010-013 Find items | various | various skill levels | inventory flavor |
| 018 Silver Lake Reflection | after lake discovered | char level >= 10, race unset | **RACE LOCK** |
| 022 Warlord's Choice | daily flag | Sophie daily flag | moral dilemma |
| 036 The Village | after Silver Lake arc | (see code) | **VILLAGE PHASE** unlock |

## Conventions for adding new main quests

1. Write skeleton in main-quest doc first (purpose, enters-from, exits-to, branch role).
2. Flesh out steps with ids matching the `.ts` quest file.
3. Mark branch/converge points explicitly.
4. Implement in code last.

---

# Part 4 — Playable races (canonical)

**Archetypes (5):** Human, Elf, Dwarf, Monster, Animal. **13 subraces** total.

Primary stats: Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma.

## Human

- **Atlantians** — +2 STR, +1 CHA — seafarers, competitive, honor-bound — Trident — `race:atlantians`
- **Sunborn** — +2 CON, +1 WIS — desert dwellers, resilient, spiritual — Sun Disk — `race:sunborn`
- **River Kingdom** — +2 INT, +1 DEX — traders, scribes, diplomatic — Lotus — `race:riverkingdom`

## Elf

- **Night Elf** — +2 DEX, +1 INT — nocturnal, secretive, druidic — Crescent Moon — `race:nightelf`
- **High Elf** — +2 INT, +1 CHA — arrogant, arcane, long-lived — Star Crystal — `race:highelf`
- **Wood Elf** — +2 DEX, +1 WIS — forest-dwellers, hunters — Leaf Arrow — `race:woodelf`

## Dwarf

- **Dwarf** — +2 CON, +1 STR — smiths, stubborn, grudge-bearing — Steel Hammer — `race:dwarf`
- **Gnome** — +2 INT, +1 DEX — tinkerers, illusionists — Spinning Gear — `race:gnome`
- **Halfling** — +2 DEX, +1 CHA — cheerful, lucky, stealthy — Hollow Pipe — `race:halfling`

## Monster

- **Orc** — +2 STR, +1 CON — tribal warriors — Tusked Skull — `race:orc`
- **Troll** — +2 CON, +1 STR — regenerative, cave-dwelling — Severed Arm — `race:troll`
- **Goblin** — +2 DEX, +1 INT — sneaky, inventive, greedy — Shiny Button — `race:goblin`

## Animal

- **Catfolk** — +2 DEX, +1 CHA — graceful, nocturnal hunters — Golden Claw — `race:catfolk`

**Race lock:** Quest 018 → “Lean forward” → `assignRaceFromRaceModifiers` picks highest `race:*` tally, applies +2/+1/-2 stats, auto traits/characteristics, world line: `A {Subrace} stares back from the water.` Subtitle becomes `Level N {Emoji} {DisplayName} {Class}`.

**Organic keys in quests:** e.g. `WoodElfRace`, `RiverKingdomRace` (not ad-hoc invented races).

---

# Part 5 — Playable classes (canonical archetypes)

Five **archetypes** for `class:*` modifiers (specializations are narrative only until wired):

| Archetype | Specializations (flavor) | Organic key |
|-----------|-------------------------|-------------|
| **Warrior** | Knight, Duelist | `WarriorClass` → `class:warrior` |
| **Mage** | Elementalist, Channeller, Enchanter | `MageClass` → `class:mage` |
| **Rogue** | Assassin, Blademaster | `RogueClass` → `class:rogue` |
| **Healer** | Cleric, Shaman | `HealerClass` → `class:healer` |
| **Ranger** | Archer, Druid | `RangerClass` → `class:ranger` |

**Class lock:** when any archetype track reaches **5** points, `lockedClassSlug` is set; further `class:*` deltas to other archetypes are ignored.

Do **not** use specialization names (Knight, Elementalist) as modifier keys unless rules are extended.

---

# Part 6 — Modifier authoring rules

## Organic stems

Append a suffix: `Class`, `Trait`, `Skill`, `Stat`, `Blessing`, or `Race`.

Examples: `CourageTrait`, `WarriorClass`, `WoodElfRace`, `StrengthStat`.

Legacy keys without suffix stay **Misc**.

## Race keys

- Only subraces from **Part 4**.
- Slug: concatenated lowercase (`RiverKingdomRace` → `race:riverkingdom`, not `river_kingdom`).
- Points accumulate until lock; after lock, new `race:*` gains are ignored.

## Class keys

- Only five archetypes from **Part 5**.
- Lock at 5 points on one archetype.

## Stats

- `StrengthStat` → `stat:strength` (same for DEX, CON, INT, WIS, CHA).

## Currency

- Authoring: `Copper`, `Silver`, `Gold` in `modifiersDelta`.
- 1 silver = 12 copper; 1 gold = 20 silver = 240 copper.
- Stored as `currency:copper` total; sheet shows `12g 5s 7c` style.

## Quest content conventions (fever/sweet dreams style)

- Stats: prefer `*Stat` organic keys.
- Traits: simple personality (`CautiousTrait`, `CowardTrait`, `CourageTrait`).
- Characteristics (misc): passing moods (`Haunted`, `Hopeful`) — not `*Trait` if unstable.
- Spells: `SomethingSpell` stems; use `SpellcastingSkill` for general casting skill.
- Avoid new blessings unless explicitly requested.

---

*End of LLM Paste.*
