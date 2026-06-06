import type { QuestState } from './types';
import { QUEST_ORIGIN_ID } from '../constants';

/** Character exists only after the player submits a name on origin (or legacy creation date is set). */
export function hasNamedCharacter(
  state: Pick<QuestState, 'playerName' | 'characterCreationDateEastern'>
): boolean {
  return state.playerName.trim().length > 0 || state.characterCreationDateEastern != null;
}

/**
 * Solo checkpoints must not be written until naming (first save = origin name submit).
 * After that, every questState change syncs to localStorage + kind 10032 on game relays.
 */
export function canPersistQuestCheckpoint(state: QuestState): boolean {
  return hasNamedCharacter(state);
}

/** True when localStorage already holds a real save worth protecting from overwrite. */
export function isEstablishedQuestSave(state: QuestState): boolean {
  if (hasNamedCharacter(state)) return true;
  const progressIds = Object.keys(state.progressByQuestId);
  if (progressIds.length === 0) return false;
  if (progressIds.length === 1 && progressIds[0] === QUEST_ORIGIN_ID) {
    return Boolean(state.progressByQuestId[QUEST_ORIGIN_ID]?.isCompleted);
  }
  return true;
}

/** Block writing a blank in-memory save over a richer localStorage checkpoint (hydration races). */
export function wouldClobberEstablishedLocalSave(
  storageKey: string,
  candidate: QuestState
): boolean {
  if (isEstablishedQuestSave(candidate)) return false;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Partial<QuestState>;
    if (!parsed || typeof parsed !== 'object') return false;
    return isEstablishedQuestSave(parsed as QuestState);
  } catch {
    return false;
  }
}
