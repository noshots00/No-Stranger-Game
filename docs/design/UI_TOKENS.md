# UI tokens — No Stranger Game (RPG shell)

Canonical design brief and token reference for the in-game UI. Code mirrors this doc in `src/index.css` (`--rpg-*`, `.rpg-*`) and [`src/components/rpg/typography/rpgUiTypography.ts`](../../src/components/rpg/typography/rpgUiTypography.ts).

## Emotional target

**Peak Boutique old-school RPG (phone portrait):** Folktale fantasy content in a **menu-driven, panel-based** shell—curated warmth (candle palette, art, facsimile scroll), **dense and thumb-first**, designed for ~430px portrait—not a desktop layout squeezed, and not a visual novel reader.

## Anti-goals (do not ship)

| Visual novel habit | Use instead |
|--------------------|-------------|
| Full-width 16px+ serif prose stream | Compact **log lines** (11px sans) |
| Cormorant prompt boxes with left accent bars | **Panel header** (12px sans semibold) inside `.rpg-panel` |
| Choices as long underlined sentences | **Command chips** (`.rpg-command-chip`) in a 2–3 column grid |
| Right-rail “chat fiction” width for all play text | Full-width log; chips in grid |
| Serif/Cormorant on every label | **Inter** for UI; Cormorant only on `.rpg-display` |

## Phone portrait rules

1. One primary column (max ~430px).
2. Primary actions in lower half; header stays compact.
3. **Fixed bands** on quest scene (stage / text / commands)—do not let dialogue height push art.
4. Scroll only for **history**; commands and titles should scan without scrolling when possible.
5. Touch floor: `--rpg-command-min-h` (36px) for location commands.

## Color (v1)

Keep existing candle / facsimile variables in [`src/index.css`](../../src/index.css). No palette rewrite in v1.

| Token | Role |
|-------|------|
| `--candle-void` / `--candle-hearth` | Background |
| `--candle-ink` / `-soft` / `-faint` | Text hierarchy |
| `--candle-flame` / `-soft` | Accent, command hover |
| `--candle-wax` | Player line / highlights |
| `--candle-rule` | Borders (panels, chips) |

## Type scale (fixed px — not `rem` from `html { 118% }`)

| Role | px | Face | Tailwind / class |
|------|-----|------|------------------|
| caption | 9 | Inter | `RPG_UI_CAPTION` |
| ui | 10 | Inter | `RPG_UI_UI` |
| body | 11 | Inter | `RPG_UI_BODY`, `.rpg-log-line` |
| emphasis | 12 | Inter semibold | `RPG_UI_EMPHASIS` |
| display | 14–15 | Cormorant | `RPG_UI_DISPLAY`, `.rpg-display` |
| command | 10–11 | Inter | `RPG_COMMAND_CHIP`, `RPG_COMMAND_CONTINUE` |

**Fonts:** Inter Variable (`font-sans`) for UI; Cormorant (`font-cormorant` / `.rpg-display`) for rare titles only.

## Layout tokens

| Token | Value | Use |
|-------|-------|-----|
| `--rpg-panel-border` | `var(--candle-rule)` | Menu windows |
| `--rpg-panel-bg` | `rgba(0,0,0,0.45)` | Dialogue / action panels |
| `--rpg-command-min-h` | `36px` | Location command buttons |
| Command grid | 3 columns; 2 below 320px | Quest scene, journal location actions |

## Components

### `.rpg-panel`

RPG menu window: border + dark fill + subtle inset highlight. Use on quest text/action boxes, compact report shells on Play.

### `.rpg-command-chip`

Canonical choice / command control (replaces VN `.choice-line` on Tier A). Emerald command text, rounded border, compact padding. Quest scene grid items use this class.

### `.rpg-log-line`

Journal and play narrator body: 11px sans, tight leading, no italic novel styling.

### `.rpg-display`

Cormorant one-liner for quest card title overlay (and optional display-only titles).

### Quest scene combat (Tier A)

In-quest battles reuse the same three-row quest scene grid; add `.quest-scene-root--combat` on the root for chrome swap (no layout reflow).

| Class | Role |
|-------|------|
| `.quest-scene-root--combat` | Enables red stage vignette + hostile portrait frame |
| `.rpg-combat-hp-track` / `.rpg-combat-hp-fill--player` / `--enemy` | Thin HP bars in the action band |
| `.rpg-combat-log` | Combat transcript band (`aria-live="polite"`) |
| `.rpg-command-chip--danger` | Hostile command (e.g. Attack!) |

Code: [`src/components/rpg/combat/`](../../src/components/rpg/combat/) (`QuestSceneCombat`, `useCombatEncounter`, `combatEncounters`).

## Surface inventory

### Tier A (this spec)

| Surface | Files |
|---------|--------|
| Quest scene | `quest-scene/QuestSceneScreen.tsx`, `QuestSceneNpcTalk.tsx`, `combat/QuestSceneCombat.tsx`, `rpgArtAssignments.ts` |
| Journal + play feed | `journal/JournalScreen.tsx`, `journal/QuestCardHeader.tsx`, `DialogueVoiceBlock.tsx` |
| Character | `tabs/CharacterTab.tsx`, `tabs/characterSheetTypography.ts` |
| Shell | `GameHeader.tsx`, `RPGInterface.tsx` (nav already compact) |

### Tier B (follow-up)

Apply `.rpg-command-chip` + sans body; do not expand scope without a pass plan:

- `npc/NpcTalkDialog.tsx`, `.choice-line.npc-dialog-choice`
- `tabs/QuestPopup.tsx`
- Village: `market/`, `tavern/`, `guild/`, `arena/`, `mayorsHut/`, etc.
- `TitleScreen.tsx`, login chrome

## Migration

- **Prefer** `.rpg-command-chip` + `rpgUiTypography` on Play and quest scene.
- **Keep** global `.choice-line` for Tier B until swept; do not grow new `.choice-line` usages on Tier A.

## Success check (manual, phone)

- Quest scene: ~6 short choices in ~3 rows; dialogue smaller than old VN prompt.
- Journal: log reads as ticker, not novel; location actions match quest chips.
- Character: status-screen density, sans labels, mono stat numbers.
- Chronicle presentation may stay slightly more “facsimile” than Play—intentional.
