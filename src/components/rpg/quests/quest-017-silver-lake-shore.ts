import { SILVER_LAKE_FLAG } from '../constants';
import { createBranchingQuest } from './branching-quest-template';

export const quest017SilverLakeShore = createBranchingQuest({
  id: 'quest-017-silver-lake-shore',
  title: 'Silver Lake shore',
  briefing: 'The lake lies still at the tree line; you may linger by the water.',
  createdAt: 17,
  startStepId: 'shore-1',
  availability: {
    requiresAnyFlags: [SILVER_LAKE_FLAG],
    requiresLocation: 'Silver Lake',
    minExplorationLevel: 4,
  },
  steps: [
    {
      id: 'shore-1',
      type: 'choice',
      text: 'The water on the lake is still as glass.',
      choices: [
        { id: 'shore-leave', label: 'Leave for now', completeQuest: true },
        { id: 'shore-feel', label: 'Feel the water.', nextStepId: 'shore-2' },
      ],
    },
    {
      id: 'shore-2',
      type: 'message',
      text: 'The water is colder than you expected.',
      completeQuest: true,
    },
  ],
});
