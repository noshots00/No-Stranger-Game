import { createBranchingQuest } from './branching-quest-template';

export const quest009Waterfall = createBranchingQuest({
  id: 'quest-009-waterfall',
  title: 'The Waterfall',
  briefing: 'A rushing waterfall appears deeper in the woods.',
  createdAt: 10,
  startStepId: 'waterfall-intro',
  availability: { minExplorationLevel: 3 },
  steps: [
    {
      id: 'waterfall-intro',
      type: 'choice',
      text: 'You follow the sound of rushing water to a beautiful waterfall about 10 feet tall and 10 feet wide.',
      choices: [
        {
          id: 'waterfall-climb-top',
          label: 'climb to the top',
          nextStepId: 'waterfall-climb-outcome',
        },
        {
          id: 'waterfall-look-behind',
          label: 'look behidn the waterfall',
          nextStepId: 'waterfall-behind-outcome',
        },
      ],
    },
    {
      id: 'waterfall-climb-outcome',
      type: 'message',
      text: 'you climbed to the top',
      completeQuest: true,
    },
    {
      id: 'waterfall-behind-outcome',
      type: 'message',
      text: 'you looked behind the waterfall',
      completeQuest: true,
    },
  ],
});
