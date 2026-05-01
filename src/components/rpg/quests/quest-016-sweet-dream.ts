import { SWEET_DREAM_UNLOCKED_FLAG } from '../constants';
import { createBranchingQuest } from './branching-quest-template';

export const quest016SweetDream = createBranchingQuest({
  id: 'quest-016-sweet-dream',
  title: 'Sweet Dream',
  briefing: 'A gentle night after you walked away.',
  createdAt: 17,
  startStepId: 'sweet-dream-intro',
  availability: { requiresAnyFlags: [SWEET_DREAM_UNLOCKED_FLAG] },
  steps: [
    {
      id: 'sweet-dream-intro',
      type: 'choice',
      text: 'You have a nice dream.',
      choices: [
        { id: 'sweet-dream-pick-1', label: 'Choice 1', nextStepId: 'sweet-dream-outcome-1' },
        { id: 'sweet-dream-pick-2', label: 'Choice 2', nextStepId: 'sweet-dream-outcome-2' },
        { id: 'sweet-dream-pick-3', label: 'Choice 3', nextStepId: 'sweet-dream-outcome-3' },
      ],
    },
    { id: 'sweet-dream-outcome-1', type: 'message', text: 'Choice 1', completeQuest: true },
    { id: 'sweet-dream-outcome-2', type: 'message', text: 'Choice 2', completeQuest: true },
    { id: 'sweet-dream-outcome-3', type: 'message', text: 'Choice 3', completeQuest: true },
  ],
});
