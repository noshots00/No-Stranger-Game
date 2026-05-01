import { FEVER_DREAM_UNLOCKED_FLAG } from '../constants';
import { createBranchingQuest } from './branching-quest-template';

export const quest015FeverDream = createBranchingQuest({
  id: 'quest-015-fever-dream',
  title: 'Fever Dream',
  briefing: 'A restless night after the forest floor offered more than food.',
  createdAt: 16,
  startStepId: 'fever-dream-intro',
  availability: { requiresAnyFlags: [FEVER_DREAM_UNLOCKED_FLAG] },
  steps: [
    {
      id: 'fever-dream-intro',
      type: 'choice',
      text: 'You have a terrible dream.',
      choices: [
        { id: 'fever-dream-pick-1', label: 'Choice 1', nextStepId: 'fever-dream-outcome-1' },
        { id: 'fever-dream-pick-2', label: 'Choice 2', nextStepId: 'fever-dream-outcome-2' },
        { id: 'fever-dream-pick-3', label: 'Choice 3', nextStepId: 'fever-dream-outcome-3' },
      ],
    },
    { id: 'fever-dream-outcome-1', type: 'message', text: 'Choice 1', completeQuest: true },
    { id: 'fever-dream-outcome-2', type: 'message', text: 'Choice 2', completeQuest: true },
    { id: 'fever-dream-outcome-3', type: 'message', text: 'Choice 3', completeQuest: true },
  ],
});
