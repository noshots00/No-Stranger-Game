/**
 * RPG dialog typography — location popups, NPC talk, quest scene.
 *
 * Quest scene aliases the global RPG UI scale (UI_TOKENS.md).
 * Character tab: `tabs/characterSheetTypography.ts`.
 */

import {
  RPG_COMMAND_CHIP,
  RPG_COMMAND_CHIP_LABEL,
  RPG_COMMAND_CONTINUE,
  RPG_UI_BODY,
  RPG_UI_META,
  RPG_UI_PROMPT,
} from './rpgUiTypography';

/** Tier 1 — scene title (NPC dialogs). */
export const RPG_DIALOG_TITLE =
  'font-cormorant text-base font-semibold tracking-[0.05em] text-[var(--candle-wax)]';

/** Tier 2 — narrator / NPC transcript lines. */
export const RPG_DIALOG_BODY = RPG_UI_BODY;

/** Tier 3 — secondary hints inside dialog chrome. */
export const RPG_DIALOG_META = RPG_UI_META;

/** NPC / popup choices — command chips (not legacy `.choice-line`). */
export const RPG_DIALOG_CHOICE_CLASS = RPG_COMMAND_CHIP;

export const RPG_DIALOG_CHOICE_LABEL = RPG_COMMAND_CHIP_LABEL;

/** Quest Scene — same tokens as global RPG UI */
export const QUEST_SCENE_PROMPT = RPG_UI_PROMPT;

export const QUEST_SCENE_RESPONSE = RPG_UI_BODY;

export const QUEST_SCENE_CHOICE = RPG_COMMAND_CHIP;

export const QUEST_SCENE_CHOICE_LABEL = RPG_COMMAND_CHIP_LABEL;

export const QUEST_SCENE_CONTINUE = RPG_COMMAND_CONTINUE;

export const QUEST_SCENE_META = RPG_UI_META;
