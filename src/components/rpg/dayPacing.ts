import {
  BRACELET_DAILY_FLAG,
  DAILY_ITEM_QUEST_CHANCE,
  DILEMMA_DAILY_CHANCE,
  DAILY_XP,
  DAILY_XP_GRANTS_ENABLED,
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
import { DAY_REPORT_SPEAKER, isReportInfographicTitle } from './dialogueFormat';
import { appendUniqueWorldEntries, buildDayReportDialogueLines } from './helpers';
import { getJobDefinition } from './jobs/registry';
import {
  createInitialSkills,
  getCompletedQuestIds,
  getLevelFromXp,
  getQuestContext,
  isDayPacingActive,
  isVillagePhase,
} from './quests/engine';
import { pickNextSideQuestToUnveilOnDayRoll } from './quests/quest-saga';
import { SKILL_XP_KEYS, distributeDailySkillXp } from './quests/skills-config';
import type { DialogueLogEntry, QuestState } from './quests/types';
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

  if (!DAILY_XP_GRANTS_ENABLED) {
    return {
      ...state,
      lastDailyXpDay: nextDay,
      ...(nextResources !== undefined ? { resources: nextResources } : {}),
    };
  }

  const xpToGrant = daysToGrant * DAILY_XP;
  const skillGrants = distributeDailySkillXp(xpToGrant, 'exploring');
  const nextSkills = { ...state.skills };
  for (const key of SKILL_XP_KEYS) {
    nextSkills[key] = state.skills[key] + (skillGrants[key] ?? 0);
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

  const modifierBaseline = prevForReport.dayReportModifierBaseline ?? {};
  const prevForModifierReport: QuestState = {
    ...prevForReport,
    modifiers: { ...modifierBaseline },
    questItems: [...(prevForReport.dayReportQuestItemsBaseline ?? [])],
  };
  const reportLines = buildDayReportDialogueLines(endingDay, prevForModifierReport, updatedState);
  updatedState = {
    ...updatedState,
    dialogueLog: [...updatedState.dialogueLog, ...reportLines],
    lastDailyXpDay: nextDay,
    dayReportModifierBaseline: { ...updatedState.modifiers },
    dayReportQuestItemsBaseline: [...updatedState.questItems],
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

export function dayReportTitle(dayNumber: number): string {
  return `Day ${dayNumber} Report`;
}

/** @deprecated Legacy saves may still carry `playDayRollStaging`; cleared on reconcile. */
export function isPlayDayRollPending(state: QuestState): boolean {
  return Boolean(state.playDayRollStaging);
}

/**
 * Day-roll Continue UI blocks auto-track only while the quest that triggered the roll is still
 * active and incomplete. Other forest beats (e.g. Dyer's Crypt after Sunset) may still chain.
 */
export function isForestAutoTrackBlockedByDayRoll(state: QuestState): boolean {
  const staging = state.playDayRollStaging;
  if (!staging) return false;
  const activeId = state.activeQuestId;
  if (!activeId) return false;
  if (activeId !== staging.completedQuestId) return false;
  const prog = state.progressByQuestId[activeId];
  return Boolean(prog && !prog.isCompleted);
}

/** True when a day report block has at least one body line after its title. */
export function dayReportHasBody(
  dialogueLog: readonly DialogueLogEntry[],
  dayNumber: number
): boolean {
  const title = dayReportTitle(dayNumber);
  let inBlock = false;
  for (const line of dialogueLog) {
    if (line.speaker !== DAY_REPORT_SPEAKER) {
      if (inBlock) break;
      continue;
    }
    const trimmed = line.text.trim();
    if (trimmed === title) {
      inBlock = true;
      continue;
    }
    if (inBlock && isReportInfographicTitle(line.text)) break;
    if (inBlock && trimmed.length > 0) return true;
  }
  return false;
}

function stripDayReportBlock(
  dialogueLog: readonly DialogueLogEntry[],
  dayNumber: number
): DialogueLogEntry[] {
  const title = dayReportTitle(dayNumber);
  const out: DialogueLogEntry[] = [];
  let skipping = false;
  for (const line of dialogueLog) {
    if (line.speaker === DAY_REPORT_SPEAKER && line.text.trim() === title) {
      skipping = true;
      continue;
    }
    if (skipping) {
      if (line.speaker !== DAY_REPORT_SPEAKER) {
        skipping = false;
        out.push(line);
        continue;
      }
      if (isReportInfographicTitle(line.text)) {
        skipping = false;
        out.push(line);
      }
      continue;
    }
    out.push(line);
  }
  return out;
}

function forestDayOneSkillsGranted(state: QuestState): boolean {
  if (!DAILY_XP_GRANTS_ENABLED) return true;
  return (
    getLevelFromXp(state.skills.explorationXp) >= 1 && getLevelFromXp(state.skills.foragingXp) >= 1
  );
}

/** Legacy saves: backfill day report if missing, then clear obsolete Continue staging. */
export function reconcilePlayDayRollStaging(state: QuestState): QuestState {
  const staging = state.playDayRollStaging;
  if (!staging || staging.phase !== 'await_continue') return state;

  let next = state;
  if (!dayReportHasBody(state.dialogueLog, staging.endingDay)) {
    const prevForReport: QuestState = {
      ...state,
      ...staging.prevForReport,
      modifiers: { ...staging.prevForReport.modifiers },
      skills: { ...staging.prevForReport.skills },
      dayReportModifierBaseline: staging.prevForReport.dayReportModifierBaseline
        ? { ...staging.prevForReport.dayReportModifierBaseline }
        : undefined,
      dayReportQuestItemsBaseline: [...(staging.prevForReport.dayReportQuestItemsBaseline ?? [])],
      questItems: [...staging.prevForReport.questItems],
    };
    next = applyDayEndTransition({
      prevForReport,
      state,
      endingDay: staging.endingDay,
      nextDay: staging.nextDay,
      calendarDay: staging.calendarDay,
      sessionOnly: staging.sessionOnly,
    });
  }
  return { ...next, playDayRollStaging: undefined };
}

/** Repair forest saves: first night done but Day 1 XP/report missing or title-only. */
export function reconcileForestSessionDay(state: QuestState): QuestState {
  if (isVillagePhase(state.flags)) return state;
  if (!state.flags.includes('quest001-complete')) return state;

  const withStaging = reconcilePlayDayRollStaging(state);

  const reportOk = dayReportHasBody(withStaging.dialogueLog, 1);
  const skillsOk = forestDayOneSkillsGranted(withStaging);
  if (reportOk && skillsOk && withStaging.lastDailyXpDay >= 2) return withStaging;

  if (!skillsOk) {
    const cleaned = stripDayReportBlock(withStaging.dialogueLog, 1);
    const base: QuestState = {
      ...withStaging,
      dialogueLog: cleaned,
      lastDailyXpDay: 1,
      skills: createInitialSkills(),
    };
    return applyInSessionDayAdvanceAfterMainQuest(base, base, 1, true);
  }

  if (!reportOk) {
    const pseudoPrev: QuestState = {
      ...withStaging,
      skills: createInitialSkills(),
      modifiers: withStaging.dayReportModifierBaseline ?? {},
      questItems: [...(withStaging.dayReportQuestItemsBaseline ?? [])],
    };
    const reportLines = buildDayReportDialogueLines(1, pseudoPrev, withStaging);
    const bodyLines = reportLines.filter((line) => line.text.trim() !== dayReportTitle(1));
    if (bodyLines.length === 0) return withStaging;

    const hasTitle = withStaging.dialogueLog.some((line) => line.text.trim() === dayReportTitle(1));
    const dialogueLog = hasTitle
      ? [...withStaging.dialogueLog, ...bodyLines]
      : [...withStaging.dialogueLog, ...reportLines];

    const next =
      withStaging.lastDailyXpDay < 2
        ? {
            ...withStaging,
            lastDailyXpDay: 2,
            dayReportModifierBaseline: { ...withStaging.modifiers },
            dayReportQuestItemsBaseline: [...withStaging.questItems],
          }
        : withStaging;
    return { ...next, dialogueLog };
  }

  if (withStaging.lastDailyXpDay < 2) {
    return { ...withStaging, lastDailyXpDay: 2 };
  }

  return withStaging;
}

/**
 * Forest in-session: grant daily XP, append Day N Report to the journal feed (no Continue gate).
 */
export function stageInSessionDayAdvanceAfterMainQuest(
  prevState: QuestState,
  state: QuestState,
  calendarDay: number,
  _completedQuestId: string,
  sessionOnly = false
): QuestState {
  const rolled = applyInSessionDayAdvanceAfterMainQuest(prevState, state, calendarDay, sessionOnly);
  return { ...rolled, activeQuestId: null };
}

/** Advance staged day roll: clears staging after the player continues past report + recap. */
export function advancePlayDayRollPhase(state: QuestState): QuestState {
  const staging = state.playDayRollStaging;
  if (!staging) return state;
  return { ...state, playDayRollStaging: undefined };
}

/** In-session advance after main daily quest (e.g. first night): one day of XP + Day N Report. */
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
