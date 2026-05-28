/**
 * RPG dialog typography — location popups, NPC talk (Merchant/Carl/Old Well).
 *
 * Character tab uses the denser scale in `tabs/characterSheetTypography.ts` (10px body).
 * Play tab narration/choices live in `DialogueVoiceBlock.tsx` (16px / 15px player rail).
 *
 * | Role           | Family    | Size | Where                          |
 * |----------------|-----------|------|--------------------------------|
 * | Dialog title   | Cormorant | 16px | `NpcTalkDialog` header         |
 * | Dialog body    | Serif     | 11px | Transcript log                 |
 * | Dialog choice  | Serif     | 11px | `.choice-line.npc-dialog-choice` |
 * | Dialog meta    | Serif     | 10px | Hints, inventory-pick labels   |
 */

/** Tier 1 — scene title (matches character name tier). */
export const RPG_DIALOG_TITLE =
  'font-cormorant text-base font-semibold tracking-[0.05em] text-[var(--candle-wax)]';

/** Tier 2 — narrator / NPC transcript lines. */
export const RPG_DIALOG_BODY = 'font-serif text-[11px] leading-snug';

/** Tier 3 — secondary hints inside dialog chrome. */
export const RPG_DIALOG_META = 'font-serif text-[10px] leading-snug text-[var(--candle-ink-faint)]';

/** Choice buttons in NPC/location dialogs (pairs with global `.choice-line.npc-dialog-choice`). */
export const RPG_DIALOG_CHOICE_CLASS = 'choice-line npc-dialog-choice';
