import { createBranchingQuest } from './branching-quest-template';

export const quest023WhisperingTree = createBranchingQuest({
  id: 'quest-023-whispering-tree',
  title: 'Whispering Tree',
  briefing: '[placeholder] An old tree leans toward you, its bark scored with sigils.',
  createdAt: 23,
  startStepId: 'whispering-intro',
  availability: { minDay: 2 },
  steps: [
    {
      id: 'whispering-intro',
      type: 'choice',
      text: '[placeholder] You stop before a leaning tree carved with old marks. What do you do?',
      choices: [
        {
          id: 'whispering-tend',
          label: '[placeholder] Tend the wounded bark',
          completeQuest: true,
          effects: { modifiersDelta: { HealerClass: 1, Wisdom: 1 } },
        },
        {
          id: 'whispering-track',
          label: '[placeholder] Read the tracks around it',
          completeQuest: true,
          effects: { modifiersDelta: { RangerClass: 1, Wisdom: 1 } },
        },
      ],
    },
  ],
});
