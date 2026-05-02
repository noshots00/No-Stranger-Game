import { createBranchingQuest } from './branching-quest-template';

export const quest027SleepingHare = createBranchingQuest({
  id: 'quest-027-sleeping-hare',
  title: 'Sleeping Hare',
  briefing: '[placeholder] A hare lies in a thicket, breathing shallowly.',
  createdAt: 27,
  startStepId: 'hare-intro',
  availability: { minDay: 4 },
  steps: [
    {
      id: 'hare-intro',
      type: 'choice',
      text: '[placeholder] A hare nests in the brambles, eyes half-closed, flank fluttering.',
      choices: [
        {
          id: 'hare-stalk',
          label: '[placeholder] Stalk closer through the leaves',
          completeQuest: true,
          effects: { modifiersDelta: { RangerClass: 1, Dexterity: 1 } },
        },
        {
          id: 'hare-mend',
          label: '[placeholder] Tend its torn flank with herbs',
          completeQuest: true,
          effects: { modifiersDelta: { HealerClass: 1, Wisdom: 1 } },
        },
      ],
    },
  ],
});
