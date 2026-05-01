import type { QuestDefinition } from './types';

export const quest003SilverLake: QuestDefinition = {
  id: 'quest-003-silver-lake',
  title: 'Silver Lake',
  briefing: 'A still sheet of water beyond the pines. Placeholder beats until modifiers are wired.',
  createdAt: 3,
  startStepId: 'silver-d1',
  isAvailable: (context) => context.explorationLevel >= 4,
  steps: {
    'silver-d1': {
      id: 'silver-d1',
      type: 'choice',
      text: 'Dialogue 1',
      choices: [
        {
          id: 'silver-d1-a',
          label: 'Choice a',
          nextStepId: 'silver-d2',
        },
        {
          id: 'silver-d1-b',
          label: 'Choice b',
          nextStepId: 'silver-d2',
        },
      ],
    },
    'silver-d2': {
      id: 'silver-d2',
      type: 'choice',
      text: 'Dialogue 2',
      choices: [
        {
          id: 'silver-d2-a',
          label: 'Choice a',
          completeQuest: true,
          effects: {
            flagsSet: ['silver-lake-unlocked'],
          },
        },
        {
          id: 'silver-d2-b',
          label: 'Choice b',
          completeQuest: true,
          effects: {
            flagsSet: ['silver-lake-unlocked'],
          },
        },
      ],
    },
  },
};
