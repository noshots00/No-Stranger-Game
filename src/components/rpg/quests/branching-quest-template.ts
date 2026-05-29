import { isPlayerAtLocation } from '../locationPresence';
import type { QuestChoice, QuestContext, QuestDefinition, QuestState, QuestStep } from './types';

export type QuestAvailability = {
  minExplorationLevel?: number;
  minForagingLevel?: number;
  minMeleeAttackLevel?: number;
  requiresAnyCompletedQuestIds?: string[];
  requiresAnyFlags?: string[];
  /** Exact match on `QuestContext.currentLocation`. */
  requiresLocation?: string;
  /** Aggregate character level (sum of skill levels). */
  minCharacterLevel?: number;
  /** When true, only available if no race has been locked yet. */
  requiresAssignedRaceUnset?: boolean;
  /** When true, only available after `assignedRaceSlug` is set. */
  requiresLockedRace?: boolean;
  /** When true, only available after `lockedClassSlug` is set. */
  requiresLockedClass?: boolean;
  /** Earliest day (1-indexed) the quest may appear; combined with other gates via AND. */
  minDay?: number;
};

type ChoiceStepBlueprint = {
  id: string;
  type: 'choice';
  text: string;
  choices: QuestChoice[];
  worldEventLogAfterChoice?: string[];
};

type MessageStepBlueprint = {
  id: string;
  type: 'message';
  text: string;
  completeQuest?: boolean;
  nextStepId?: string;
};

export type StepBlueprint = ChoiceStepBlueprint | MessageStepBlueprint;

type BranchingQuestOptions = {
  id: string;
  title: string;
  briefing: string;
  createdAt: number;
  startStepId: string;
  availability?: QuestAvailability;
  steps: StepBlueprint[];
  completionRequiresAllFlags?: string[];
  toneTag?: 'vision' | 'echo' | 'mundane';
  resolveInitialStepId?: (state: QuestState) => string;
  mainDailyQuest?: boolean;
};

const includesAny = (haystack: string[], needles: string[]): boolean => needles.some((n) => haystack.includes(n));

/** Respects forest binge: `minDay` is ignored until `dayPacingActive`. */
export const meetsMinDay = (context: QuestContext, minDay: number): boolean =>
  !context.dayPacingActive || context.currentDay >= minDay;

const checkQuestAvailability = (
  availability: QuestAvailability | undefined,
  context: QuestContext,
  options?: { ignoreLocation?: boolean }
): boolean => {
  if (!availability) return true;
    if (
      typeof availability.minExplorationLevel === 'number' &&
      context.explorationLevel < availability.minExplorationLevel
    ) {
      return false;
    }
    if (typeof availability.minForagingLevel === 'number' && context.foragingLevel < availability.minForagingLevel) {
      return false;
    }
    if (
      typeof availability.minMeleeAttackLevel === 'number' &&
      context.meleeAttackLevel < availability.minMeleeAttackLevel
    ) {
      return false;
    }
    if (
      !options?.ignoreLocation &&
      typeof availability.requiresLocation === 'string' &&
      !isPlayerAtLocation(context, availability.requiresLocation)
    ) {
      return false;
    }
    if (
      typeof availability.minCharacterLevel === 'number' &&
      context.characterLevel < availability.minCharacterLevel
    ) {
      return false;
    }
    if (availability.requiresAssignedRaceUnset && context.assignedRaceSlug !== null) {
      return false;
    }
    if (availability.requiresLockedRace && context.assignedRaceSlug === null) {
      return false;
    }
    if (availability.requiresLockedClass && context.lockedClassSlug === null) {
      return false;
    }
    if (
      typeof availability.minDay === 'number' &&
      context.dayPacingActive &&
      context.currentDay < availability.minDay
    ) {
      return false;
    }
    if (
      Array.isArray(availability.requiresAnyCompletedQuestIds) &&
      availability.requiresAnyCompletedQuestIds.length > 0 &&
      !includesAny(context.completedQuestIds, availability.requiresAnyCompletedQuestIds)
    ) {
      return false;
    }
    if (
      Array.isArray(availability.requiresAnyFlags) &&
      availability.requiresAnyFlags.length > 0 &&
      !includesAny(context.flags, availability.requiresAnyFlags)
    ) {
      return false;
    }
    return true;
};

export const makeQuestAvailability =
  (availability?: QuestAvailability) =>
  (context: QuestContext): boolean => checkQuestAvailability(availability, context);

/** Saga unveil: prerequisite gates only (location is for travel/play, not listing). */
export const makeQuestUnveilEligibility =
  (availability?: QuestAvailability) =>
  (context: QuestContext): boolean =>
    checkQuestAvailability(availability, context, { ignoreLocation: true });

/** Play gates without day pacing or branch flags (those gate content, not the quest card). */
export function availabilityForSagaUnveil(
  availability?: QuestAvailability
): QuestAvailability | undefined {
  if (!availability) return undefined;
  const { minDay: _minDay, requiresAnyFlags: _flags, ...rest } = availability;
  return rest;
}

export function isQuestEligibleForUnveil(
  quest: Pick<QuestDefinition, 'isAvailable' | 'isUnveilEligible'>,
  context: QuestContext
): boolean {
  return (quest.isUnveilEligible ?? quest.isAvailable)(context);
}

export function createBranchingQuest(options: BranchingQuestOptions): QuestDefinition {
  const steps = options.steps.reduce<Record<string, QuestStep>>((acc, step) => {
    acc[step.id] = step;
    return acc;
  }, {});

  return {
    id: options.id,
    title: options.title,
    briefing: options.briefing,
    createdAt: options.createdAt,
    startStepId: options.startStepId,
    isAvailable: makeQuestAvailability(options.availability),
    isUnveilEligible: makeQuestUnveilEligibility(availabilityForSagaUnveil(options.availability)),
    journalSummaryFallback: options.title,
    steps,
    ...(options.completionRequiresAllFlags ? { completionRequiresAllFlags: options.completionRequiresAllFlags } : {}),
    ...(options.toneTag ? { toneTag: options.toneTag } : {}),
    ...(options.resolveInitialStepId ? { resolveInitialStepId: options.resolveInitialStepId } : {}),
    ...(options.mainDailyQuest ? { mainDailyQuest: true } : {}),
  };
}
