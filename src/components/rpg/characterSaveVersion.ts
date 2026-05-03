import type { QuestState } from '@/components/rpg/quests/types';
import { compareSemver } from '@/lib/compareSemver';

/** Characters created in saves older than this must go through the early-dev reset gate once. */
export const MIN_SUPPORTED_CHARACTER_SAVE_APP_VERSION = '0.5.36';

export function hasEstablishedCharacter(state: QuestState): boolean {
  if (state.playerName.trim().length > 0) return true;
  if (state.characterCreationDateEastern != null) return true;
  return false;
}

/** True when the player has a character that must be wiped before continuing (pre-schema saves). */
export function needsMandatoryCharacterReset(state: QuestState): boolean {
  if (!hasEstablishedCharacter(state)) return false;
  const v = state.characterCreatedAtAppVersion;
  if (v == null) return true;
  return compareSemver(v, MIN_SUPPORTED_CHARACTER_SAVE_APP_VERSION) < 0;
}
