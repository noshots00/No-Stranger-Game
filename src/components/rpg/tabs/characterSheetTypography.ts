/**
 * Character sheet type scale — fixed px (see docs/design/UI_TOKENS.md).
 */

import { RPG_COMMAND_CHIP, RPG_UI_BODY, RPG_UI_CAPTION, RPG_UI_EMPHASIS, RPG_UI_UI } from '../typography/rpgUiTypography';

/** Tier 1: player name (status screen) */
export const CHAR_NAME = `${RPG_UI_EMPHASIS} text-[14px] text-[var(--candle-ink)]`;

/** Tier 3: level · race · class */
export const CHAR_SUBTITLE = RPG_UI_UI;

/** Tier 4: profile meta + traits/skills body */
export const CHAR_BODY = RPG_UI_BODY;

export const CHAR_META_LABEL = 'text-[var(--candle-ink-soft)]';

export const CHAR_META_VALUE = 'text-[var(--candle-ink)]';

export const CHAR_META_FAINT = 'text-[var(--candle-ink-faint)]';

/** Primary attribute table */
export const CHAR_STAT_TABLE = 'font-sans text-[10px] leading-tight text-[var(--candle-ink-soft)]';

/** Tier 5: primary attribute captions */
export const CHAR_STAT_LABEL = `${RPG_UI_CAPTION} break-words uppercase tracking-[0.08em]`;

/** Tier 2: primary attribute values */
export const CHAR_STAT_VALUE =
  'mt-0.5 font-mono text-[9px] tabular-nums leading-none text-[var(--candle-ink)]';

/** Ability tile labels */
export const CHAR_TILE_NAME =
  'line-clamp-2 font-sans text-[10px] font-medium uppercase leading-none tracking-[0.04em]';

export const CHAR_TILE_LEVEL = 'mt-px font-mono text-[9px] tabular-nums leading-none';

/** Footer / secondary links */
export const CHAR_FOOTER = RPG_UI_BODY;

export const CHAR_ACTION_LINK = `${RPG_UI_BODY} text-[var(--candle-wax)]`;

/** Chronicle and sheet text actions */
export const CHAR_SHEET_ACTION = `${RPG_COMMAND_CHIP} text-center uppercase tracking-[0.06em] text-[var(--candle-wax)]`;
