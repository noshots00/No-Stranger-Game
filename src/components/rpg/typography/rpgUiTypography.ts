/**
 * RPG UI typography — fixed px scale, Source Sans 3 UI + rare Cormorant display.
 * Canonical spec: docs/design/UI_TOKENS.md (aligned with quest scene).
 */

/** Shared UI face (pairs with `.rpg-font-ui` in index.css). */
export const RPG_FONT_UI = 'rpg-font-ui';

/** Tier: caption (12px) — badges, card footnotes */
export const RPG_UI_CAPTION =
  'rpg-font-ui text-[12px] leading-tight tracking-wide text-[var(--candle-ink-faint)]';

/** Tier: ui (13px) — header meta, compact labels */
export const RPG_UI_UI = 'rpg-font-ui text-[13px] leading-tight text-[var(--candle-ink-soft)]';

/** Tier: body (17px) — dialogue, journal log, narrator */
export const RPG_UI_BODY =
  'rpg-font-ui text-[17px] font-normal leading-snug tracking-[0.01em] text-[var(--candle-ink-soft)]';

/** Tier: meta (14px) — hints, secondary chrome */
export const RPG_UI_META =
  'rpg-font-ui text-[14px] leading-tight tracking-wide text-[var(--candle-ink-faint)]';

/** Tier: emphasis (16px) — section titles, day-end headers */
export const RPG_UI_EMPHASIS =
  'rpg-font-ui text-[16px] font-medium leading-snug text-[var(--candle-ink)]';

/** Tier: display — Cormorant titles (quest card overlay, optional hero line) */
export const RPG_UI_DISPLAY = 'rpg-display';

/** Prompt / beat headline inside a panel */
export const RPG_UI_PROMPT =
  'rpg-font-ui text-[18px] font-medium leading-snug tracking-[0.01em] text-[var(--candle-ink)]';

/** Play feed + journal log body (CSS `.rpg-log-line` mirrors `--rpg-text-body`) */
export const RPG_UI_LOG_LINE = 'rpg-log-line';

/** Command chip — pairs with global `.rpg-command-chip` in index.css */
export const RPG_COMMAND_CHIP = 'rpg-command-chip';

export const RPG_COMMAND_CHIP_LABEL = 'rpg-command-chip-label';

/** Full-width continue in command grids */
export const RPG_COMMAND_CONTINUE = 'rpg-command-chip rpg-command-chip--continue';

/** Horizontal command row — equal edge/between spacing (quest scene, journal locations) */
export const RPG_CHOICE_GRID = 'rpg-choice-grid';

/** Vertical command stack — NPC / merchant talk panes */
export const RPG_CHOICE_STACK = 'rpg-choice-stack';

/** @deprecated Use `RPG_CHOICE_GRID` */
export const RPG_COMMAND_GRID = RPG_CHOICE_GRID;
