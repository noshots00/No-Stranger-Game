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
  RPG_UI_BODY,
  RPG_UI_CAPTION,
  RPG_UI_PROMPT,
} from './rpgUiTypography';

/** Tier 1 — scene title (NPC dialogs). */
export const RPG_DIALOG_TITLE =
  'font-cormorant text-base font-semibold tracking-[0.05em] text-[var(--candle-wax)]';

/** Tier 2 — narrator / NPC transcript lines. */
export const RPG_DIALOG_BODY = 'font-sans text-[11px] leading-snug text-[var(--candle-ink-soft)]';

/** Tier 3 — secondary hints inside dialog chrome. */
export const RPG_DIALOG_META = 'font-sans text-[10px] leading-snug text-[var(--candle-ink-faint)]';

/** Choice buttons in NPC/location dialogs (pairs with global `.choice-line.npc-dialog-choice`). */
export const RPG_DIALOG_CHOICE_CLASS = 'choice-line npc-dialog-choice';

/** Quest Scene — dialogue strip + commands */
export const QUEST_SCENE_PROMPT = RPG_UI_PROMPT;

export const QUEST_SCENE_RESPONSE = RPG_UI_BODY;

export const QUEST_SCENE_CHOICE = RPG_COMMAND_CHIP;

export const QUEST_SCENE_CHOICE_LABEL = RPG_COMMAND_CHIP_LABEL;

export const QUEST_SCENE_CONTINUE = RPG_COMMAND_CONTINUE;

export const QUEST_SCENE_META = RPG_UI_CAPTION;
