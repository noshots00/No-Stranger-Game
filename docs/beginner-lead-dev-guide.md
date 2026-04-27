# No Stranger Game Beginner Lead Dev Guide

This guide is for you as the lead dev who is learning the codebase from scratch.
It explains:

1. What each directory is for (and what is deploy-critical vs helper-only)
2. How the game works end-to-end
3. The fastest reading order to understand the system
4. How to safely add quests, features, and systems moving forward

---

## 1) Directory Map (What everything is)

### Top level

- `src/`  
  The real app code. This is the most important folder.

- `public/`  
  Static files copied directly into production build (icons, manifest, etc).

- `docs/`  
  Design and protocol specs for game mechanics. Human reference docs.

- `.github/`  
  GitHub workflows/templates. Dev process support.

- `.vscode/`  
  Editor settings for local development convenience.

- `.cursor/`  
  Cursor IDE metadata/rules/plans. **Not part of runtime app code** and not bundled into production build.

- `.agents/`  
  Agent skill definitions for AI tooling. Not needed by the game runtime.

- `.nsite/`  
  Project/platform-specific config helper files.

- `eslint-rules/`  
  Linting rules and docs for code quality.

- `index.html`  
  HTML shell that hosts the React app.

- `package.json`  
  Scripts + dependencies. Tells you how to run/test/build.

- `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `eslint.config.js`  
  Build/type/style/lint tool configuration.

- `NIP.md`  
  Custom Nostr protocol documentation for your game events.

- `AGENTS.md`  
  AI project rules/instructions. Helpful for AI-assisted work, not runtime.

---

## 2) What is required for the game to run

For runtime behavior, these are the critical pieces:

- `src/main.tsx`  
  Browser entrypoint. Mounts React app.

- `src/App.tsx`  
  App providers (Nostr, Query, contexts, toaster, etc).

- `src/AppRouter.tsx`  
  Route table. `/` and `/game` go to RPG UI.

- `src/components/rpg/RPGInterface.tsx`  
  Main game orchestrator (views, state transitions, chapter flow, idle integration).

- `src/lib/rpg/*`  
  Core game logic/data: chapters, simulation, identity generation, economy, proofs.

- `src/hooks/*`  
  Data/state hooks (Nostr, autonomous state, social/network presence, etc).

- `src/components/rpg/*`  
  Major game screens and UI sections.

Everything else is either:
- shared UI component infrastructure (`src/components/ui/*`)
- optional systems/features (DM, comments, zap, wallet)
- tests/dev tooling.

---

## 3) Runtime architecture in plain English

### App boot flow

1. `main.tsx` mounts `App`
2. `App.tsx` wraps app in providers:
   - React Query
   - Nostr login/provider
   - app config/provider
   - DM provider, NWC provider, tooltip/toaster
3. `AppRouter.tsx` routes to `RPGInterface`

### Game flow (high level)

`RPGInterface.tsx` controls:

- login and character creation
- loading/saving local character (`utils.ts`)
- selecting active chapter (`chapterCatalog.ts`)
- chapter question handling + proof publish (`proof.ts`)
- autonomous idle simulation (`useAutonomousState.ts` + `autonomousSimulation.ts`)
- surface views (Play, Profile, Map, Chapter, Settings)
- Nostr social surfaces (network presence, world snippets)

### Data model and persistence

- Local primary state: `MVPCharacter` in localStorage (`utils.ts`)
- Nostr state:
  - presence events kind `30000`
  - chapter proof events kind `7673`
  - autonomous snapshots kind `30315`

---

## 4) Fastest reading order (for a beginner)

Read in this exact order:

1. `package.json`  
   Learn scripts: `dev`, `build`, `test`.

2. `src/main.tsx`  
   See app entrypoint.

3. `src/App.tsx`  
   Understand providers and app plumbing.

4. `src/AppRouter.tsx`  
   Understand routes and what screen loads.

5. `src/components/rpg/RPGInterface.tsx`  
   The control tower. Read this slowly and fully.

6. `src/lib/rpg/utils.ts`  
   Character data shape (`MVPCharacter`) + save/load + identity result.

7. `src/lib/rpg/chapterCatalog.ts`  
   Quest/chapter content source of truth.

8. `src/components/rpg/ChapterView.tsx`  
   How chapter scenes/questions are shown.

9. `src/hooks/useAutonomousState.ts`  
   How idle state is loaded, ticked, and updated.

10. `src/lib/rpg/autonomousSimulation.ts`  
    The deterministic idle engine.

11. `src/lib/rpg/economyModel.ts`  
    Job tables, location economy, movement graph.

12. `src/components/rpg/TerritoryView.tsx` + `SelfView.tsx`  
    Map and profile surfaces.

13. `src/hooks/useNetworkPresence.ts`  
    Social/world census + nearby player snippets.

Then skim docs:
- `docs/game-thesis-and-constitution.md`
- `docs/idle-rpg-status-and-personality-reference.md`
- `NIP.md`

---

## 5) “What is game code” vs “what helps me code”

### Game code (player-facing runtime)

- `src/components/rpg/*`
- `src/lib/rpg/*`
- `src/hooks/useAutonomousState.ts`
- `src/hooks/useNetworkPresence.ts`
- `src/App.tsx`, `src/AppRouter.tsx`, `src/main.tsx`
- `public/*` (icons/manifest/static)

### Helper/dev-only (not game logic)

- `.cursor/`, `.agents/`, `.vscode/`
- `eslint-rules/`
- CI/workflow files in `.github/`
- style/build/tool configs

You are correct: `.cursor` is tooling metadata, not a gameplay runtime folder.

---

## 6) How to add new quests (practical)

### Where to edit

- Add or modify chapter content in `src/lib/rpg/chapterCatalog.ts`.

### Rules to follow

- Each chapter needs a unique `id`.
- Each step needs unique `questionId`.
- `options` can be `A/B/C/D/E` or any string.
- Keep option identifiers stable once deployed (so old proofs remain interpretable).

### Mental model

- `chapterCatalog.ts` defines “what can happen”
- `RPGInterface.tsx` decides “when it happens”
- `ChapterView.tsx` handles “how it looks/feels”

---

## 7) How to add a new feature/system

Use this pattern:

1. **Define data** in `src/lib/rpg/` (types + pure logic)
2. **Create hook** in `src/hooks/` if it needs state/querying/publishing
3. **Render in UI** under `src/components/rpg/`
4. **Wire in orchestrator** (`RPGInterface.tsx`)
5. **Persist carefully**:
   - local `MVPCharacter` if core character state
   - Nostr event if cross-device/shareable/attestable
6. **Update docs**:
   - `NIP.md` if event schema changes
   - `docs/*` mechanic spec if behavior changes

---

## 8) How to think about this game as lead dev

Your north star:

- **Mystery over exposition**  
  Hide full systems, reveal consequence through play.

- **Irreversible choices matter**  
  Quest choices should feel like sealed memory, not menu spam.

- **Idle world is canon**  
  Character lives between sessions. Return should always feel meaningful.

- **Social is wonder, not pressure**  
  Let players glimpse others’ accomplishments without forcing engagement.

When choosing between two implementations, ask:

1. Does this preserve emotional weight?
2. Does this increase clarity on mobile?
3. Does this keep state deterministic and debuggable?
4. Does this avoid leaking too much system internals?

If yes to all four, it is likely the right direction.

---

## 9) Suggested “next coding tasks” for you (hands-on)

Start with these beginner-friendly edits:

1. Add one new chapter in `chapterCatalog.ts`
2. Add one new map location + 2 actions in `TerritoryView.tsx`
3. Add one new narrative template line in `narrativeTemplates.ts`
4. Add one new visible trait reveal condition in `autonomousSimulation.ts`

These four tasks will teach you most of the game’s content pipeline.

---

## 10) Testing checklist when you change gameplay

After any gameplay change:

1. New character creation works
2. Chapter flow reaches completion
3. No chapter loop regressions
4. Profile shows expected tracked fields
5. Map actions trigger expected explore intent
6. Idle tick updates health/gold/logs
7. No lints/type errors

If any fail, debug from `RPGInterface.tsx` first, then the specific lib/hook.

