/**
 * Shared enter/exit motion for NPC-style dialogs (Carl, Merchant, …).
 * Softer than default shadcn Dialog: longer ease, subtle zoom, light rise — reads as a fade-in.
 */
export const NPC_DIALOG_CONTENT_MOTION =
  'duration-npc-dialog ease-npc-dialog motion-reduce:duration-150 motion-reduce:ease-linear ' +
  'data-[state=open]:animate-in data-[state=closed]:animate-out ' +
  'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 ' +
  'data-[state=open]:zoom-in-[0.97] data-[state=closed]:zoom-out-[0.98] ' +
  'data-[state=open]:slide-in-from-bottom-6 data-[state=closed]:slide-out-to-bottom-4';
