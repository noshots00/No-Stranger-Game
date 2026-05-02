import { SILVER_LAKE_FLAG } from '../constants';
import { createBranchingQuest } from './branching-quest-template';

export const quest018SilverLakeReflection = createBranchingQuest({
  id: 'quest-018-silver-lake-reflection',
  title: 'Silver Lake reflection',
  briefing: 'Something below the surface waits for those strong enough to look.',
  createdAt: 18,
  startStepId: 'reflection-1',
  availability: {
    requiresAnyFlags: [SILVER_LAKE_FLAG],
    minCharacterLevel: 10,
    requiresAssignedRaceUnset: true,
  },
  steps: [
    {
      id: 'reflection-1',
      type: 'choice',
      text: 'You think you see a light in the water.',
      choices: [
        {
          id: 'reflection-leave',
          label: 'Leave for now.',
          effects: { clearActiveQuest: true },
          worldEventLogAdd: ['{playerName} stepped back from the silver light.'],
        },
        {
          id: 'reflection-lean',
          label: 'Lean forward.',
          nextStepId: 'reflection-2',
          effects: { assignRaceFromRaceModifiers: true },
        },
      ],
    },
    {
      id: 'reflection-2',
      type: 'message',
      text: 'You see... yourself!',
      completeQuest: true,
    },
  ],
});
