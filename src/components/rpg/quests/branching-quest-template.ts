import type { QuestChoice, QuestContext, QuestDefinition, QuestStep } from './types';

type QuestAvailability = {
  minExplorationLevel?: number;
  minForagingLevel?: number;
  minMeleeAttackLevel?: number;
  requiresAnyCompletedQuestIds?: string[];
  requiresAnyFlags?: string[];
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

type StepBlueprint = ChoiceStepBlueprint | MessageStepBlueprint;

type BranchingQuestOptions = {
  id: string;
  title: string;
  briefing: string;
  createdAt: number;
  startStepId: string;
  availability?: QuestAvailability;
  steps: StepBlueprint[];
};

const includesAny = (haystack: string[], needles: string[]): boolean => needles.some((n) => haystack.includes(n));

export const makeQuestAvailability =
  (availability?: QuestAvailability) =>
  (context: QuestContext): boolean => {
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
    steps,
  };
}
