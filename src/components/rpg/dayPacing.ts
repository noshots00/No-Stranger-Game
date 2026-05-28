import {
  BRACELET_DAILY_FLAG,
  DAILY_ITEM_QUEST_CHANCE,
  DILEMMA_DAILY_CHANCE,
  DAILY_XP,
  EARRING_DAILY_FLAG,
  HAT_DAILY_FLAG,
  HEINZ_DAILY_FLAG,
  LIFEBOAT_DAILY_FLAG,
  PRISONER_DAILY_FLAG,
  SHOE_DAILY_FLAG,
  SOPHIE_DAILY_FLAG,
  TROLLEY_DAILY_FLAG,
  WOLF_ATTACK_DAILY_CHANCE,
  WOLF_ATTACK_DAILY_FLAG,
  DELAYED_QUEST_UNLOCKS,
} from './constants';
import { formatDayMarker } from './dayMilestones';
import { appendUniqueWorldEntries, buildDayReportDialogueLines } from './helpers';
import { getJobDefinition } from './jobs/registry';
import { getCompletedQuestIds, getQuestContext, isDayPacingActive, isVillagePhase } from './quests/engine';
import { pickNextSideQuestToUnveilOnDayRoll } from './quests/quest-saga';
import { SKILL_XP_KEYS, distributeDailySkillXp } from './quests/skills-config';
import type { QuestState } from './quests/types';
import { applyWolfHideDailyGrants } from './tavern/wolfHidesDaily';
import { getDeterministicDailyRoll } from '@/lib/deterministicDailyRoll';

const FLAG_TO_QUEST_ID: Record<string, string> = {
  [WOLF_ATTACK_DAILY_FLAG]: 'quest-008-wolf-attack',
  [EARRING_DAILY_FLAG]: 'quest-010-find-earring',
  [BRACELET_DAILY_FLAG]: 'quest-011-find-bracelet',
  [SHOE_DAILY_FLAG]: 'quest-012-find-shoe',
  [HAT_DAILY_FLAG]: 'quest-013-find-hat',
  [TROLLEY_DAILY_FLAG]: 'quest-017-ironwood-switch',
  [HEINZ_DAILY_FLAG]: 'quest-019-plaguebloom-phial',
  [PRISONER_DAILY_FLAG]: 'quest-020-iron-cage',
  [LIFEBOAT_DAILY_FLAG]: 'quest-021-nine-oar-raft',
  [SOPHIE_DAILY_FLAG]: 'quest-022-warlords-choice',
};

export type ApplyDayRollArgs = {
  /** State before XP/grants (for day report deltas). */
  prevForReport: QuestState;
  state: QuestState;
  /** In-game day that just ended (report title uses this). */
  endingDay: number;
  /** New `lastDailyXpDay` / day marker (the day now starting). */
  nextDay: number;
  /** Calendar day index for probabilistic rolls and wolf-hide grants. */
  calendarDay: number;
  /** Forest session roll: XP, report, and day marker only (no village daily flags). */
  sessionOnly?: boolean;
};

/** Grant daily XP/skills for `daysToGrant` and bump `lastDailyXpDay` to `nextDay` (no report/marker). */
export function applyDailyXpGrants(
  state: QuestState,
  daysToGrant: number,
  nextDay: number
): QuestState {
  if (daysToGrant <= 0) return { ...state, lastDailyXpDay: nextDay };
  const xpToGrant = daysToGrant * DAILY_XP;
  const skillGrants = distributeDailySkillXp(xpToGrant, 'exploring');
  const nextSkills = { ...state.skills };
  for (const key of SKILL_XP_KEYS) {
    nextSkills[key] = state.skills[key] + (skillGrants[key] ?? 0);
  }
  const activeJob = state.activeJobSlug ? getJobDefinition(state.activeJobSlug) : undefined;
  let nextResources = state.resources;
  if (activeJob) {
    const resources = { ...(state.resources ?? {}) };
    for (const [resourceKey, amountPerDay] of Object.entries(activeJob.dailyYields)) {
      if (!amountPerDay || amountPerDay <= 0) continue;
      resources[resourceKey] = (resources[resourceKey] ?? 0) + amountPerDay * daysToGrant;
    }
    nextResources = resources;
  }
  return {
    ...state,
    experience: state.experience + xpToGrant,
    skills: nextSkills,
    lastDailyXpDay: nextDay,
    ...(nextResources !== undefined ? { resources: nextResources } : {}),
  };
}

function applyDailyProbabilisticFlags(state: QuestState, calendarDay: number): QuestState {
  const completedQuestIdSet = new Set(getCompletedQuestIds(state));
  const dailyProbabilisticFlags: Array<{ flag: string; active: boolean }> = [
    { flag: WOLF_ATTACK_DAILY_FLAG, active: getDeterministicDailyRoll(calendarDay, 1) < WOLF_ATTACK_DAILY_CHANCE },
    { flag: EARRING_DAILY_FLAG, active: getDeterministicDailyRoll(calendarDay, 2) < DAILY_ITEM_QUEST_CHANCE },
    { flag: BRACELET_DAILY_FLAG, active: getDeterministicDailyRoll(calendarDay, 3) < DAILY_ITEM_QUEST_CHANCE },
    { flag: SHOE_DAILY_FLAG, active: getDeterministicDailyRoll(calendarDay, 4) < DAILY_ITEM_QUEST_CHANCE },
    { flag: HAT_DAILY_FLAG, active: getDeterministicDailyRoll(calendarDay, 5) < DAILY_ITEM_QUEST_CHANCE },
    {
      flag: TROLLEY_DAILY_FLAG,
      active:
        getDeterministicDailyRoll(calendarDay, 6) < DILEMMA_DAILY_CHANCE &&
        !completedQuestIdSet.has('quest-017-ironwood-switch'),
    },
    {
      flag: HEINZ_DAILY_FLAG,
      active:
        getDeterministicDailyRoll(calendarDay, 7) < DILEMMA_DAILY_CHANCE &&
        !completedQuestIdSet.has('quest-019-plaguebloom-phial'),
    },
    {
      flag: PRISONER_DAILY_FLAG,
      active:
        getDeterministicDailyRoll(calendarDay, 8) < DILEMMA_DAILY_CHANCE &&
        !completedQuestIdSet.has('quest-020-iron-cage'),
    },
    {
      flag: LIFEBOAT_DAILY_FLAG,
      active:
        getDeterministicDailyRoll(calendarDay, 9) < DILEMMA_DAILY_CHANCE &&
        !completedQuestIdSet.has('quest-021-nine-oar-raft'),
    },
    {
      flag: SOPHIE_DAILY_FLAG,
      active:
        getDeterministicDailyRoll(calendarDay, 10) < DILEMMA_DAILY_CHANCE &&
        !completedQuestIdSet.has('quest-022-warlords-choice'),
    },
  ];
  const probabilisticFlagSet = new Set(Object.keys(FLAG_TO_QUEST_ID));
  const retainedFlags = state.flags.filter((flag) => {
    if (!probabilisticFlagSet.has(flag)) return true;
    const questId = FLAG_TO_QUEST_ID[flag];
    return questId ? !completedQuestIdSet.has(questId) : false;
  });
  const candidateNewFlags = dailyProbabilisticFlags
    .filter((entry) => entry.active && !retainedFlags.includes(entry.flag))
    .slice(0, 1)
    .map((entry) => entry.flag);
  let promotedFlags = Array.from(new Set([...retainedFlags, ...candidateNewFlags]));
  for (const { pending, unlocked } of DELAYED_QUEST_UNLOCKS) {
    if (promotedFlags.includes(pending)) {
      promotedFlags = promotedFlags.filter((f) => f !== pending);
      if (!promotedFlags.includes(unlocked)) promotedFlags.push(unlocked);
    }
  }
  return { ...state, flags: promotedFlags };
}

/** End one narrative day: flags, optional side unveil, wolf hides, Day N Report, Day N+1... marker. */
export function applyDayEndTransition(args: ApplyDayRollArgs): QuestState {
  const { prevForReport, endingDay, nextDay, calendarDay, sessionOnly = false } = args;
  let updatedState = args.state;

  if (!sessionOnly && isVillagePhase(updatedState.flags)) {
    updatedState = applyDailyProbabilisticFlags(updatedState, calendarDay);

    if (isDayPacingActive(updatedState.flags)) {
      const ctxAfterDay = getQuestContext({ ...updatedState }, calendarDay);
      const completedIdsAfter = getCompletedQuestIds(updatedState);
      const sideUnveilCatchup = pickNextSideQuestToUnveilOnDayRoll(
        updatedState.unveiledQuestIds,
        completedIdsAfter,
        ctxAfterDay
      );
      if (sideUnveilCatchup) {
        updatedState = {
          ...updatedState,
          unveiledQuestIds: Array.from(new Set([...updatedState.unveiledQuestIds, sideUnveilCatchup])),
        };
      }
    }

    const wolfGrant = applyWolfHideDailyGrants(updatedState, calendarDay);
    updatedState = wolfGrant.state;
    if (wolfGrant.lines.length > 0) {
      updatedState = {
        ...updatedState,
        worldEventLog: appendUniqueWorldEntries(updatedState.worldEventLog, wolfGrant.lines),
      };
    }
  }

  const reportLines = buildDayReportDialogueLines(endingDay, prevForReport, updatedState);
  updatedState = {
    ...updatedState,
    dialogueLog: [...updatedState.dialogueLog, ...reportLines],
    worldEventLog: appendUniqueWorldEntries(updatedState.worldEventLog, [formatDayMarker(nextDay)]),
    lastDailyXpDay: nextDay,
  };

  return updatedState;
}

/** Calendar catch-up: grant XP for skipped days, then end the latest day with report + marker. */
export function applyCalendarDayCatchUp(prevState: QuestState, calendarDay: number): QuestState {
  const daysToGrant = calendarDay - prevState.lastDailyXpDay;
  if (daysToGrant <= 0) return prevState;
  const nextDay = calendarDay;
  const endingDay = nextDay - 1;
  let updated = applyDailyXpGrants(prevState, daysToGrant, nextDay);
  updated = applyDayEndTransition({
    prevForReport: prevState,
    state: updated,
    endingDay,
    nextDay,
    calendarDay,
  });
  return updated;
}

/** In-session advance after main daily quest (e.g. first night): one day of XP, Day 1 Report, Day 2... */
/** Repair pre–forest-day-roll saves: first night done but still on Day 1. */
export function reconcileForestSessionDay(state: QuestState): QuestState {
  if (isVillagePhase(state.flags)) return state;
  if (!state.flags.includes('quest001-complete')) return state;
  if (state.lastDailyXpDay >= 2) return state;

  const hasDay1Report = state.dialogueLog.some((line) => line.text === 'Day 1 Report');
  if (hasDay1Report) {
    return {
      ...state,
      lastDailyXpDay: 2,
      worldEventLog: appendUniqueWorldEntries(state.worldEventLog, [formatDayMarker(2)]),
    };
  }

  const anchor: QuestState = { ...state, lastDailyXpDay: 1 };
  return applyInSessionDayAdvanceAfterMainQuest(anchor, state, 1, true);
}

export function applyInSessionDayAdvanceAfterMainQuest(
  prevState: QuestState,
  state: QuestState,
  calendarDay: number,
  sessionOnly = false
): QuestState {
  const endingDay = prevState.lastDailyXpDay;
  const nextDay = endingDay + 1;
  let updated = applyDailyXpGrants(state, 1, nextDay);
  updated = applyDayEndTransition({
    prevForReport: prevState,
    state: updated,
    endingDay,
    nextDay,
    calendarDay,
    sessionOnly,
  });
  return updated;
}
