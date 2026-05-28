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
  QUEST_FIRST_NIGHT_ID,
} from '@/components/rpg/constants';
import { DAY_REPORT_SPEAKER } from '@/components/rpg/dialogueFormat';
import { restartQuestProgress } from '@/components/rpg/quests/engine';
import { mergeJournalRecapOnQuestComplete } from '@/components/rpg/quests/journalSummary';
import type { QuestDefinition, QuestProgress, QuestState } from '@/components/rpg/quests/types';
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

    if (qid === QUEST_FIRST_NIGHT_ID && quest.mainDailyQuest) {
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

  if (questId === QUEST_FIRST_NIGHT_ID) {
    next = {
      ...next,
      flags: Array.from(new Set([...next.flags, QUEST001_COMPLETE_FLAG])),
    };
  }

  return next;
}

/**
 * Dev-only: replay a quest from `startStepId` without wiping the character.
 * Clears completion, progress flags (`{questId}-*`), dialogue, and journal lines;
 * keeps modifiers, other quests, name, race, location, etc.
 */
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

export function devResetQuestById(
  state: QuestState,
  questId: string,
  questById: Record<string, QuestDefinition>
): QuestState {
  const quest = questById[questId];
  if (!quest) return state;

  const flagPrefix = `${questId}-`;
  let next = restartQuestProgress(state, quest);
  next = {
    ...next,
    activeQuestId: questId,
    flags: state.flags.filter((flag) => !flag.startsWith(flagPrefix)),
    dialogueLog: state.dialogueLog.filter((entry) => entry.sourceQuestId !== questId),
    journalLog: state.journalLog.filter((entry) => entry.questId !== questId),
    unveiledQuestIds: mergeUnveiled(state, [questId]),
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
