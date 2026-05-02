import { createBranchingQuest } from './branching-quest-template';

/** Set when the player has finished the top-of-falls branch (returned to the pool). */
export const WATERFALL_FLAG_CLIMBED = 'quest-009-waterfall-climbed';
/** Set when the player has finished the behind-the-falls branch (returned to the pool). */
export const WATERFALL_FLAG_BEHIND = 'quest-009-waterfall-behind';

export const quest009Waterfall = createBranchingQuest({
  id: 'quest-009-waterfall',
  title: 'The Waterfall',
  briefing: 'A rushing waterfall appears deeper in the woods.',
  createdAt: 10,
  startStepId: 'waterfall-intro',
  availability: { minExplorationLevel: 3 },
  completionRequiresAllFlags: [WATERFALL_FLAG_CLIMBED, WATERFALL_FLAG_BEHIND],
  steps: [
    {
      id: 'waterfall-intro',
      type: 'choice',
      text: 'You follow the sound of rushing water to a beautiful waterfall about ten feet tall and ten feet wide.',
      choices: [
        {
          id: 'waterfall-climb-top',
          label: 'Climb to the top.',
          nextStepId: 'waterfall-climb-vista',
        },
        {
          id: 'waterfall-look-behind',
          label: 'Look behind the waterfall.',
          nextStepId: 'waterfall-behind-cavern',
        },
      ],
    },
    {
      id: 'waterfall-climb-vista',
      type: 'choice',
      text: 'You climbed to the top of the waterfall and saw...',
      choices: [
        {
          id: 'waterfall-vista-a',
          label: '[Placeholder] First thing you notice.',
          nextStepId: 'waterfall-after-climb',
        },
        {
          id: 'waterfall-vista-b',
          label: '[Placeholder] Another possibility.',
          nextStepId: 'waterfall-after-climb',
        },
        {
          id: 'waterfall-vista-c',
          label: '[Placeholder] A third angle.',
          nextStepId: 'waterfall-after-climb',
        },
      ],
    },
    {
      id: 'waterfall-after-climb',
      type: 'choice',
      text: 'You take it in. When you are ready, you can climb back down and explore the rest of the falls.',
      choices: [
        {
          id: 'waterfall-climb-return',
          label: 'Climb back down to the pool.',
          nextStepId: 'waterfall-intro',
          effects: { flagsSet: [WATERFALL_FLAG_CLIMBED] },
        },
      ],
    },
    {
      id: 'waterfall-behind-cavern',
      type: 'choice',
      text:
        'You slip behind the curtain of water. [Placeholder: what you find here will tie into another quest.]',
      choices: [
        {
          id: 'waterfall-behind-a',
          label: '[Placeholder] Option A.',
          nextStepId: 'waterfall-after-behind',
        },
        {
          id: 'waterfall-behind-b',
          label: '[Placeholder] Option B.',
          nextStepId: 'waterfall-after-behind',
        },
        {
          id: 'waterfall-behind-c',
          label: '[Placeholder] Option C.',
          nextStepId: 'waterfall-after-behind',
        },
      ],
    },
    {
      id: 'waterfall-after-behind',
      type: 'choice',
      text: 'Dripping, you step back from the hidden space. The roar of the falls fills your ears again.',
      choices: [
        {
          id: 'waterfall-behind-return',
          label: 'Return to the pool.',
          nextStepId: 'waterfall-intro',
          effects: { flagsSet: [WATERFALL_FLAG_BEHIND] },
        },
      ],
    },
  ],
});
