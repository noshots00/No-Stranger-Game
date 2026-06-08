# UI tokens — No Stranger Game (RPG shell)

Canonical design brief and token reference for the in-game UI. Code mirrors this doc in `src/index.css` (`--rpg-*`, `.rpg-*`) and [`src/components/rpg/typography/rpgUiTypography.ts`](../../src/components/rpg/typography/rpgUiTypography.ts).

## Emotional target

**Peak Boutique old-school RPG (phone portrait):** Folktale fantasy content in a **menu-driven, panel-based** shell—curated warmth (candle palette, art, facsimile scroll), **readable and thumb-first**, designed for ~430px portrait—not a desktop layout squeezed, and not a visual novel reader.

## Anti-goals (do not ship)

| Visual novel habit | Use instead |
|--------------------|-------------|
| Full-width 16px+ serif prose stream | **Source Sans 3** log lines (17px) in `.rpg-panel` |
| Cormorant prompt boxes with left accent bars | **Panel prompt** (`RPG_UI_PROMPT`, 18px medium) |
| Choices as long underlined sentences | **Command chips** (`.rpg-command-chip`, 14px) in `.rpg-choice-grid` |
| Right-rail “chat fiction” width for all play text | Full-width log; chips spaced `space-evenly` |
| Serif/Cormorant on every label | **Source Sans 3** for UI; Cormorant only on `.rpg-display` / rare titles |

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

## Borders & focus (no blue chrome)

The global shadcn reset applies `border-border` to every element. **`.dark` uses warm HSL tokens** (not blue-gray 217°). `.candlelit-shell` / `.candlelit-chrome` tighten them further for in-game surfaces. Dev side rails use `.candlelit-chrome`.

### Do

| Pattern | Example |
|---------|---------|
| List / board background only | `rounded-md bg-black/20` — arena, tavern, blobbi fight board |
| Explicit candle border when needed | `border border-[var(--candle-rule)]` or `border-[var(--candle-rule)]/25` for a single seam |
| RPG commands | `.rpg-command-chip` / `RPG_COMMAND_CHIP` — not shadcn `Button variant="outline"` |
| Dev / relay mini actions | `.rpg-mini-btn` |
| Focus | `outline-[var(--candle-flame-soft)]` or inherit from chip styles |

### Do not

| Anti-pattern | Why |
|--------------|-----|
| `border-border`, bare `border` without a candle color | Inherits blue-gray |
| `Button variant="outline"` / `ring-ring` on in-game surfaces | Cool shadcn outline |
| Nested bordered cards per list row (`GamePanelExpandable` in a feed) | Reads as stacked blue boxes — use compact `<li>` rows (see `ArenaScreen` `TournamentRow`) |
| Extra outer border **and** inner bordered rows on the same list | One soft fill (`bg-black/20`) is enough |

**Reference lists:** [`ArenaScreen.tsx`](../../src/components/rpg/arena/ArenaScreen.tsx) tournament board, [`BlobbiFightingScreen.tsx`](../../src/components/rpg/blobbiFighting/BlobbiFightingScreen.tsx) fight board.

## Type scale (fixed px — not `rem` from `html { 118% }`)

| Role | px | Face | Tailwind / class |
|------|-----|------|------------------|
| caption | 12 | Source Sans 3 | `RPG_UI_CAPTION` |
| ui | 13 | Source Sans 3 | `RPG_UI_UI` |
| meta | 14 | Source Sans 3 | `RPG_UI_META` |
| body | 17 | Source Sans 3 | `RPG_UI_BODY`, `.rpg-log-line` |
| emphasis | 16 | Source Sans 3 medium | `RPG_UI_EMPHASIS` |
| prompt | 18 | Source Sans 3 medium | `RPG_UI_PROMPT` |
| display | 15 | Cormorant | `RPG_UI_DISPLAY`, `.rpg-display` |
| command | 14 | Source Sans 3 | `RPG_COMMAND_CHIP` |
| continue | 15 | Source Sans 3 | `RPG_COMMAND_CONTINUE` |

**Fonts:** Source Sans 3 (static 400/500 via `@fontsource/source-sans-3`) for all RPG UI; `font-sans` in Tailwind maps to the same stack. Cormorant (`font-cormorant` / `.rpg-display`) for rare titles only. `.candlelit-shell` uses subpixel-friendly smoothing (`-webkit-font-smoothing: auto`).

## Layout tokens

| Token | Value | Use |
|-------|-------|-----|
| `--rpg-panel-border` | `var(--candle-rule)` | Menu windows |
| `--rpg-panel-bg` | `rgba(0,0,0,0.45)` | Dialogue / action panels |
| `--rpg-command-min-h` | `36px` | Location command buttons |
| `.rpg-choice-grid` | flex, `space-evenly` | Quest scene, journal locations, inline quest popup |
| `.rpg-choice-stack` | flex column, full-width chips | NPC / merchant talk panes |

## Scrollbars (required on themed surfaces)

**Do not ship default OS scrollbars** on in-game panels, dev rails, dialogs, or any candlelit surface. They clash with the palette and read as “broken UI.”

| Class | When to use |
|-------|-------------|
| `.candlelit-scroll` | **Default** for any `overflow-y-auto` / `overflow-x-auto` region (dev rails, relay panel, modals, lists). |
| `.facsimile-scroll` | Play feed, journal, and other facsimile parchment columns (same thumb styling; may add layout-specific padding). |
| `@/components/ui/scroll-area` | Radix `ScrollArea` — themed by default via `.candlelit-scroll` on the root. |

**CSS variables** (defined in [`src/index.css`](../../src/index.css)):

| Variable | Default behavior |
|----------|------------------|
| `--facsimile-scrollbar-width` | `3px` track width |
| `--facsimile-scrollbar-thumb` | transparent until hover |
| `--facsimile-scrollbar-thumb-hover` | `var(--candle-flame-soft)` |
| `--facsimile-scrollbar-thumb-active` | flame mix at 62% |

**Agent rule:** when adding a scrollable container, add `candlelit-scroll` (or use `ScrollArea` / `GamePanelScroll` / `.facsimile-scroll` where those patterns already exist). Never leave bare `overflow-auto` on RPG chrome.

## Dev desktop rails (lg+)

| Side | Content |
|------|---------|
| Left | Developer tools (quest restart/test, play toggles, checkpoint restore, **Advance 24 hours**) |
| Right | Game relay status + activity log only |

## Components

### `.rpg-panel`

RPG menu window: border + dark fill. Quest scene text/action panels omit the inner seam (no bottom/top border between bands).

### `.rpg-command-chip`

Canonical choice / command control. Emerald ink, centered label in `<span class="rpg-command-chip-label">`. Width `max-content` in grids; full width in stacks.

### `.rpg-log-line`

Narrator / transcript body: 17px Source Sans 3, `letter-spacing: 0.012em`.

### `.rpg-display`

Cormorant one-liner for quest card title overlay.

### Quest scene combat

Same three-row grid; `.quest-scene-root--combat` for chrome swap. See combat classes in prior spec.

## Surface inventory

### Tier A (this spec)

| Surface | Files |
|---------|--------|
| Quest scene | `quest-scene/*`, `combat/QuestSceneCombat.tsx` |
| Journal + play feed | `journal/JournalScreen.tsx`, `DialogueVoiceBlock.tsx` |
| Character | `tabs/CharacterTab.tsx`, `characterSheetTypography.ts` |
| NPC talk | `npc/NpcTalkDialog.tsx`, `merchant/MerchantPanel.tsx` |
| Quest popup (inline / modal) | `tabs/QuestPopup.tsx` |
| Shell | `GameHeader.tsx`, `RPGInterface.tsx` |

### Tier B (follow-up)

Village panels (`market/`, `tavern/`, etc.) still mix `font-serif` chrome—migrate to `rpg-font-ui` on dialogue passes.

## Migration

- **Prefer** `rpgUiTypography` + `.rpg-command-chip` + `.rpg-choice-grid` / `.rpg-choice-stack`.
- **Do not** add new `.choice-line` usages on Tier A.
- Quest scene tokens (`QUEST_SCENE_*`) are aliases of global `RPG_UI_*`.

## Success check (manual, phone)

- Quest scene + Play feed: dialogue 17px, prompts 18px, chips 14px, evenly spaced choices.
- Journal location actions match quest chips.
- Merchant / Carl talk: stacked full-width chips, same type scale.
- Character tab: sans labels; mono stays on stat numbers only.
