# Features

A running inventory of every feature in No Stranger Game. One section per feature: short bullets and cross-links — design intent for narrative tone lives in linked docs.

## Quests

- Branching, choice-driven scenes; each quest is a TypeScript module.
- Engine: [src/components/rpg/quests/engine.ts](../../src/components/rpg/quests/engine.ts).
- Registry: [src/components/rpg/quests/registry.ts](../../src/components/rpg/quests/registry.ts).
- Template: [src/components/rpg/quests/branching-quest-template.ts](../../src/components/rpg/quests/branching-quest-template.ts).

### Quest gating and pacing

- Per-quest `availability` (level, day, flags, completed-quests, race-lock state, location).
- **Daily unveil cap**: at most 2 **new** quests are revealed per in-game day. Eligible-but-not-yet-shown quests sit in a hidden queue and drain 2/day, **highest quest id number first** (see `questNumberFromId` sort).
- Visibility: `getPlayerVisibleQuests` in [engine.ts](../../src/components/rpg/quests/engine.ts); day context from [`getQuestContext`](../../src/components/rpg/quests/engine.ts).
- **Daily rollover bundle** (same tick as daily XP in [RPGInterface.tsx](../../src/components/rpg/RPGInterface.tsx)): probabilistic daily flags, unveil queue drain, world line “Day N began.”, end-of-day **Day Report** dialogue block (`buildDayReportDialogueLines` in [helpers.ts](../../src/components/rpg/helpers.ts)).

## Day cycle and Eastern pacing

- **Canonical anchor**: immutable Eastern calendar date (`yyyy-MM-dd`, `America/New_York`) set when the player submits their name on the origin quest (`characterCreationDateEastern` on [QuestState](../../src/components/rpg/quests/types.ts)).
- **Day index** (“Day N” in the header): [`computeGameDayCounterFromCreationYmd`](../../src/lib/easternGameTime.ts) — calendar days from creation through “today” in Eastern + 1 (not raw wall-clock ms divided by 24h).
- **Hook**: [`useDayCounter`](../../src/components/rpg/hooks/useDayCounter.ts) merges quest state, relay (kind **10031** character-start), and **per-pubkey** localStorage (`characterCreationDateStorageKeyForPubkey` in [constants.ts](../../src/components/rpg/constants.ts)) — logged-in users do **not** read the legacy global creation key (cross-account safety).
- **Next reset**: `nextDayResetMs` / Eastern midnight (or dev **5-minute** periods when enabled).
- **Daily XP catch-up**: runs only after [`isPacingResolved`](../../src/components/rpg/hooks/useDayCounter.ts) and only when hook `creationDateEastern` matches `questState.characterCreationDateEastern` (or both null before naming). Updates `lastDailyXpDay`, skills, flags, unveils, dialogue report lines.
- **First session**: on origin name submit, `lastDailyXpDay` is set with the same day formula so players do not get a synthetic “yesterday” report immediately after naming.
- **Hydration gate**: full RPG chrome waits until quest state is hydrated **and** pacing is resolved (“Loading your ledger…” in [RPGInterface.tsx](../../src/components/rpg/RPGInterface.tsx)).

## Skills and XP

- Three skill XP pools on quest state: `explorationXp`, `foragingXp`, `meleeAttackXp`.
- Level curve: `getLevelFromXp` / `getCharacterLevel` in [engine.ts](../../src/components/rpg/quests/engine.ts).
- Daily XP distribution across skills: [skills-config.ts](../../src/components/rpg/quests/skills-config.ts).
- Legacy aggregate `experience` field kept for migration only.
- See also: [SKILLS.md](./SKILLS.md).

## Race lock

- Players accrue `race:*` modifier points across quests; dominant race is assigned at **Silver Lake reflection** ([quest-018-silver-lake-reflection.ts](../../src/components/rpg/quests/quest-018-silver-lake-reflection.ts)) via `assignRaceFromRaceModifiers`.
- One-shot stat/trait flavor applied on lock; `assignedRaceSlug` stored on state.
- Milestone dialogue uses Day Report voice (“The lake answers”) plus world/event copy; see [dialogueFormat.ts](../../src/components/rpg/dialogueFormat.ts) and race apply path in [engine.ts](../../src/components/rpg/quests/engine.ts).
- Canonical races: [docs/RACES.md](../RACES.md). Narrative: [RACES_DESIGN.md](./RACES_DESIGN.md).

## Class lock (archetypes)

- Five archetypes (Warrior, Mage, Rogue, Healer, Ranger) tracked as `class:<slug>` modifiers (legacy `*Class` keys canonicalize in [canonical.ts](../../src/components/rpg/modifiers/canonical.ts)).
- When any track reaches **5** points, the character **locks** to that archetype (`lockedClassSlug`); further incoming deltas to other `class:*` keys are ignored.
- Logic and tie-break: [classArchetype.ts](../../src/components/rpg/classArchetype.ts).
- Milestone: Day Report-style block titled **Path secured** plus world line (“… is a \<Class\>!”).
- Canonical list: [docs/CLASSES.md](../CLASSES.md). Narrative: [CLASSES_DESIGN.md](./CLASSES_DESIGN.md).

## Modifiers

- Traits, characteristics, blessings, coins/items, skills, and organic keys beyond race/class.
- See [MODIFIERS.md](./MODIFIERS.md) and [.agents/docs/character-modifiers.md](../../.agents/docs/character-modifiers.md).

## Persistence and Nostr sync

- **Quest checkpoints**: kind **10032**, d-tag `quest-state`, JSON payload with `savedAtMs` + full [`QuestState`](../../src/components/rpg/quests/types.ts). Publish/read in [gameProfile.ts](../../src/components/rpg/gameProfile.ts).
- **Character creation anchor**: kind **10031**, `creationDateEastern` for relay discovery and repair.
- **Local fallback**: `QUEST_STATE_STORAGE_KEY:${pubkey}` in [useQuestState.ts](../../src/components/rpg/hooks/useQuestState.ts); load relay first, then localStorage; persist on change when hydrated.
- **Reset story** (game menu): clears creation-date keys (scoped + legacy global), clears pending relay-ignore flag when appropriate, resets to [`createInitialQuestState`](../../src/components/rpg/quests/engine.ts), republishes checkpoint — see `resetQuestStateAndSync` + `handleResetStory` in [RPGInterface.tsx](../../src/components/rpg/RPGInterface.tsx).

## Shell UI (tabs)

- **Character**: sheet (stats, modifiers, portrait by race), chronicle entry point.
- **Quests**: available/completed lists, track quest.
- **Play**: branching dialogue, choices, location actions (Silver Lake scenes map to quests via [constants.ts](../../src/components/rpg/constants.ts) `SILVER_LAKE_SCENE_ACTION_QUEST`).
- **Map**: locations gated by flags (e.g. Silver Lake, airship).
- **Social**: strangers/kindred counts, activity feed, global lobby chat — see below.

### First session and gameflow

- **Goal**: Teach through **UI affordance**, not a heavy tutorial: players must recognize when **story beats** end and **their turn** (choices, naming, character creation) begins.
- **Play column**: Distinct treatment for the **choice / input block** below the scrollback (vs narrator lines); optional scroll/focus toward new choices when they appear ([PlayTab.tsx](../../src/components/rpg/tabs/PlayTab.tsx)).
- **Hints**: Short UI-only notes use the same sky/dev-message styling as `Dev Message` lines ([DialogueVoiceBlock.tsx](../../src/components/rpg/DialogueVoiceBlock.tsx)), so guidance reads as interface copy, not narrator voice.
- **Duplicate opening guard**: Appending a quest’s opening image + first narrator line is skipped when that pair already appears at the end of the dialogue log (`dialogueHasQuestOpeningAtEnd` in [dialogueFormat.ts](../../src/components/rpg/dialogueFormat.ts)) — avoids doubled Day 1 forest beat when the empty-log seed and “track quest” both run.
- **Character sheet**: Skills are listed only once any skill reaches **level 1**; the quest-items row appears only when `questItems` is non-empty ([CharacterTab.tsx](../../src/components/rpg/tabs/CharacterTab.tsx)).

## Chat (NIP-29)

- Global lobby on Social tab; optional per-location rooms from Play (see [src/components/rpg/chat/](../../src/components/rpg/chat/)).
- Hosted on a dedicated chat relay so traffic does not spam the user’s normal nostr feed.
- Membership: non-empty `playerName` (character named).

## Social signals and activity

- Strangers / Kindred counts and kindred “signals” from peer checkpoints.
- **Activity** rows: latest checkpoint per author; if `assignedRaceSlug` is set, shows lake-return summary with level, race display name, and class label — [useSocialQueries.ts](../../src/components/rpg/hooks/useSocialQueries.ts), [SocialTab.tsx](../../src/components/rpg/tabs/SocialTab.tsx).

## Status strip (game header)

- Health (`QuestState.health`), wall clock (time only), countdown to next day reset, ambient mute — unified in [GameHeader.tsx](../../src/components/rpg/GameHeader.tsx) for all tabs.

## Ambient audio

- Ambient pad / optional MP3 (`public/music/silver-lake.mp3` when present) via [useAmbientPad.ts](../../src/components/rpg/audio/useAmbientPad.ts) whenever the game shell is ready (`canShowGame`).
- Mute persists (`nsg:audio-muted`).

## Chronicle

- Merges dialogue + world events for reading in a modal.
- [ChronicleDialog.tsx](../../src/components/rpg/ChronicleDialog.tsx), grouping in [dialogueFormat.ts](../../src/components/rpg/dialogueFormat.ts).

## Developer / debug tools (Vite dev only)

- Exposed from [GameHeader.tsx](../../src/components/rpg/GameHeader.tsx) game menu when `import.meta.env.DEV`:
  - **Advance 24 hours** — shifts dev virtual clock (`devDayOffsetMs`).
  - **5-minute game days** — Eastern pacing uses 5-minute slots instead of calendar days ([easternGameTime.ts](../../src/lib/easternGameTime.ts)).
  - **Rapid day simulation** — auto-advance virtual clock every 2s ([useDayCounter.ts](../../src/components/rpg/hooks/useDayCounter.ts)).
  - **Unlock all quests** — bypass availability for testing ([RPGInterface.tsx](../../src/components/rpg/RPGInterface.tsx)).
  - **Show modifier breakdown** — extra detail on Character tab.

## Guilds

- See [GUILDS.md](./GUILDS.md). Not implemented yet.

## Main Quest

- See [VISION.md](./VISION.md). Not implemented yet.
