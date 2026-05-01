import {
  FEVER_DREAM_PENDING_FLAG,
  SWEET_DREAM_PENDING_FLAG,
} from '../constants';
import { createBranchingQuest } from './branching-quest-template';

export const quest014MushroomPatch = createBranchingQuest({
  id: 'quest-014-mushroom-patch',
  title: 'Mushroom Patch',
  briefing: 'Something colorful peeks from the leaf litter.',
  createdAt: 15,
  startStepId: 'mushroom-intro',
  steps: [
    {
      id: 'mushroom-intro',
      type: 'choice',
      text: 'You stumble upon a patch of mushrooms.',
      choices: [
        { id: 'mushroom-intro-taste', label: 'Taste one', nextStepId: 'mushroom-taste' },
        {
          id: 'mushroom-leave',
          label: 'Leave',
          nextStepId: 'mushroom-leave-outcome',
          completeQuest: true,
          effects: { flagsSet: [SWEET_DREAM_PENDING_FLAG] },
        },
      ],
    },
    {
      id: 'mushroom-taste',
      type: 'choice',
      text: "It's earthy and slightly sweet",
      choices: [
        {
          id: 'mushroom-eat-more',
          label: 'Eat more',
          nextStepId: 'mushroom-taste-outcome',
          completeQuest: true,
          effects: { flagsSet: [FEVER_DREAM_PENDING_FLAG] },
        },
        {
          id: 'mushroom-enough',
          label: "That's enough",
          nextStepId: 'mushroom-taste-outcome',
          completeQuest: true,
          effects: { flagsSet: [FEVER_DREAM_PENDING_FLAG] },
        },
      ],
    },
    {
      id: 'mushroom-taste-outcome',
      type: 'message',
      text: 'You walk away from the mushroom patch.',
      completeQuest: true,
    },
    {
      id: 'mushroom-leave-outcome',
      type: 'message',
      text: 'You left the mushroom patch alone.',
      completeQuest: true,
    },
  ],
});
