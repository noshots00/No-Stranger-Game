/**
 * Dev-only story checkpoints: mutate QuestState in one place for header tools.
 * Not imported in production paths except via RPGInterface dev UI.
 */

import { formatInTimeZone } from 'date-fns-tz';
import { applyQuestLevelMilestoneIfNeeded } from '@/components/rpg/dayMilestones';
import { applyInSessionDayAdvanceAfterMainQuest } from '@/components/rpg/dayPacing';
import {
  FOREST_PARENT_LOCATION,
  ORIGIN_QUEST_OPENED_FLAG,
  QUEST001_NAMED_FLAG,
  QUEST_018_SILVER_LAKE_REFLECTION_ID,
  QUEST_FIRST_NIGHT_ID,
  QUEST_SUNSET_ID,
} from '@/components/rpg/constants';
import { DAY_REPORT_SPEAKER } from '@/components/rpg/dialogueFormat';
import {
  resyncCharacterLocksAfterModifierRewind,
  restartQuestProgress,
} from '@/components/rpg/quests/engine';
import { mergeJournalRecapOnQuestComplete } from '@/components/rpg/quests/journalSummary';
import type { ModifierMap, QuestDefinition, QuestProgress, QuestState } from '@/components/rpg/quests/types';
import { EASTERN_GAME_TIMEZONE } from '@/lib/easternGameTime';

const QUEST001_COMPLETE_FLAG = 'quest001-complete';

/** Main arc B-chain order (must match gating elsewhere). */
export const MAIN_B_ARC_QUEST_IDS = [
  'quest-001-origin',
  QUEST_FIRST_NIGHT_ID,
  'quest-002-b-will-i-starve',
  'quest-003-b-meet-merchant',
  'quest-004-b-the-door',
  'quest-005-b-home',
] as const;

export type StoryCheckpointId =
  | 'after-origin'
  | 'after-2b'
  | 'after-3b'
  | 'after-4b'
  | 'after-5b';

function todayEasternYmd(): string {
  return formatInTimeZone(Date.now(), EASTERN_GAME_TIMEZONE, 'yyyy-MM-dd');
}

function completedProgress(quest: QuestDefinition): QuestProgress {
  return {
    currentStepId: quest.startStepId,
    isCompleted: true,
    choiceHistory: [],
  };
}

function mergeUnveiled(state: QuestState, ids: readonly string[]): string[] {
  return Array.from(new Set([...state.unveiledQuestIds, ...ids]));
}

/** Ensures name + creation date exist for downstream gates. */
function ensureNamedDevBasics(state: QuestState): QuestState {
  const name = state.playerName.trim().length > 0 ? state.playerName : 'Developer';
  const flags = Array.from(new Set([...state.flags, QUEST001_NAMED_FLAG]));
  return {
    ...state,
    playerName: name,
    characterCreationDateEastern: state.characterCreationDateEastern ?? todayEasternYmd(),
    flags,
  };
}

function isDayReportDialogueLine(text: string): boolean {
  return /^Day\s+\d+\s+Report$/i.test(text.trim());
}

function filterDialogueForPrefix(
  dialogueLog: QuestState['dialogueLog'],
  keepQuestIds: Set<string>
): QuestState['dialogueLog'] {
  return dialogueLog.filter((entry) => {
    if (entry.sourceQuestId && !keepQuestIds.has(entry.sourceQuestId)) return false;
    if (entry.speaker === DAY_REPORT_SPEAKER || isDayReportDialogueLine(entry.text)) return false;
    return true;
  });
}

function filterWorldLogForPrefix(worldEventLog: QuestState['worldEventLog']): QuestState['worldEventLog'] {
  return worldEventLog.filter((entry) => !/^Day\s+\d+\.\.\./i.test(entry.text));
}

/**
 * Mark main-arc quests `0..arcIndex` complete and rebuild journal recaps, play milestones,
 * and (after first night) in-session day roll — same outcomes as playing through in order.
 */
function rebuildPrefixThroughArcIndex(
  state: QuestState,
  arcIndex: number,
  questById: Record<string, QuestDefinition>
): QuestState {
  const keepQuestIds = prefixQuestIds(arcIndex);

  const anchorQuestId = MAIN_B_ARC_QUEST_IDS[arcIndex]!;
  const anchorModifiers = {
    ...(state.modifiersAfterQuestComplete?.[anchorQuestId] ?? {}),
  };

  const keptSnapshots: Record<string, ModifierMap> = {};
  for (const qid of keepQuestIds) {
    const snap = state.modifiersAfterQuestComplete?.[qid];
    if (snap) keptSnapshots[qid] = snap;
  }

  let accum: QuestState = {
    ...state,
    activeQuestId: null,
    currentLocation: FOREST_PARENT_LOCATION,
    progressByQuestId: {},
    journalLog: [],
    dialogueLog: filterDialogueForPrefix(state.dialogueLog, keepQuestIds),
    worldEventLog: filterWorldLogForPrefix(state.worldEventLog),
    flags: [],
    lastDailyXpDay: 1,
    modifiers: anchorModifiers,
    dayReportModifierBaseline: { ...anchorModifiers },
    modifiersAfterQuestComplete: keptSnapshots,
    unveiledQuestIds: ['quest-001-origin'],
    acknowledgedTravelLocationIds:
      arcIndex >= 3 ? [...(state.acknowledgedTravelLocationIds ?? [])] : [],
  };

  for (let i = 0; i <= arcIndex && i < MAIN_B_ARC_QUEST_IDS.length; i++) {
    const qid = MAIN_B_ARC_QUEST_IDS[i]!;
    const quest = questById[qid];
    if (!quest) continue;

    const prev = accum;
    accum = {
      ...accum,
      progressByQuestId: {
        ...accum.progressByQuestId,
        [qid]: completedProgress(quest),
      },
    };

    if (i === 0) {
      accum = {
        ...ensureNamedDevBasics(accum),
        playerName: state.playerName.trim().length > 0 ? state.playerName : accum.playerName,
        characterCreationDateEastern:
          state.characterCreationDateEastern ?? accum.characterCreationDateEastern,
      };
    }
    if (i >= 1) {
      accum = {
        ...accum,
        flags: Array.from(new Set([...accum.flags, QUEST001_COMPLETE_FLAG])),
      };
    }

    accum = mergeJournalRecapOnQuestComplete(prev, accum, quest);
    accum = applyQuestLevelMilestoneIfNeeded(prev, accum, qid);

    if (qid === QUEST_SUNSET_ID && quest.mainDailyQuest) {
      accum = applyInSessionDayAdvanceAfterMainQuest(prev, accum, Math.max(1, accum.lastDailyXpDay), true);
    }
  }

  const toReveal = MAIN_B_ARC_QUEST_IDS.slice(0, Math.min(arcIndex + 2, MAIN_B_ARC_QUEST_IDS.length));
  accum = {
    ...accum,
    unveiledQuestIds: Array.from(new Set(toReveal)),
  };

  return accum;
}

/**
 * Jump main arc to a named checkpoint (completes prerequisite quests in order).
 */
export function applyStoryCheckpoint(
  state: QuestState,
  checkpoint: StoryCheckpointId,
  questById: Record<string, QuestDefinition>
): QuestState {
  const idx = (() => {
    switch (checkpoint) {
      case 'after-origin':
        return 0;
      case 'after-2b':
        return 2;
      case 'after-3b':
        return 3;
      case 'after-4b':
        return 4;
      case 'after-5b':
        return 5;
      default:
        return 0;
    }
  })();

  const anchorId = MAIN_B_ARC_QUEST_IDS[idx];
  if (!anchorId) return state;
  return devStartFromQuestAnchor(state, anchorId, questById);
}

/**
 * Mark a single quest complete (by id). Id must exist in registry.
 */
export function devCompleteQuestById(
  state: QuestState,
  questId: string,
  questById: Record<string, QuestDefinition>
): QuestState {
  const quest = questById[questId];
  if (!quest) return state;

  let next: QuestState = {
    ...state,
    progressByQuestId: {
      ...state.progressByQuestId,
      [questId]: completedProgress(quest),
    },
    unveiledQuestIds: mergeUnveiled(state, [questId]),
    activeQuestId: state.activeQuestId === questId ? null : state.activeQuestId,
  };

  if (questId === 'quest-001-origin') {
    next = ensureNamedDevBasics(next);
  }

  if (questId === QUEST_SUNSET_ID) {
    next = {
      ...next,
      flags: Array.from(new Set([...next.flags, QUEST001_COMPLETE_FLAG])),
    };
  }

  return next;
}

export function isMainArcQuestId(questId: string): boolean {
  return (MAIN_B_ARC_QUEST_IDS as readonly string[]).includes(questId);
}

function mainArcIndex(questId: string): number {
  return MAIN_B_ARC_QUEST_IDS.indexOf(questId as (typeof MAIN_B_ARC_QUEST_IDS)[number]);
}

function prefixQuestIds(arcIndex: number): Set<string> {
  return new Set(MAIN_B_ARC_QUEST_IDS.slice(0, arcIndex + 1));
}

function filterFlagsForAnchor(flags: readonly string[], arcIndex: number, keepQuestIds: Set<string>): string[] {
  const out: string[] = [];
  for (const flag of flags) {
    if (flag === QUEST001_NAMED_FLAG || flag === ORIGIN_QUEST_OPENED_FLAG) {
      if (arcIndex >= 0) out.push(flag);
      continue;
    }
    if (flag === QUEST001_COMPLETE_FLAG) {
      if (arcIndex >= 1) out.push(flag);
      continue;
    }
    const owner = MAIN_B_ARC_QUEST_IDS.find((qid) => flag.startsWith(`${qid}-`));
    if (owner) {
      if (keepQuestIds.has(owner)) out.push(flag);
      continue;
    }
  }
  return Array.from(new Set(out));
}

/**
 * Dev rewind: treat `anchorQuestId` as the last completed main-arc beat; clear everything after it.
 * Rebuilds journal recaps, play milestones, and day pacing through the anchor (same as a real playthrough).
 */
export function devStartFromQuestAnchor(
  state: QuestState,
  anchorQuestId: string,
  questById: Record<string, QuestDefinition>
): QuestState {
  const arcIndex = mainArcIndex(anchorQuestId);
  if (arcIndex < 0) return state;

  const keepQuestIds = prefixQuestIds(arcIndex);
  const base: QuestState = {
    ...state,
    flags: filterFlagsForAnchor(state.flags, arcIndex, keepQuestIds),
  };

  return rebuildPrefixThroughArcIndex(base, arcIndex, questById);
}

/** Modifier map before `questId` (last completed predecessor snapshot). */
export function modifierBaselineBeforeQuest(
  state: QuestState,
  questId: string,
  orderedQuestIds: readonly string[]
): ModifierMap {
  const arcIdx = mainArcIndex(questId);
  if (arcIdx > 0) {
    const prevMain = MAIN_B_ARC_QUEST_IDS[arcIdx - 1]!;
    return { ...(state.modifiersAfterQuestComplete?.[prevMain] ?? {}) };
  }
  if (arcIdx === 0) return {};

  const idx = orderedQuestIds.indexOf(questId);
  const atOpen = state.progressByQuestId[questId]?.modifiersAtQuestOpen;
  if (atOpen) return { ...atOpen };
  for (let i = idx - 1; i >= 0; i--) {
    const pid = orderedQuestIds[i]!;
    const snap = state.modifiersAfterQuestComplete?.[pid];
    if (snap) return { ...snap };
  }
  return {};
}

function shouldClearAssignedRaceOnRestart(
  restartQuestId: string,
  orderedQuestIds: readonly string[]
): boolean {
  const raceIdx = orderedQuestIds.indexOf(QUEST_018_SILVER_LAKE_REFLECTION_ID);
  const questIdx = orderedQuestIds.indexOf(restartQuestId);
  if (raceIdx < 0 || questIdx < 0) return false;
  return questIdx <= raceIdx;
}

function pruneModifiersAfterQuestComplete(
  snapshots: Record<string, ModifierMap> | undefined,
  clearedQuestIds: Set<string>
): Record<string, ModifierMap> | undefined {
  if (!snapshots) return undefined;
  const next: Record<string, ModifierMap> = {};
  for (const [qid, map] of Object.entries(snapshots)) {
    if (!clearedQuestIds.has(qid)) next[qid] = map;
  }
  return next;
}

function clearQuestsFromIndex(
  state: QuestState,
  questIdsToClear: readonly string[]
): QuestState {
  const clearSet = new Set(questIdsToClear);
  const progressByQuestId = { ...state.progressByQuestId };
  for (const qid of questIdsToClear) {
    delete progressByQuestId[qid];
  }

  const flags = state.flags.filter((flag) => {
    for (const qid of questIdsToClear) {
      if (flag.startsWith(`${qid}-`)) return false;
    }
    return true;
  });

  const dialogueLog = state.dialogueLog.filter(
    (entry) => !entry.sourceQuestId || !clearSet.has(entry.sourceQuestId)
  );
  const journalLog = state.journalLog.filter((entry) => !clearSet.has(entry.questId));

  return {
    ...state,
    progressByQuestId,
    flags,
    dialogueLog,
    journalLog,
    modifiersAfterQuestComplete: pruneModifiersAfterQuestComplete(
      state.modifiersAfterQuestComplete,
      clearSet
    ),
  };
}

/**
 * Dev Restart From: rewind to before `questId`, drop that quest's modifiers and all later quest progress.
 */
export function devRestartFromQuest(
  state: QuestState,
  questId: string,
  questById: Record<string, QuestDefinition>,
  orderedQuestIds: readonly string[]
): QuestState {
  const quest = questById[questId];
  if (!quest) return state;

  const arcIdx = mainArcIndex(questId);
  let next = state;

  if (arcIdx > 0) {
    const previousMainArcQuestId = MAIN_B_ARC_QUEST_IDS[arcIdx - 1]!;
    next = devStartFromQuestAnchor(next, previousMainArcQuestId, questById);
  } else if (arcIdx === 0) {
    next = {
      ...next,
      modifiers: {},
      dayReportModifierBaseline: {},
      modifiersAfterQuestComplete: {},
      assignedRaceSlug: null,
      lockedClassSlug: null,
    };
  }

  const startIdx = orderedQuestIds.indexOf(questId);
  const questsToClear = startIdx >= 0 ? orderedQuestIds.slice(startIdx) : [questId];
  next = clearQuestsFromIndex(next, questsToClear);

  const baseline = modifierBaselineBeforeQuest(state, questId, orderedQuestIds);
  next = {
    ...next,
    modifiers: { ...baseline },
    dayReportModifierBaseline: { ...baseline },
    ...(shouldClearAssignedRaceOnRestart(questId, orderedQuestIds)
      ? { assignedRaceSlug: null }
      : {}),
  };
  next = resyncCharacterLocksAfterModifierRewind(next);

  next = devResetQuestById(next, questId, questById, { skipModifierRewind: true });

  const progress = next.progressByQuestId[questId];
  if (progress) {
    next = {
      ...next,
      progressByQuestId: {
        ...next.progressByQuestId,
        [questId]: {
          ...progress,
          modifiersAtQuestOpen: { ...baseline },
        },
      },
    };
  }

  return next;
}

export function devResetQuestById(
  state: QuestState,
  questId: string,
  questById: Record<string, QuestDefinition>,
  options?: { skipModifierRewind?: boolean; orderedQuestIds?: readonly string[] }
): QuestState {
  const quest = questById[questId];
  if (!quest) return state;

  const flagPrefix = `${questId}-`;
  const baseline =
    state.progressByQuestId[questId]?.modifiersAtQuestOpen ??
    (options?.orderedQuestIds
      ? modifierBaselineBeforeQuest(state, questId, options.orderedQuestIds)
      : state.modifiers);

  let next = restartQuestProgress(state, quest);
  if (!options?.skipModifierRewind) {
    next = {
      ...next,
      modifiers: { ...baseline },
      dayReportModifierBaseline: { ...baseline },
    };
    next = resyncCharacterLocksAfterModifierRewind(next);
  }

  next = {
    ...next,
    activeQuestId: questId,
    flags: state.flags.filter((flag) => !flag.startsWith(flagPrefix)),
    dialogueLog: state.dialogueLog.filter((entry) => entry.sourceQuestId !== questId),
    journalLog: state.journalLog.filter((entry) => entry.questId !== questId),
    unveiledQuestIds: mergeUnveiled(state, [questId]),
    progressByQuestId: {
      ...next.progressByQuestId,
      [questId]: {
        ...next.progressByQuestId[questId]!,
        modifiersAtQuestOpen: { ...baseline },
      },
    },
  };

  if (questId === 'quest-001-origin') {
    next = ensureNamedDevBasics(next);
  }

  return next;
}

export const STORY_CHECKPOINT_LABELS: Record<StoryCheckpointId, string> = {
  'after-origin': 'After origin (name)',
  'after-2b': 'After Will I Starve? (2b)',
  'after-3b': 'After Meet merchant (3b)',
  'after-4b': 'After The Door (4b)',
  'after-5b': 'After Smoke test home (5b)',
};

/** Stable UI order for checkpoint buttons. */
export const STORY_CHECKPOINT_ORDER: StoryCheckpointId[] = [
  'after-origin',
  'after-2b',
  'after-3b',
  'after-4b',
  'after-5b',
];
