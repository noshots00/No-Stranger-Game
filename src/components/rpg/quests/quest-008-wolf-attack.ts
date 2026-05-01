import { createBranchingQuest } from './branching-quest-template';
import { WOLF_ATTACK_DAILY_FLAG } from '../constants';

export const quest008WolfAttack = createBranchingQuest({
  id: 'quest-008-wolf-attack',
  title: 'Wolf Attack',
  briefing: 'You were attacked by a wolf. What happened?',
  createdAt: 9,
  startStepId: 'wolf-attack-intro',
  availability: {
    requiresAnyFlags: [WOLF_ATTACK_DAILY_FLAG],
  },
  steps: [
    {
      id: 'wolf-attack-intro',
      type: 'choice',
      text: 'You were attacked by a wolf. What happened?',
      choices: [
        { id: 'wolf-attack-a', label: 'You fought it off with your bare hands', completeQuest: true },
        { id: 'wolf-attack-b', label: 'You cast a spell', completeQuest: true },
        { id: 'wolf-attack-c', label: 'You jammed a fork in the wofls eye', completeQuest: true },
        { id: 'wolf-attack-d', label: "You ran away and the wolf didn't follow.", completeQuest: true },
      ],
    },
  ],
});
