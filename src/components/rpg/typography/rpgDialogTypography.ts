/**
 * RPG dialog typography — location popups, NPC talk, quest scene.
 *
 * Quest scene + shared commands: `rpgUiTypography.ts` (UI_TOKENS.md).
 * Character tab: `tabs/characterSheetTypography.ts`.
 */

import {
  RPG_COMMAND_CHIP,
  RPG_COMMAND_CHIP_LABEL,
  RPG_COMMAND_CONTINUE,
} from './rpgUiTypography';

/** Tier 1 — scene title (NPC dialogs). */
export const RPG_DIALOG_TITLE =
  'font-cormorant text-base font-semibold tracking-[0.05em] text-[var(--candle-wax)]';

/** Tier 2 — narrator / NPC transcript lines. */
export const RPG_DIALOG_BODY = 'rpg-font-ui text-[11px] leading-snug text-[var(--candle-ink-soft)]';

/** Tier 3 — secondary hints inside dialog chrome. */
export const RPG_DIALOG_META = 'rpg-font-ui text-[10px] leading-snug text-[var(--candle-ink-faint)]';

/** Choice buttons in NPC/location dialogs (pairs with global `.choice-line.npc-dialog-choice`). */
export const RPG_DIALOG_CHOICE_CLASS = 'choice-line npc-dialog-choice';

/** Quest Scene — dialogue strip + commands (slightly larger than global RPG UI scale). */
export const QUEST_SCENE_PROMPT =
  'rpg-font-ui text-[15px] font-medium leading-snug tracking-[0.01em] text-[var(--candle-ink)]';

export const QUEST_SCENE_RESPONSE =
  'rpg-font-ui text-[14px] font-normal leading-snug tracking-[0.01em] text-[var(--candle-ink-soft)]';

export const QUEST_SCENE_CHOICE = RPG_COMMAND_CHIP;

export const QUEST_SCENE_CHOICE_LABEL = RPG_COMMAND_CHIP_LABEL;

export const QUEST_SCENE_CONTINUE = RPG_COMMAND_CONTINUE;

export const QUEST_SCENE_META =
  'rpg-font-ui text-[11px] leading-tight tracking-wide text-[var(--candle-ink-faint)]';
