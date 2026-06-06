import { appendUniqueWorldEntries, formatResourceLabel } from '../helpers';
import {
  JOB_SLUG_EXPLORER,
  QUEST_DISCOVER_CEMETERY_ID,
  QUEST_DISCOVER_MINE_ID,
  QUEST_DISCOVER_QUARRY_ID,
  VILLAGE_CHOOSEABLE_JOB_SLUGS,
  VILLAGE_PHASE_FLAG,
} from '../constants';
import type { QuestState } from '../quests/types';
import { getCompletedQuestIds, getQuestContext } from '../quests/engine';
import { questById } from '../quests/registry';
import { getJobDefinition } from './registry';
import type { JobActionResult } from './types';

const EXPLORER_DISCOVERY_ORDER = [
  QUEST_DISCOVER_CEMETERY_ID,
  QUEST_DISCOVER_QUARRY_ID,
  QUEST_DISCOVER_MINE_ID,
] as const;

function pickExplorerUnveilQuestId(state: QuestState, calendarDay: number): string | undefined {
  const completed = new Set(getCompletedQuestIds(state));
  const unveiled = new Set(state.unveiledQuestIds);
  const ctx = getQuestContext(state, calendarDay);
  for (const id of EXPLORER_DISCOVERY_ORDER) {
    if (completed.has(id) || unveiled.has(id)) continue;
    const q = questById[id];
    if (q?.isAvailable(ctx)) return id;
  }
  return undefined;
}

export function canUseJobDailyAction(
  state: QuestState,
  jobSlug: string,
  calendarDay: number
): boolean {
  const last = state.jobDailyActionBySlug?.[jobSlug]?.lastActionDay ?? 0;
  return last < calendarDay;
}

export function applyJobDailyAction(
  state: QuestState,
  jobSlug: string,
  calendarDay: number
): JobActionResult | null {
  if (!state.flags.includes(VILLAGE_PHASE_FLAG)) return null;
  if (state.activeJobSlug !== jobSlug) return null;
  if (!state.unlockedJobSlugs?.includes(jobSlug)) return null;
  if (!canUseJobDailyAction(state, jobSlug, calendarDay)) return null;

  const job = getJobDefinition(jobSlug);
  if (!job) return null;

  const day = Math.max(1, Math.floor(calendarDay));
  const resources = { ...(state.resources ?? {}) };
  for (const [key, amount] of Object.entries(job.dailyYields)) {
    if (typeof amount === 'number' && amount > 0) {
      resources[key] = (resources[key] ?? 0) + amount;
    }
  }

  const skills = { ...state.skills };
  if (job.skillXpKey && job.skillXpAmount) {
    skills[job.skillXpKey] = skills[job.skillXpKey] + job.skillXpAmount;
  }

  const jobDailyActionBySlug = {
    ...(state.jobDailyActionBySlug ?? {}),
    [jobSlug]: { lastActionDay: day },
  };

  const worldLines: string[] = [
    `You completed a ${job.displayName} shift (Day ${day}).`,
  ];
  for (const [key, amount] of Object.entries(job.dailyYields)) {
    if (amount && amount > 0) worldLines.push(`Gathered ${amount} ${formatResourceLabel(key)}.`);
  }

  let unveilQuestId: string | undefined;
  if (jobSlug === JOB_SLUG_EXPLORER) {
    unveilQuestId = pickExplorerUnveilQuestId(state, day);
  }

  const unveiledQuestIds =
    unveilQuestId && !state.unveiledQuestIds.includes(unveilQuestId)
      ? [...state.unveiledQuestIds, unveilQuestId]
      : state.unveiledQuestIds;

  const nextState: QuestState = {
    ...state,
    resources,
    skills,
    jobDailyActionBySlug,
    unveiledQuestIds,
    worldEventLog: appendUniqueWorldEntries(state.worldEventLog, worldLines),
  };

  return { state: nextState, worldLines, unveilQuestId };
}

export function switchActiveJob(state: QuestState, jobSlug: string): QuestState | null {
  if (jobSlug === JOB_SLUG_EXPLORER) return null;
  const job = getJobDefinition(jobSlug);
  if (!job) return null;

  const inVillage = state.flags.includes(VILLAGE_PHASE_FLAG);
  const unlocked = state.unlockedJobSlugs ?? [];
  const villageChoosable = VILLAGE_CHOOSEABLE_JOB_SLUGS.includes(
    jobSlug as (typeof VILLAGE_CHOOSEABLE_JOB_SLUGS)[number]
  );
  if (!inVillage && !unlocked.includes(jobSlug)) return null;
  if (inVillage && !villageChoosable) return null;

  if (state.activeJobSlug === jobSlug) return state;
  return { ...state, activeJobSlug: jobSlug };
}
