# No Stranger Game — Core Code Line-by-Line Annotations

This companion file is for beginner-friendly code reading.

It does **not** rewrite the code. It explains what each section is doing in plain language, in roughly line-by-line order.

---

## 1) `src/components/rpg/RPGInterface.tsx` (the control tower)

### Imports and type setup (`1-50`)

- `1-18`: Imports React hooks and all gameplay/network hooks used by this screen.
- `19-47`: Imports UI pieces (`Avatar`, overlays, views) and RPG helper functions.
- `49`: Defines `ActiveView` as one of `'play' | 'chapter' | 'map' | 'profile' | 'settings'`.

### Local state (`51-69`)

- `52-54`: Pulls current user + Nostr connection + toast utility.
- `55`: `character` is the local saved RPG player state.
- `56`: `screen` toggles between character creation and home.
- `57`: `activeView` controls bottom-nav target.
- `58-69`: Small UI states (name input, chapter reveal animation, settings overlays, sync warnings, stuck-recovery prompt, etc.).

### Hook data sources (`70-80`)

- `70-79`: Starts all game subsystems:
  - network presence
  - echoes/social flavor
  - proof chain
  - relay regions
  - autonomous idle simulation
  - dead-letter and echo-chamber systems

### Boot from storage (`81-92`)

- `82`: Loads character from `localStorage`.
- `84-86`: If save looks legacy/broken, turns on recovery UI.
- `87-89`: If valid save exists, enter home.
- `91`: If no save, go to creation.

### Legacy repair flow (`94-122`)

- `94`: `repairCharacter()` handles old saves that got stuck.
- `97-105`: Scans localStorage and removes old chapter-proof keys for this character/pubkey.
- `109-118`: Rebuilds a safe baseline character object (keeps identity, resets progression fields safely).
- `119-121`: Saves repaired character and exits recovery modal.

### Policy + welcome gates (`124-133`)

- `125`: Loads tier-3 policy flags from storage.
- `129-132`: Shows first-world welcome once first chapter is complete and not yet dismissed.

### Proof-chain relay sync (`134-144`)

- `136`: Computes today's UTC chapter window id.
- `137-140`: Queries proof events for this user and window.
- `141-142`: Resolves canonical event and logs telemetry.
- `143`: Sync failures are soft-handled (UI warning only).

### Merge autonomous relay state into local character (`146-179`)

- `147-148`: Waits until character + autonomous state + relay load are ready.
- `149-161`: Builds merged character from autonomous state values (gold, health, location, traits, injuries, logs, etc.).
- `162-163`: Saves merged result locally.
- `165-178`: Publishes autonomous snapshot kind `30315` to presence relays (if user signer exists).

### Tick triggers (`181-192`)

- `181-184`: Runs one tick when character loads.
- `186-192`: Runs tick every 60 seconds while character exists.

### Active chapter and quest-bunch resolution (`194-208`)

- `194`: Picks active chapter from completed chapter ids.
- `198`: Rehydrates pending quest answers for this chapter, or creates empty pending object.
- `199-200`: Finds current unanswered question.
- `201-204`: Computes whether chapter is already sealed or still unread.
- `206-207`: Computes convergence/scrying info for social + map hints.

### Sync failure helper (`209-212`)

- Sets a temporary warning flag for 10 seconds.

### New game reset (`214-220`)

- Clears local character and resets local UI state to creation defaults.

### Character creation (`222-271`)

- `223`: Cleans entered name, fallback `"Nameless Stranger"`.
- `224`: Encodes logged-in pubkey to `npub`.
- `225-243`: Builds initial MVP character object with defaults.
- `244-250`: Saves character, navigates into home/chapter, resets reveal state.
- `252-270`: If signed in, publishes initial kind `30000` presence event.

### Main quest choice handler (`273-390`) — most important block

- `274`: Haptic feedback on choice.
- `276-279`: Updates pending answers for current chapter and saves immediately.
- `280`: If not all steps answered yet, exit early.

When final answer arrives:

- `282`: Fetches chapter window id (daily canonical window).
- `283`: Builds identity key using `character.id + createdAt + activeQuestId` (this is the bugfix that scopes proof per chapter).
- `284-285`: Derives final choice from final question.
- `286-290`: Counts A/B/C/D/E distribution for narrative consequence flavor.
- `291`: Computes deterministic identity package (race/profession/class/hook) from answer pattern + seed.
- `292-293`: Defines chapter-one constrained archetype/profession reveal.
- `294`: Checks chapter-one special behavior.
- `295-303`: Builds consequence text line.

Character progression update:

- `305-317`: Appends main quest choice, updates level/identity, discovers location, marks chapter/window complete, clears pending bunch.
- `319-320`: Save and set state.
- `321`: Marks local canonical choice for this chapter window.
- `322-328`: Starts reveal animation payload.
- `329`: Keeps chapter opened for reveal sequence.

Network publication:

- `331-363`: Signs + publishes refreshed presence event with chapter/identity data.
- `365-382`: Signs + publishes chapter proof event (`kind 7673`) with tags: chapter/window/choice/prev.
- `379-381`: Stores new proof head id locally for chain continuity.

Post-reveal UI return:

- `385-389`: After 12 seconds, return to normal play view.

### Unauthenticated landing screen (`392-437`)

- Shows login CTA and Nostr onboarding instructions.

### Character creation screen render (`439-467`)

- Input for character name + submit button (`handleCreateStranger`).

### Runtime computed labels (`471-481`)

- Human-readable location, profile snippet, fixed region title, estimated XP/gold rates, active activity label, social accomplishment lines.

### Stuck recovery render (`483-502`)

- Modal-like full-screen pane with:
  - `Repair Character`
  - `Hard Reset`

### Chapter-lock render branch (`504-556`)

- If main chapter is active/unread, app forces chapter UI.
- Includes fixed settings button, `ChapterView`, and persistent bottom nav.

### Normal app render branch (`558-714`)

- `play` view: compact dashboard + companion intent buttons.
- `map` view: `TerritoryView` with explore callback and persistence.
- `profile` view: `SelfView` with editable public card.
- `settings` view: currently only `"Create new character"`.
- `WorldWelcome` modal once post-first-chapter.
- Social accomplishments footer card.
- Overlay mounts for dead letter and echo chamber.
- Persistent bottom nav.

---

## 2) `src/hooks/useAutonomousState.ts` (idle-state orchestrator)

### Constants and helpers (`13-60`)

- `13-16`: Internal trait pool.
- `18-25`: `hashString` for deterministic pseudo-random selection.
- `27-36`: `deterministicHiddenTraits` picks hidden traits based on stable character seed.
- `38-49`: `defaultAutonomousState` maps character fields into simulation state shape.
- `51-60`: `parseSnapshot` safely parses relay snapshot content.

### Hook body (`62-130`)

- `63-67`: State holders for autonomous state, ticking flag, and relay-loaded flag.
- `68-74`: When character changes, initialize state from local defaults.
- `76-98`: Query relay for latest autonomous snapshot (`kind 30315`) for this character; if found, hydrate state.
- `100`: Computes today's UTC tick id.
- `102-115`: `runTick()` executes only if this tick wasn’t simulated yet.
- `117-120`: `queueExploreIntent()` stages intent for next simulation.
- `122-129`: Returns state + controls to the caller.

---

## 3) `src/lib/rpg/autonomousSimulation.ts` (deterministic daily simulation)

### Types and constants (`7-33`)

- `7`: Snapshot event kind constant `30315`.
- `9-20`: AutonomousState shape.
- `22-32`: Input/output types for simulation function.

### Trait reveal helper (`34-47`)

- 15% reveal chance for role-relevant trait if it is still hidden.

### Tick helpers (`49-60`)

- `getCurrentUtcTickId`: daily UTC id string.
- `shouldSimulateTick`: true if today hasn’t been simulated.

### `simulateAutonomousDay` (`62-163`)

- `68-75`: Seeded RNG with character/tick/location/profession/recent choices/explore-intent.
- `77-84`: Resolves economy + weighted role table (trait/profession influence gives some roles more chance).
- `85-93`: Computes income/upkeep and daily delta.
- `94-104`: Applies health change from daily net outcome.
- `98-101`: Low-health chance to add injury.
- `106-110`: Chance for injuries to heal over time.
- `112-117`: Maybe reveal one hidden trait.
- `119`: Creates public narrative log line.
- `121-129`: Optional movement to adjacent location based on explore intent.
- `131-140`: Builds list of daily private log lines.
- `142-146`: Special quest completion check for `"Collect 15 Pristine Pelts"` grants `"Perfect Shot"`.
- `148-160`: Builds next state (gold/health/profession/traits/location/injuries/tick/logs/exploreIntent reset).
- `162`: Returns new state + public line.

---

## 4) `src/lib/rpg/chapterCatalog.ts` (quest content source)

- `1-18`: Core chapter and question interfaces.
- `20-23`: Stable chapter ids.
- `24-77`: Full chapter catalog:
  - chapter metadata (`id`, `title`, `chapterLines`)
  - `questBunch` question list with options.
- `79-80`: `getNextChapter` returns first uncompleted chapter.
- `82-83`: `getActiveChapter` currently same as next chapter resolver.

How to edit content safely:

1. Add/edit chapter text and question prompts in this file.
2. Keep `questionId` unique and stable.
3. Don’t change old IDs after players started, unless you plan migration.

---

## 5) `src/lib/rpg/utils.ts` (core types + persistence + identity generation)

### Models (`10-75`)

- Defines `MVPCharacter`, quest answer types, and `NetworkPresenceMember`.

### Identity weighted logic (`77-199`)

- `77-79`: Builds option arrays from catalogs.
- `81-88`: Maps answer letter to stride value.
- `90-151`: Builds weighted maps for race/class/profession from answer patterns.
- `153-162`: Generic weighted picker.
- `171-199`: `computeQuestBunchIdentity` returns deterministic `race`, `profession`, `className`, and story `hook`.

### Legacy/stability helpers (`201-226`)

- `201-206`: `isCharacterLikelyStuck`.
- `208-212`: merges follow/follower pubkeys.
- `214-226`: display name fallback logic.

### Storage (`228-311`)

- `228-234`: save to localStorage.
- `236-303`: load + normalize + coerce legacy values safely.
- `305-311`: clear storage key.

---

## 6) `src/components/rpg/ChapterView.tsx` (chapter + question UI)

- `11-27`: Props contract (what parent must pass).
- `46-48`: local state for narrative timing.
- `49-57`: sets when narrative is complete based on timed delays.
- `59-69`: progressively reveals chapter lines over time.
- `73-92`: unopened state (“Crack the wax seal”).
- `94-106`: line-by-line chapter text rendering.
- `108-126`: identity/consequence reveal phase UI.
- `128-132`: optional flavor line.
- `134-152`: sealed chapter state summary + dead-letter button.
- `154-181`: current question + options once narrative phase is complete.
- `183-187`: interim hint text before question unlock.

---

## 7) `src/components/rpg/TerritoryView.tsx` (map + location actions)

- `11-30`: region/location definitions.
- `32-39`: action menu by location id.
- `42-44`: known/glimmer sets and selected location state.
- `46-51`: action unlock rules (trait-level-based additions).
- `60-91`: renders visible locations grouped by region.
- `67-70`: computes known-state and “New” badge if quest action exists.
- `93-110`: renders action list for selected location.
- `102`: clicking action calls `onExplore` with intent string.

---

## 8) `src/components/rpg/SelfView.tsx` (profile/character sheet)

- `5-10`: props.
- `18-22`: computed display values (trait counts, xp).
- `25-27`: character identity and public flavor fields.
- `29-37`: core stats card.
- `39-44`: traits/injuries card.
- `46-51`: story/proof card.
- `53-69`: editable public card (`profileTitle`, `profileBio`).

---

## 9) `src/hooks/useNetworkPresence.ts` (social world census)

- `6-9`: limits + relay list.
- `10-33`: data shapes.
- `35-48`: metadata parsing helper.

Main query flow (`50-202`):

1. Query global opted-in presence count (`30000`, `#d=opt-in`).
2. Query your follows (`kind 3` authored by you).
3. Query your followers (`kind 3` with `#p` your pubkey).
4. Merge follow graph to network pubkeys.
5. Check whether your own presence event exists.
6. Query network members’ opt-in presence events.
7. Query metadata (`kind 0`) for display names/pictures.
8. Parse latest presence payload per pubkey.
9. Return `topMembers` plus diagnostics counts.

---

## 10) `src/lib/rpg/proof.ts` (chapter canonical proof helpers)

- `1`: chapter proof kind constant `7673`.
- `3-12`: payload shape.
- `14-20`: event shape.
- `22-28`: UTC window id generator (`season-3-YYYY-MM-DD`).
- `30-31`: local storage key format function.
- `33-39`: local canonical existence check.
- `41-47`: local canonical marker.
- `49-50`: helper to read `window` tag.
- `52-67`: resolves canonical proof event by sorting earliest in-window event, then stores its id locally.

---

## Beginner Reading Path (from this point)

If you want to really understand flow, read in this exact order:

1. `RPGInterface.tsx`
2. `chapterCatalog.ts`
3. `ChapterView.tsx`
4. `utils.ts`
5. `useAutonomousState.ts`
6. `autonomousSimulation.ts`
7. `TerritoryView.tsx`
8. `SelfView.tsx`
9. `useNetworkPresence.ts`
10. `proof.ts`

---

## How to use this file while learning

- Keep this doc open on one side and the real code on the other.
- Read one block (10-40 lines), then run the app and click only that feature.
- Ask “what state changed?” after each click; track localStorage + React state.
- When confused, trace from `RPGInterface` downward via props.

If you want, next I can produce a **true line-by-line literal commentary** for just one file at a time (starting with `RPGInterface.tsx`), where every single line gets a one-sentence note.
