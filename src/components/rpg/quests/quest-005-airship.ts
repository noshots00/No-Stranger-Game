import type { QuestDefinition } from './types';

export const quest005Airship: QuestDefinition = {
  id: 'quest-005-airship',
  title: 'Airship?!',
  briefing: 'A cannonball half-buried in the leaf litter. High in the canopy, the silhouette of a hull.',
  createdAt: 5,
  startStepId: 'airship-intro',
  isAvailable: (context) => context.explorationLevel >= 5,
  steps: {
    'airship-intro': {
      id: 'airship-intro',
      type: 'choice',
      text: 'You stumble across what can only be an ancient cannonball. Looking straight up, you see what looks like a massive ship high in the trees.',
      choices: [
        {
          id: 'airship-climb',
          label: 'Try to climb to the airship',
          nextStepId: 'airship-chickened-out',
          effects: { flagsSet: ['airship-discovered'] },
        },
        {
          id: 'airship-leave',
          label: 'Leave for now',
          completeQuest: true,
          effects: { flagsSet: ['airship-discovered'] },
        },
      ],
    },
    'airship-chickened-out': {
      id: 'airship-chickened-out',
      type: 'message',
      text: '{playerName} got about 20 feet off the ground and chickened out.',
      completeQuest: true,
    },
  },
};
