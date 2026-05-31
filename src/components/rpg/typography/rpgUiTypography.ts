/**
 * RPG UI typography — fixed px scale, Source Sans 3 UI + rare Cormorant display.
 * Canonical spec: docs/design/UI_TOKENS.md
 */

/** Shared UI face (pairs with `.rpg-font-ui` in index.css). */
export const RPG_FONT_UI = 'rpg-font-ui';

/** Tier: caption (9px) — stat labels, badges */
export const RPG_UI_CAPTION =
  'rpg-font-ui text-[9px] leading-tight tracking-wide text-[var(--candle-ink-faint)]';

/** Tier: ui (10px) — header meta, hints */
export const RPG_UI_UI = 'rpg-font-ui text-[10px] leading-tight text-[var(--candle-ink-soft)]';

/** Tier: body (11px) — dialogue strip, journal summaries */
export const RPG_UI_BODY = 'rpg-font-ui text-[11px] leading-snug text-[var(--candle-ink-soft)]';

/** Tier: emphasis (12px) — section titles, day-end headers */
export const RPG_UI_EMPHASIS =
  'rpg-font-ui text-[12px] font-medium leading-snug text-[var(--candle-ink)]';

/** Tier: display — Cormorant titles (quest card overlay, optional hero line) */
export const RPG_UI_DISPLAY = 'rpg-display';

/** Quest scene / journal prompt line inside a panel */
export const RPG_UI_PROMPT =
  'rpg-font-ui text-[12px] font-medium leading-snug text-[var(--candle-ink)]';

/** Play feed + journal log body */
export const RPG_UI_LOG_LINE = 'rpg-log-line';

/** Command chip — pairs with global `.rpg-command-chip` in index.css */
export const RPG_COMMAND_CHIP = 'rpg-command-chip';

export const RPG_COMMAND_CHIP_LABEL = 'rpg-command-chip-label';

/** Full-width continue in command grids */
export const RPG_COMMAND_CONTINUE = 'rpg-command-chip rpg-command-chip--continue';

/** Location / journal command grid (2 columns on phone) */
export const RPG_COMMAND_GRID = 'rpg-command-grid';
