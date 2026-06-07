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

/** Full-width location hero — 16:7 banner (quest scene art, non-village). */
export const RPG_SCENE_BANNER =
  'aspect-[16/7] w-full overflow-hidden rounded-md border border-[var(--candle-rule)] shadow-[0_8px_28px_rgba(0,0,0,0.4)]';

/** Tight horizontal inset for play journal log and quest cards. */
export const RPG_PLAY_JOURNAL_GUTTER = 'px-[5px]';

/** @deprecated Use `RPG_PLAY_JOURNAL_GUTTER`. */
export const RPG_PLAY_CONTENT_GUTTER = RPG_PLAY_JOURNAL_GUTTER;

/** Full-bleed village hub strip — location cloud + earning indicator. */
export const RPG_VILLAGE_HUB_STRIP =
  'h-[4.75rem] w-full overflow-hidden border-y border-[var(--candle-rule)] shadow-[0_4px_16px_rgba(0,0,0,0.35)]';

/** Compact village hub strip — location cloud + inline location screens. */
export const RPG_VILLAGE_HUB_BANNER = RPG_VILLAGE_HUB_STRIP;

/** Vertical command stack — NPC / merchant talk panes */
export const RPG_CHOICE_STACK = 'rpg-choice-stack';

/** @deprecated Use `RPG_CHOICE_GRID` */
export const RPG_COMMAND_GRID = RPG_CHOICE_GRID;
