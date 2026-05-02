import { createBranchingQuest } from './branching-quest-template';

export const quest028ToppledStones = createBranchingQuest({
  id: 'quest-028-toppled-stones',
  title: 'Toppled Stones',
  briefing: '[placeholder] An old marker stone has been knocked from its plinth.',
  createdAt: 28,
  startStepId: 'stones-intro',
  availability: { minDay: 4 },
  steps: [
    {
      id: 'stones-intro',
      type: 'choice',
      text: '[placeholder] A weathered marker stone lies toppled at a crossroad. Symbols are carved into the moss-bound side.',
      choices: [
        {
          id: 'stones-lift',
          label: '[placeholder] Heave the stone back upright',
          completeQuest: true,
          effects: { modifiersDelta: { WarriorClass: 1, Strength: 1 } },
        },
        {
          id: 'stones-decipher',
          label: '[placeholder] Sit and decipher the carvings',
          completeQuest: true,
          effects: { modifiersDelta: { MageClass: 1, Intelligence: 1 } },
        },
        {
          id: 'stones-trail',
          label: '[placeholder] Search the brush for whoever toppled it',
          completeQuest: true,
          effects: { modifiersDelta: { RangerClass: 1, Wisdom: 1 } },
        },
      ],
    },
  ],
});
