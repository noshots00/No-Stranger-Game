/**
 * Dev-only story checkpoints: mutate QuestState in one place for header tools.
 * Not imported in production paths except via RPGInterface dev UI.
 */

import { formatInTimeZone } from 'date-fns-tz';
import { QUEST001_NAMED_FLAG } from '@/components/rpg/constants';
import type { QuestDefinition, QuestProgress, QuestState } from '@/components/rpg/quests/types';
import { EASTERN_GAME_TIMEZONE } from '@/lib/easternGameTime';

const QUEST001_COMPLETE_FLAG = 'quest001-complete';

/** Main arc B-chain order (must match gating elsewhere). */
export const MAIN_B_ARC_QUEST_IDS = [
  'quest-001-origin',
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
  const flags = Array.from(
    new Set([...state.flags, QUEST001_NAMED_FLAG, QUEST001_COMPLETE_FLAG])
  );
  return {
    ...state,
    playerName: name,
    characterCreationDateEastern: state.characterCreationDateEastern ?? todayEasternYmd(),
    flags,
  };
}

function applyCompletionsForPrefix(
  state: QuestState,
  questById: Record<string, QuestDefinition>,
  upToIncludingIndex: number
): QuestState {
  let next: QuestState = { ...state, activeQuestId: null, progressByQuestId: { ...state.progressByQuestId } };
  const toReveal: string[] = [];

  for (let i = 0; i <= upToIncludingIndex && i < MAIN_B_ARC_QUEST_IDS.length; i++) {
    const qid = MAIN_B_ARC_QUEST_IDS[i]!;
    const quest = questById[qid];
    if (!quest) continue;
    next.progressByQuestId[qid] = completedProgress(quest);
    toReveal.push(qid);
  }

  const nextIndex = upToIncludingIndex + 1;
  if (nextIndex < MAIN_B_ARC_QUEST_IDS.length) {
    toReveal.push(MAIN_B_ARC_QUEST_IDS[nextIndex]!);
  }

  next = {
    ...next,
    unveiledQuestIds: mergeUnveiled(next, toReveal),
  };

  if (upToIncludingIndex >= 0) {
    next = ensureNamedDevBasics(next);
  }

  return next;
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
        return 1;
      case 'after-3b':
        return 2;
      case 'after-4b':
        return 3;
      case 'after-5b':
        return 4;
      default:
        return 0;
    }
  })();

  return applyCompletionsForPrefix(state, questById, idx);
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

  return next;
}

export const STORY_CHECKPOINT_LABELS: Record<StoryCheckpointId, string> = {
  'after-origin': 'After origin (1 done)',
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
