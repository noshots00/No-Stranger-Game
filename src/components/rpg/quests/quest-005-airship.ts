import { createBranchingQuest } from './branching-quest-template';

export const quest005Airship = createBranchingQuest({
  id: 'quest-005-airship',
  title: 'An Airship?!',
  briefing: 'A cannonball half-buried in the leaf litter. High in the canopy, the silhouette of a hull.',
  createdAt: 5,
  startStepId: 'airship-intro',
  availability: { minExplorationLevel: 5 },
  steps: [
    {
      id: 'airship-intro',
      type: 'choice',
      text: 'You stumble across what can only be an ancient cannonball. Looking straight up, you see what looks like a massive ship high in the trees.',
      worldEventLogAfterChoice: ['{playerName} discovered the airship.'],
      choices: [
        {
          id: 'airship-climb',
          label: 'Try to climb to the airship',
          nextStepId: 'airship-chickened-out',
          effects: {
            flagsSet: ['airship-discovered'],
            modifiersDelta: {
              CourageTrait: 1,
              GnomeRace: 1,
              DwarfRace: 1,
              HighElfRace: 1,
              AtlantiansRace: 1,
            },
          },
        },
        {
          id: 'airship-leave',
          label: 'Leave for now',
          completeQuest: true,
          effects: {
            flagsSet: ['airship-discovered'],
            modifiersDelta: {
              HalflingRace: 1,
              River_KingdomRace: 1,
              CatfolkRace: 1,
            },
          },
        },
      ],
    },
    {
      id: 'airship-chickened-out',
      type: 'message',
      text: '{playerName} got about 20 feet off the ground and chickened out.',
      completeQuest: true,
    },
  ],
});
