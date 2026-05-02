import { createBranchingQuest } from './branching-quest-template';

export const quest033TwinMounds = createBranchingQuest({
  id: 'quest-033-twin-mounds',
  title: 'Twin Mounds',
  briefing: '[placeholder] Two grass-covered mounds rise side by side in the clearing.',
  createdAt: 33,
  startStepId: 'mounds-intro',
  availability: { minDay: 7 },
  steps: [
    {
      id: 'mounds-intro',
      type: 'choice',
      text: '[placeholder] Two old mounds sit shoulder to shoulder in the clearing, ringed by stones.',
      choices: [
        {
          id: 'mounds-circle',
          label: '[placeholder] Walk the boundary and read the placement',
          completeQuest: true,
          effects: { modifiersDelta: { RangerClass: 1, Wisdom: 1 } },
        },
        {
          id: 'mounds-listen',
          label: '[placeholder] Sit between them and listen for resonance',
          completeQuest: true,
          effects: { modifiersDelta: { MageClass: 1, Intelligence: 1 } },
        },
      ],
    },
  ],
});
