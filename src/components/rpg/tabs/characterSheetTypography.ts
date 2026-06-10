/**
 * Character sheet type scale — fixed px (see docs/design/UI_TOKENS.md).
 */

import { RPG_COMMAND_CHIP, RPG_UI_BODY, RPG_UI_CAPTION, RPG_UI_EMPHASIS, RPG_UI_UI } from '../typography/rpgUiTypography';

/** Tier 1: player name (status screen) */
export const CHAR_NAME = `${RPG_UI_EMPHASIS} text-[var(--candle-ink)]`;

/** Tier 3: level · race · class */
export const CHAR_SUBTITLE = RPG_UI_UI;

/** Profile card: profession, coin, kindred */
export const CHAR_PROFILE_META = RPG_UI_UI;

/** Profile card top row: age + guild */
export const CHAR_PROFILE_HEADER = RPG_UI_CAPTION;

/** Tier 4: traits/skills / modifier columns */
export const CHAR_BODY = RPG_UI_BODY;

export const CHAR_META_LABEL = 'text-[var(--candle-ink-soft)]';

export const CHAR_META_VALUE = 'text-[var(--candle-ink)]';

export const CHAR_META_FAINT = 'text-[var(--candle-ink-faint)]';

/** Primary attribute table */
export const CHAR_STAT_TABLE = 'rpg-font-ui text-[11px] leading-none';

/** Tier 5: primary attribute captions (compact — six stats + skill columns share one row). */
export const CHAR_STAT_LABEL =
  'text-[9px] font-medium leading-none tracking-[0.06em] uppercase text-[var(--candle-ink-faint)]';

/** Inline stat chip: STR 10 */
export const CHAR_STAT_CELL = 'inline-flex items-baseline justify-center gap-0.5 leading-none';

/** Tier 2: primary attribute values */
export const CHAR_STAT_VALUE = 'font-mono text-[9px] tabular-nums leading-none text-[var(--candle-ink)]';

/** Profile card — tighter than full character screen (popup reuse). */
export const CHAR_PROFILE_NAME =
  'rpg-font-ui text-[14px] font-medium leading-tight text-[var(--candle-ink)]';

export const CHAR_PROFILE_SUBTITLE =
  'rpg-font-ui text-[12px] leading-tight text-[var(--candle-ink-soft)]';

/** Loadout tile in profile card footer */
export const CHAR_LOADOUT_TILE_NAME =
  'line-clamp-1 max-w-[4.25rem] rpg-font-ui text-[10px] font-medium uppercase leading-none tracking-[0.03em]';

/** Ability tile labels — metrics only; color comes from the tile wrapper. */
export const CHAR_TILE_NAME =
  'line-clamp-2 rpg-font-ui text-[12px] font-medium uppercase leading-none tracking-[0.04em]';

export const CHAR_TILE_LEVEL = 'mt-px font-mono text-[9px] tabular-nums leading-none';
export const CHAR_MINOR =
  'rpg-font-ui text-[10px] leading-snug tracking-wide text-[var(--candle-ink-faint)]';

/** Footer / secondary links */
export const CHAR_FOOTER = RPG_UI_BODY;

export const CHAR_ACTION_LINK = `${RPG_UI_BODY} text-[var(--candle-wax)]`;

/** Fixed corner link on character screen (e.g. public Nostr profile). */
export const CHAR_PROFILE_LINK = `${RPG_UI_CAPTION} leading-tight text-[var(--candle-wax)]`;

/** Chronicle and sheet text actions */
export const CHAR_SHEET_ACTION = `${RPG_COMMAND_CHIP} text-center uppercase tracking-[0.06em] text-[var(--candle-wax)]`;
