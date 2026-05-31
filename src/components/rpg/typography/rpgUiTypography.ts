/**
 * RPG UI typography — fixed px scale, Inter UI + rare Cormorant display.
 * Canonical spec: docs/design/UI_TOKENS.md
 */

/** Tier: caption (9px) — stat labels, badges */
export const RPG_UI_CAPTION =
  'font-sans text-[9px] leading-tight tracking-wide text-[var(--candle-ink-faint)]';

/** Tier: ui (10px) — header meta, hints */
export const RPG_UI_UI = 'font-sans text-[10px] leading-tight text-[var(--candle-ink-soft)]';

/** Tier: body (11px) — dialogue strip, journal summaries */
export const RPG_UI_BODY = 'font-sans text-[11px] leading-snug text-[var(--candle-ink-soft)]';

/** Tier: emphasis (12px) — section titles, day-end headers */
export const RPG_UI_EMPHASIS =
  'font-sans text-[12px] font-semibold leading-snug text-[var(--candle-ink)]';

/** Tier: display — Cormorant titles (quest card overlay, optional hero line) */
export const RPG_UI_DISPLAY = 'rpg-display';

/** Quest scene / journal prompt line inside a panel */
export const RPG_UI_PROMPT = 'font-sans text-[12px] font-semibold leading-snug text-[var(--candle-ink)]';

/** Play feed + journal log body */
export const RPG_UI_LOG_LINE = 'rpg-log-line';

/** Command chip — pairs with global `.rpg-command-chip` in index.css */
export const RPG_COMMAND_CHIP = 'rpg-command-chip';

export const RPG_COMMAND_CHIP_LABEL = 'rpg-command-chip-label';

/** Full-width continue in command grids */
export const RPG_COMMAND_CONTINUE = 'rpg-command-chip rpg-command-chip--continue';

/** Location / journal command grid (2 columns on phone) */
export const RPG_COMMAND_GRID = 'rpg-command-grid';
