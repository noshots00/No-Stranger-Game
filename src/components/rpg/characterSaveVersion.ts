import type { QuestState } from '@/components/rpg/quests/types';
import { compareSemver } from '@/lib/compareSemver';

/** Characters created in saves older than this must go through the early-dev reset gate once. */
export const MIN_SUPPORTED_CHARACTER_SAVE_APP_VERSION = '0.5.36';

export type CharacterSaveIdentity = Pick<
  QuestState,
  'playerName' | 'characterCreationDateEastern' | 'characterCreatedAtAppVersion'
>;

export function hasEstablishedCharacter(state: CharacterSaveIdentity): boolean {
  if (state.playerName.trim().length > 0) return true;
  if (state.characterCreationDateEastern != null) return true;
  return false;
}

/**
 * Saves from before `characterCreatedAtAppVersion` existed are treated as supported
 * so routine reloads do not force the early-dev wipe gate.
 */
export function resolveCharacterCreatedAtAppVersion(args: CharacterSaveIdentity): string | null {
  if (args.characterCreatedAtAppVersion) return args.characterCreatedAtAppVersion;
  if (!hasEstablishedCharacter(args)) return null;
  return MIN_SUPPORTED_CHARACTER_SAVE_APP_VERSION;
}

/** True when the player has a character that must be wiped before continuing (pre-schema saves). */
export function needsMandatoryCharacterReset(state: QuestState): boolean {
  if (!hasEstablishedCharacter(state)) return false;
  const v = resolveCharacterCreatedAtAppVersion({
    playerName: state.playerName,
    characterCreationDateEastern: state.characterCreationDateEastern,
    characterCreatedAtAppVersion: state.characterCreatedAtAppVersion,
  });
  if (v == null) return false;
  return compareSemver(v, MIN_SUPPORTED_CHARACTER_SAVE_APP_VERSION) < 0;
}
