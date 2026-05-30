import {
  QUEST_018_SILVER_LAKE_REFLECTION_ID,
  QUEST_DAY_TWO_DREAM_ID,
  QUEST_DISCOVER_CEMETERY_ID,
  QUEST_DISCOVER_MINE_ID,
  QUEST_DISCOVER_QUARRY_ID,
  QUEST_DYERS_CRYPT_ID,
  QUEST_FIRST_NIGHT_ID,
  QUEST_004_B_THE_DOOR_ID,
  QUEST_FOREST_CAVE_ID,
  QUEST_VILLAGE_ARRIVAL_ID,
} from '../constants';
import { isQuestEligibleForUnveil } from './branching-quest-template';
import type { QuestContext, QuestDefinition } from './types';
import { allQuests, questById } from './registry';

const unveilEligible = (q: QuestDefinition | undefined, context: QuestContext): boolean =>
  q ? isQuestEligibleForUnveil(q, context) : false;

/** Temporary maintainer gate: only manually-unveiled quests should surface. */
const MANUAL_QUEST_GATING = true;

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
 * by createdAt so `quest-005-forest-cave` does not block `quest-004-abandoned-shelter`.
 */
const SIDE_QUEST_UNVEIL_PRIORITY: readonly string[] = [
  'quest-002-boar-ambush',
  'quest-003-silver-lake',
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
  if (MANUAL_QUEST_GATING) {
    const completed = new Set(completedQuestIds);
    const unveiled = new Set(unveiledQuestIds);
    if (completedQuestId === 'quest-001-origin') {
      const nextId = 'quest-002-first-night';
      if (!completed.has(nextId) && !unveiled.has(nextId)) {
        const q = questById[nextId];
        if (unveilEligible(q, context)) return [nextId];
      }
    }
    if (completedQuestId === QUEST_FIRST_NIGHT_ID) {
      const nextId = QUEST_DYERS_CRYPT_ID;
      if (!completed.has(nextId) && !unveiled.has(nextId)) {
        const q = questById[nextId];
        if (unveilEligible(q, context)) return [nextId];
      }
    }
    if (completedQuestId === QUEST_DYERS_CRYPT_ID) {
      const nextId = 'quest-004-abandoned-shelter';
      if (!completed.has(nextId) && !unveiled.has(nextId)) {
        const q = questById[nextId];
        if (unveilEligible(q, context)) return [nextId];
      }
    }
    if (completedQuestId === 'quest-004-abandoned-shelter') {
      const nextId = QUEST_DAY_TWO_DREAM_ID;
      if (!completed.has(nextId) && !unveiled.has(nextId)) {
        const q = questById[nextId];
        if (unveilEligible(q, context)) return [nextId];
      }
    }
    if (completedQuestId === QUEST_DAY_TWO_DREAM_ID) {
      const nextId = QUEST_FOREST_CAVE_ID;
      if (!completed.has(nextId) && !unveiled.has(nextId)) {
        const q = questById[nextId];
        if (unveilEligible(q, context)) return [nextId];
      }
    }
    if (completedQuestId === QUEST_FOREST_CAVE_ID) {
      const nextId = QUEST_004_B_THE_DOOR_ID;
      if (!completed.has(nextId) && !unveiled.has(nextId)) {
        const q = questById[nextId];
        if (unveilEligible(q, context)) return [nextId];
      }
    }
    return [];
  }
  const unveiled = new Set(unveiledQuestIds);
  const completed = new Set(completedQuestIds);

  const sagaIdx = MAIN_SAGA_INDEX.get(completedQuestId);
  if (sagaIdx !== undefined && sagaIdx + 1 < MAIN_SAGA_QUEST_IDS.length) {
    const nextId = MAIN_SAGA_QUEST_IDS[sagaIdx + 1];
    if (!completed.has(nextId) && !unveiled.has(nextId)) {
      const q = questById[nextId];
      if (unveilEligible(q, context)) return [nextId];
    }
    // Saga next not ready yet — still allow side drip (do not return [] here).
  }

  if (completedQuestId === QUEST_018_SILVER_LAKE_REFLECTION_ID) {
    const villageId = QUEST_VILLAGE_ARRIVAL_ID;
    if (!completed.has(villageId) && !unveiled.has(villageId)) {
      const q = questById[villageId];
      if (unveilEligible(q, context)) return [villageId];
    }
  }

  if (completedQuestId === QUEST_VILLAGE_ARRIVAL_ID) {
    const firstDiscovery = QUEST_DISCOVER_CEMETERY_ID;
    if (!completed.has(firstDiscovery) && !unveiled.has(firstDiscovery)) {
      const q = questById[firstDiscovery];
      if (unveilEligible(q, context)) return [firstDiscovery];
    }
  }

  const discoveryChain = [
    QUEST_DISCOVER_CEMETERY_ID,
    QUEST_DISCOVER_QUARRY_ID,
    QUEST_DISCOVER_MINE_ID,
  ] as const;
  const discoveryIdx = discoveryChain.indexOf(
    completedQuestId as (typeof discoveryChain)[number]
  );
  if (discoveryIdx >= 0 && discoveryIdx + 1 < discoveryChain.length) {
    const nextId = discoveryChain[discoveryIdx + 1];
    if (!completed.has(nextId) && !unveiled.has(nextId)) {
      const q = questById[nextId];
      if (unveilEligible(q, context)) return [nextId];
    }
  }

  if (!completed.has(SIDE_QUEST_UNVEIL_AFTER_MAIN_ID)) return [];

  for (const id of SIDE_QUEST_UNVEIL_ORDER) {
    if (completed.has(id) || unveiled.has(id)) continue;
    const q = questById[id];
    if (unveilEligible(q, context)) return [id];
  }
  return [];
}

/** When saga is done (or skipped), day rollover can surface one eligible side if the player was stuck. */
export function pickNextSideQuestToUnveilOnDayRoll(
  unveiledQuestIds: readonly string[],
  completedQuestIds: readonly string[],
  context: QuestContext
): string | null {
  if (MANUAL_QUEST_GATING) return null;
  if (!completedQuestIds.includes(SIDE_QUEST_UNVEIL_AFTER_MAIN_ID)) return null;
  const unveiled = new Set(unveiledQuestIds);
  const completed = new Set(completedQuestIds);
  for (const id of SIDE_QUEST_UNVEIL_ORDER) {
    if (completed.has(id) || unveiled.has(id)) continue;
    const q = questById[id];
    if (unveilEligible(q, context)) return id;
  }
  return null;
}

/** On login: surface village arrival when Silver Lake reflection is already complete. */
export function catchUpVillageUnveilId(
  unveiledQuestIds: readonly string[],
  completedQuestIds: readonly string[],
  context: QuestContext
): string | null {
  if (MANUAL_QUEST_GATING) return null;
  if (!completedQuestIds.includes(QUEST_018_SILVER_LAKE_REFLECTION_ID)) return null;
  const villageId = QUEST_VILLAGE_ARRIVAL_ID;
  if (completedQuestIds.includes(villageId)) return null;
  if (unveiledQuestIds.includes(villageId)) return null;
  const q = questById[villageId];
  if (!unveilEligible(q, context)) return null;
  return villageId;
}

/** Manual gating: unveil the next forest saga step when the prior step is already complete. */
export function catchUpManualSagaUnveilIds(
  unveiledQuestIds: readonly string[],
  completedQuestIds: readonly string[],
  context: QuestContext
): string[] {
  if (!MANUAL_QUEST_GATING) return [];
  const completed = new Set(completedQuestIds);
  const out: string[] = [];
  const chain = [
    ['quest-001-origin', 'quest-002-first-night'],
    [QUEST_FIRST_NIGHT_ID, QUEST_DYERS_CRYPT_ID],
    [QUEST_DYERS_CRYPT_ID, 'quest-004-abandoned-shelter'],
    ['quest-004-abandoned-shelter', QUEST_DAY_TWO_DREAM_ID],
    [QUEST_DAY_TWO_DREAM_ID, QUEST_FOREST_CAVE_ID],
    [QUEST_FOREST_CAVE_ID, QUEST_004_B_THE_DOOR_ID],
  ] as const;
  for (const [prevId, nextId] of chain) {
    if (!completed.has(prevId)) continue;
    const add = computeNextUnveilIdsAfterCompletion(prevId, [...unveiledQuestIds, ...out], completedQuestIds, context);
    if (add.includes(nextId)) out.push(nextId);
  }
  return out;
}

/** One-shot migration: unveil the next saga step whenever the previous saga step is already complete. */
export function catchUpSagaUnveilIds(
  unveiledQuestIds: readonly string[],
  completedQuestIds: readonly string[],
  context: QuestContext
): string[] {
  if (MANUAL_QUEST_GATING) return [];
  const unveiled = new Set(unveiledQuestIds);
  const completed = new Set(completedQuestIds);
  const out: string[] = [];
  for (let i = 0; i < MAIN_SAGA_QUEST_IDS.length - 1; i++) {
    const cur = MAIN_SAGA_QUEST_IDS[i];
    const next = MAIN_SAGA_QUEST_IDS[i + 1];
    if (!completed.has(cur)) continue;
    if (completed.has(next) || unveiled.has(next)) continue;
    const q = questById[next];
    if (unveilEligible(q, context)) {
      unveiled.add(next);
      out.push(next);
    }
  }
  return out;
}
