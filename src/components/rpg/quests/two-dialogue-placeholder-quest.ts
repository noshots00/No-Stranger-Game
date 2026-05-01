import type { QuestContext, QuestDefinition } from './types';

export type TwoDialoguePlaceholderQuestOptions = {
  id: string;
  title: string;
  briefing: string;
  createdAt: number;
  /** Minimum exploration skill level (`QuestContext.explorationLevel`) to list this quest. */
  minExplorationLevel: number;
  /** Unique prefix for step and choice ids (e.g. `silver`, `shelter`). */
  stepPrefix: string;
  /** Flags applied when the player picks either final choice. */
  completionFlags: string[];
  /** Defaults to `Dialogue 1`. */
  dialogue1Text?: string;
  /** Defaults to `Dialogue 2`. */
  dialogue2Text?: string;
};

/**
 * Two choice steps, two options each (placeholder labels Choice a / b).
 * Both paths through step 2 complete the quest and set `completionFlags`.
 */
export function createTwoDialoguePlaceholderQuest(
  options: TwoDialoguePlaceholderQuestOptions
): QuestDefinition {
  const dialogue1 = options.dialogue1Text ?? 'Dialogue 1';
  const dialogue2 = options.dialogue2Text ?? 'Dialogue 2';
  const p = options.stepPrefix;
  const step1Id = `${p}-d1`;
  const step2Id = `${p}-d2`;
  const completionEffects =
    options.completionFlags.length > 0
      ? { flagsSet: options.completionFlags }
      : undefined;

  return {
    id: options.id,
    title: options.title,
    briefing: options.briefing,
    createdAt: options.createdAt,
    startStepId: step1Id,
    isAvailable: (context: QuestContext) => context.explorationLevel >= options.minExplorationLevel,
    steps: {
      [step1Id]: {
        id: step1Id,
        type: 'choice',
        text: dialogue1,
        choices: [
          { id: `${p}-d1-a`, label: 'Choice a', nextStepId: step2Id },
          { id: `${p}-d1-b`, label: 'Choice b', nextStepId: step2Id },
        ],
      },
      [step2Id]: {
        id: step2Id,
        type: 'choice',
        text: dialogue2,
        choices: [
          {
            id: `${p}-d2-a`,
            label: 'Choice a',
            completeQuest: true,
            ...(completionEffects ? { effects: completionEffects } : {}),
          },
          {
            id: `${p}-d2-b`,
            label: 'Choice b',
            completeQuest: true,
            ...(completionEffects ? { effects: completionEffects } : {}),
          },
        ],
      },
    },
  };
}
