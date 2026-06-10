# Main Quest Outline

The spine of the player's journey from the Forest to the Village.

This document uses a plain-speak format so the narrative can be written and reorganized without touching code. Each section maps 1:1 to a quest file; the notation below keeps branches, convergence points, and side-quest hooks visible at a glance.

**At-a-glance pictogram** (one compact diagram per day, wired spine): [QUEST_TREES.md](./QUEST_TREES.md). Step-by-step narrative belongs in this document, not the pictogram.

---

## How to Read This Document

### Step notation

Every beat in a quest is a **step**. Steps are written as:

```
STEP: step-id
"Narrator text the player sees."
```

### Choice notation

When the player must choose, list the options under the step:

```
STEP: my-choice-step
"What do you do?"
  A) Choice label here        --> next-step-id
  B) Another choice           --> other-step-id   [COMPLETE]
```

- `-->` points to the next step after picking that choice.
- `[COMPLETE]` means this choice ends the quest.
- `[MAIN]` marks a choice that is part of the critical main-quest path (vs flavor or side path).

### Branch and converge notation

When paths split and later rejoin, mark both ends:

```
=== BRANCH at step-id: "short reason" ===

--- Path A: "label" ---
STEP: ...
STEP: ...

--- Path B: "label" ---
STEP: ...
STEP: ...

=== CONVERGE at reunion-step-id ===
```

All paths inside a branch block eventually point `-->` to the convergence step (or to `[COMPLETE]` if a path ends the quest early).

### Effects shorthand

After a choice arrow, note mechanical effects in curly braces:

```
  A) Attack   --> aftermath   {+Warrior, +Strength, +Orc, +Dwarf}
```

The full modifier list lives in the quest code; here just note the **intent** (e.g. "warrior-leaning" or "coward path").

### Quest copy voice

When drafting narrator lines and choice labels, follow **[QUEST_COPY_STYLE.md](./QUEST_COPY_STYLE.md)** (short, direct, one line when possible).

### Quest header

Each quest section starts with a header block:

```
## Quest NNN — Title
- File: quest-NNN-thing.ts
- Type: MAIN | SIDE
- Prerequisite: what must be true before this quest appears
- Day gate: earliest in-game day
- Ends at: list of step-ids that complete the quest
- Converges from: (if this quest picks up threads from an earlier branch)
- Branches into: (if completing this quest feeds into multiple next quests)
```

### Skeleton quests

For quests you haven't written yet, use:

```
## Quest NNN — Title [SKELETON]
- Purpose: one sentence about what happens here narratively
- Enters from: prior quest(s)
- Exits to: next quest(s)
- Branch role: does this quest sit on a branch? which one?
- Notes: any open questions
```

Fill in the steps later. The skeleton keeps the overall map coherent while individual scenes are still drafts.

---

## Quest Map (bird's-eye view)

A simplified flow showing how main quests connect. Side quests are omitted here but can hook onto any node with a `[SIDE HOOK]` marker.

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
  Quest 002 — Sunset (Day 1 end)
    |
    v
  Quest 003 — Dyer's Crypt (Day 2) → 006 Skeleton → 004 Shelter → 007 Dream [Day 2 end]
    |
    v
  Quest 005 — Forest Cave (Day 3+)
    |
    ...
    |
    v
  Final quest — Arrival at the Village [SKELETON]
```

---

## Forest Day 2–3 spine (code)

| Quest | File | Notes |
|-------|------|--------|
| 003 Dyer's Crypt | `quest-003-dyers-crypt.ts` | Sunset flags → opener; mushrooms; sweet/fever pending |
| 006 Wandering Skeleton | `quest-006-wandering-skeleton.ts` | After Crypt; Ancient Cemetery travel |
| 004 Abandoned Shelter | `quest-004-abandoned-shelter.ts` | After Skeleton |
| 007 Dream | `quest-007-day-two-dream.ts` | Fever or sweet; **main daily quest** (ends Day 2) |
| 005 Forest Cave | `quest-005-forest-cave.ts` | Sunset knockout + 5 moral vignettes; **main daily quest** (ends Day 3) |
| 004b The Door | `quest-004-b-the-door.ts` | After Forest Cave; Carl at the forest door |

Voice: [QUEST_COPY_STYLE.md](./QUEST_COPY_STYLE.md).

---

## Quest 001 — The Beginning

- **File:** `quest-001-origin.ts`
- **Type:** MAIN
- **Prerequisite:** none (first quest)
- **Day gate:** Day 1
- **Main daily quest:** yes
- **Ends at:** shelter-lean-end, yell-help-end, creep-sleep-end, bugs-shelter-end, follow-outcrop-end

### Steps

```
STEP: start
"You will have many choices to make in this game. Pick a choice to continue."
[Image: forest]
  A) Please make a choice to continue...   --> two-a
  B) Please make a choice to continue...   --> two-b
  C) Please make a choice to continue...   --> two-c
```

> Design note: A/B/C all lead to the same next beat. This teaches the player
> that choices exist; the specific pick has no mechanical weight here.

```
=== BRANCH at start: "tutorial choice (flavor only)" ===

--- Path A ---
STEP: two-a
"You chose A. How did I get here?"
  A) "It's like I just woke up... only I can't remember a thing."  --> three

--- Path B ---
STEP: two-b
"You chose B. How did I get here?"
  A) "It's like I just woke up... only I can't remember a thing."  --> three

--- Path C ---
STEP: two-c
"You chose C. How did I get here?"
  A) "It's like I just woke up... only I can't remember a thing."  --> three

=== CONVERGE at three ===
```

```
STEP: three
"What am I doing here? Why can't I remember anything?"
  A) "Wait... I think I remember something..."  --> four
```

```
STEP: four  [INPUT]
Player types their name.
  --> five
  Journal: "You find yourself in a forest. You can't remember anything,
            except... your name is {playerName}."
```

```
STEP: five  [MESSAGE]
"My name is... {playerName}!"
  --> flavor-five
```

```
STEP: flavor-five
"What do you do? (Flavor only — no mechanical effect yet.)"
  A) Call out for help              --> compass-four
  B) Check your pockets             --> compass-four
  C) Climb a tree to look around    --> compass-four
  D) Follow a stream if you hear one --> compass-four
  E) Stay still and listen          --> compass-four
```

> Design note: Five options, all converge. Pure character-expression moment.

```
STEP: compass-four
"Pick a direction."
  A) North — Trees thin slightly.           --> boar-encounter
  B) East — A faint animal trail.           --> boar-encounter
  C) South — Denser ferns, damp ground.     --> boar-encounter
  D) West — Towards the setting sun.        --> boar-encounter
```

> Design note: Direction is flavor. All roads lead to the boar.

```
STEP: boar-encounter
"A wild boar rushes you. Instinct takes over."
World event: "You fended off a wild boar!"
  A) Attack                                 --> boar-aftermath  {warrior-leaning: +Warrior, +Strength, +Orc, +Dwarf, +Atlantians}
  B) Cast a spell (you produce a small      --> boar-aftermath  {mage-leaning: +Mage, +Intelligence, +HighElf, +Gnome, +RiverKingdom}
     spark — surprising even you)
  C) Dodge                                  --> boar-aftermath  {rogue-leaning: +Rogue, +Evasion, +Dodge, +Halfling, +Goblin, +WoodElf, +Catfolk}
  D) Run                                    --> boar-aftermath  {coward path: +Coward, +FastFeet, +SurvivalInstinct, +Goblin, +Halfling, +RiverKingdom}
```

> This is the first **mechanically meaningful** choice. It nudges race/class modifiers.

```
STEP: boar-aftermath  [MESSAGE]
"The boar misses and vanishes into the woods. You're unharmed."
  --> dusk-choice
```

```
=== BRANCH at dusk-choice: "night falls — shelter vs. press on" ===

STEP: dusk-choice
"Dusk falls. It's getting dark fast. You can barely see the trees ahead."
  A) Keep going      --> dark-pitch     [MAIN — longer night sequence]
  B) Build a shelter --> shelter-lean-end [COMPLETE — short ending]
```

```
--- Path B: "Build a shelter" ---
STEP: shelter-lean-end  [MESSAGE, COMPLETE]
"You craft a crude lean-to from branches and leaf litter.
 Exhaustion wins — you curl up inside. Day ends."
```

```
--- Path A: "Keep going" ---
STEP: dark-pitch  [MESSAGE]
"You stumble onward until the forest becomes pitch black."
  --> dark-branch
```

```
  === BRANCH at dark-branch: "what to do in total darkness" ===

  STEP: dark-branch
  "What do you try?"
    A) Slowly creep forward in the dark  --> creep-moonlit
    B) Stay in one place                 --> stay-blue-bugs
    C) Yell out for help                 --> yell-help-end  [COMPLETE]

  --- Path C: "Yell for help" ---
  STEP: yell-help-end  [MESSAGE, COMPLETE]
  "(Placeholder — someone answers? Something answers?) Day ends."

  --- Path A: "Creep forward" ---
  STEP: creep-moonlit  [MESSAGE]
  "Your hands find roots and cold stone. Eventually the canopy opens onto
   a moonlit rock outcropping — enough shelter from the wind."
    --> creep-sleep-end

  STEP: creep-sleep-end  [MESSAGE, COMPLETE]
  "You tuck yourself against the stone and fade toward sleep. Day ends."

  --- Path B: "Stay in place" ---
  STEP: stay-blue-bugs  [MESSAGE]
  "Hours blur. Then — motion overhead: a river of blue sparks drifts through
   the black trees. Lightning bugs? Something stranger?"
    --> bugs-fork

    === BRANCH at bugs-fork: "follow the strange lights or sleep" ===

    STEP: bugs-fork
    "What do you do?"
      A) Follow the lights      --> follow-ravine
      B) Take shelter and sleep --> bugs-shelter-end  [COMPLETE]

    --- Path B: "Shelter" ---
    STEP: bugs-shelter-end  [MESSAGE, COMPLETE]
    "(Placeholder — dreams? Visitors?) Day ends."

    --- Path A: "Follow lights" ---
    STEP: follow-ravine  [MESSAGE]
    "The glow leads you until the ground drops away — a ravine too steep
     to cross. The blue sparks thin and scatter."
      --> follow-outcrop-end

    STEP: follow-outcrop-end  [MESSAGE, COMPLETE]
    "You find a little ledge beneath an overhang — barely enough to
     wait out the night. Day ends."

    === END BRANCH (bugs-fork) ===

  === END BRANCH (dark-branch) ===

=== END BRANCH (dusk-choice) ===
```

**All five endings complete Quest 001. Day 1 ends. Day 2 quests become available.**

---

## Quest 002+ onward — Main Quest Skeletons

> Below: skeleton entries for the main-quest arc from the Forest to the Village.
> Fill in steps using the notation above as each quest is written.
> Side quests (boar ambush, find-item, airship, etc.) are NOT listed here unless
> they gate the main quest.

### Quest ??? — [SKELETON] Morning After

- **Purpose:** Player wakes from wherever they slept in Quest 001. Establish the "second day" feeling — hunger, stiffness, the forest in daylight.
- **Enters from:** Quest 001 (any ending)
- **Exits to:** next main quest
- **Branch role:** single trunk (all Q001 endings converge here)
- **Notes:** Does the ending of Q001 flavor the opening line? (e.g. "lean-to" vs "moonlit rock" vs "ravine ledge")

### Quest ??? — [SKELETON] First Sign of Civilization

- **Purpose:** Player finds first evidence that other people exist — a trail marker, old campfire, footprints, carved tree.
- **Enters from:** Morning After
- **Exits to:** branches toward multiple mid-game paths
- **Branch role:** trunk — may be the last single-path quest before the mid-game fork
- **Notes:** This is the natural place for a `[SIDE HOOK]` to the airship discovery.

### Quest ??? — [SKELETON] The Fork (mid-game branch point)

- **Purpose:** Player must choose a direction/allegiance/route that determines which mid-game quests they see. This is the big structural branch.
- **Enters from:** First Sign of Civilization
- **Exits to:** 2-3 parallel quest chains (see below)
- **Branch role:** BRANCH POINT — paths diverge here and reconverge at "The Approach"
- **Notes:** What are the 2-3 routes? River path vs. mountain pass vs. underground? Faction-based? Open question for Cliff.

```
=== BRANCH at The Fork ===

--- Path A: "[name TBD]" ---
  Quest ??? — [SKELETON]
  Quest ??? — [SKELETON]

--- Path B: "[name TBD]" ---
  Quest ??? — [SKELETON]
  Quest ??? — [SKELETON]

--- Path C (optional): "[name TBD]" ---
  Quest ??? — [SKELETON]

=== CONVERGE at The Approach ===
```

### Quest ??? — [SKELETON] The Approach

- **Purpose:** All mid-game paths lead here. The Village is visible for the first time. Tone shift from wilderness survival to social/political tension.
- **Enters from:** any mid-game path (The Fork branches)
- **Exits to:** Village arrival / endgame quests
- **Branch role:** CONVERGENCE POINT
- **Notes:** Does the path taken affect how the Village receives the player?

### Quest ??? — [SKELETON] Village Gates

- **Purpose:** Player enters the Village. New location unlocked. Endgame begins.
- **Enters from:** The Approach
- **Exits to:** endgame quest chain
- **Branch role:** trunk
- **Notes:** Race/class should be locked by now — does it affect NPC reactions?

### Quest ??? — [SKELETON] Endgame / Final Quest

- **Purpose:** Climax. The reason the player was in the forest. Resolution.
- **Enters from:** Village quest chain
- **Exits to:** game complete (or new-game-plus / postgame)
- **Branch role:** trunk or final small branch
- **Notes:** What is the central mystery? Why did the player wake up with no memory?

---

## Side Quest Hooks

Side quests don't appear in the main flow above but can attach at specific points. Track them here so nothing is orphaned.

| Side Quest | Hooks onto | Gate | Notes |
|---|---|---|---|
| 002 Boar Ambush | anytime after Q001 | exploration >= 2, day >= 2 | class/race modifier push |
| 003 Silver Lake | after Q001 | exploration >= 3 | unlocks Silver Lake location |
| 005 Airship | after Q001 | exploration >= 5, day >= 6 | discovery flag for later? |
| 010-013 Find items | various | various skill levels | inventory flavor |
| 018 Silver Lake Reflection | after lake discovered | char level >= 10, race unset | **RACE LOCK** — main-quest-adjacent |
| 022 Warlord's Choice | daily flag | Sophie daily flag | moral dilemma, modifier push |
| (others) | ... | ... | ... |

---

## Conventions for Adding New Main Quests

1. **Pick a quest number.** Main quests don't need to be consecutive with side quests. You could reserve a range (e.g. 100-199) for main quest files, or just keep numbering sequentially.
2. **Write the skeleton first** in this document — purpose, enters-from, exits-to, branch role.
3. **Flesh out steps** using the notation above. Each step gets an id, narrator text, and choices with arrows.
4. **Mark branch and converge points** explicitly so the overall map stays legible.
5. **Implement in code** last, once the plain-speak version reads well. The step ids in this doc should match the ids in the `.ts` file.
6. **Update the Quest Map** (bird's-eye view at the top) whenever a new quest is added.
