import { QUEST_018_SILVER_LAKE_REFLECTION_ID, QUEST_VILLAGE_ARRIVAL_ID } from '../constants';
import type { QuestContext } from './types';
import { allQuests, questById } from './registry';

/** Implemented forest → door → home spine; extend as MAIN_QUEST.md grows. */
export const MAIN_SAGA_QUEST_IDS: readonly string[] = [
  'quest-001-origin',
  'quest-002-first-night',
  'quest-002-b-will-i-starve',
  'quest-003-b-meet-merchant',
  'quest-004-b-the-door',
  'quest-005-b-home',
  'quest-005-c-wolf-pelt-tribute',
] as const;

const MAIN_SAGA_INDEX = new Map<string, number>(MAIN_SAGA_QUEST_IDS.map((id, i) => [id, i]));
const MAIN_SAGA_SET = new Set<string>(MAIN_SAGA_QUEST_IDS);

/** First main beat after which the side-quest unveil drip is allowed. */
export const SIDE_QUEST_UNVEIL_AFTER_MAIN_ID = 'quest-003-b-meet-merchant';

/**
 * Side quests surface in this order first (looser gates / forest beats after saga), then the rest
 * by createdAt so `quest-005-airship` does not block `quest-004-abandoned-shelter`.
 */
const SIDE_QUEST_UNVEIL_PRIORITY: readonly string[] = [
  'quest-004-abandoned-shelter',
  'quest-006-wandering-skeleton',
  'quest-002-boar-ambush',
  'quest-003-silver-lake',
  'quest-005-airship',
];

const PRIORITY_SET = new Set<string>(SIDE_QUEST_UNVEIL_PRIORITY);

const SIDE_QUEST_REST_ORDER: readonly string[] = [...allQuests]
  .filter((q) => !MAIN_SAGA_SET.has(q.id) && !PRIORITY_SET.has(q.id))
  .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))
  .map((q) => q.id);

export const SIDE_QUEST_UNVEIL_ORDER: readonly string[] = [
  ...SIDE_QUEST_UNVEIL_PRIORITY,
  ...SIDE_QUEST_REST_ORDER,
];

export function isMainSagaQuestId(questId: string): boolean {
  return MAIN_SAGA_SET.has(questId);
}

/**
 * After exactly one quest completion, return at most one newly unveiled quest id.
 * Saga: unveil next saga step only if it is eligible and not already shown or done.
 * Otherwise: if the side milestone is met, unveil the next eligible side quest in order.
 */
export function computeNextUnveilIdsAfterCompletion(
  completedQuestId: string,
  unveiledQuestIds: readonly string[],
  completedQuestIds: readonly string[],
  context: QuestContext
): string[] {
  const unveiled = new Set(unveiledQuestIds);
  const completed = new Set(completedQuestIds);

  const sagaIdx = MAIN_SAGA_INDEX.get(completedQuestId);
  if (sagaIdx !== undefined && sagaIdx + 1 < MAIN_SAGA_QUEST_IDS.length) {
    const nextId = MAIN_SAGA_QUEST_IDS[sagaIdx + 1];
    if (!completed.has(nextId) && !unveiled.has(nextId)) {
      const q = questById[nextId];
      if (q?.isAvailable(context)) return [nextId];
    }
    // Saga next not ready yet — still allow side drip (do not return [] here).
  }

  if (completedQuestId === QUEST_018_SILVER_LAKE_REFLECTION_ID) {
    const villageId = QUEST_VILLAGE_ARRIVAL_ID;
    if (!completed.has(villageId) && !unveiled.has(villageId)) {
      const q = questById[villageId];
      if (q?.isAvailable(context)) return [villageId];
    }
  }

  if (!completed.has(SIDE_QUEST_UNVEIL_AFTER_MAIN_ID)) return [];

  for (const id of SIDE_QUEST_UNVEIL_ORDER) {
    if (completed.has(id) || unveiled.has(id)) continue;
    const q = questById[id];
    if (q?.isAvailable(context)) return [id];
  }
  return [];
}

/** When saga is done (or skipped), day rollover can surface one eligible side if the player was stuck. */
export function pickNextSideQuestToUnveilOnDayRoll(
  unveiledQuestIds: readonly string[],
  completedQuestIds: readonly string[],
  context: QuestContext
): string | null {
  if (!completedQuestIds.includes(SIDE_QUEST_UNVEIL_AFTER_MAIN_ID)) return null;
  const unveiled = new Set(unveiledQuestIds);
  const completed = new Set(completedQuestIds);
  for (const id of SIDE_QUEST_UNVEIL_ORDER) {
    if (completed.has(id) || unveiled.has(id)) continue;
    const q = questById[id];
    if (q?.isAvailable(context)) return id;
  }
  return null;
}

/** One-shot migration: unveil the next saga step whenever the previous saga step is already complete. */
export function catchUpSagaUnveilIds(
  unveiledQuestIds: readonly string[],
  completedQuestIds: readonly string[],
  context: QuestContext
): string[] {
  const unveiled = new Set(unveiledQuestIds);
  const completed = new Set(completedQuestIds);
  const out: string[] = [];
  for (let i = 0; i < MAIN_SAGA_QUEST_IDS.length - 1; i++) {
    const cur = MAIN_SAGA_QUEST_IDS[i];
    const next = MAIN_SAGA_QUEST_IDS[i + 1];
    if (!completed.has(cur)) continue;
    if (completed.has(next) || unveiled.has(next)) continue;
    const q = questById[next];
    if (q?.isAvailable(context)) {
      unveiled.add(next);
      out.push(next);
    }
  }
  return out;
}
