import type { QuestState } from '../quests/types';

/** Add a job slug to unlocked list (idempotent). */
export function unlockJobSlug(state: QuestState, jobSlug: string): QuestState {
  const unlocked = new Set(state.unlockedJobSlugs ?? []);
  if (unlocked.has(jobSlug)) return state;
  return {
    ...state,
    unlockedJobSlugs: [...(state.unlockedJobSlugs ?? []), jobSlug],
  };
}
