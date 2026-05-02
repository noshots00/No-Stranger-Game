import { createBranchingQuest } from './branching-quest-template';

export const quest024LoneSapling = createBranchingQuest({
  id: 'quest-024-lone-sapling',
  title: 'Lone Sapling',
  briefing: '[placeholder] A single sapling has taken root in the burned clearing.',
  createdAt: 24,
  startStepId: 'sapling-intro',
  availability: { minDay: 2 },
  steps: [
    {
      id: 'sapling-intro',
      type: 'choice',
      text: '[placeholder] A frail sapling clings to life in the ash. You crouch beside it.',
      choices: [
        {
          id: 'sapling-water',
          label: '[placeholder] Cup water from your skin and pour it on the roots',
          completeQuest: true,
          effects: { modifiersDelta: { HealerClass: 1, Constitution: 1 } },
        },
      ],
    },
  ],
});
