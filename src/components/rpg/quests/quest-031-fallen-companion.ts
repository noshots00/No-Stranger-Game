import { createBranchingQuest } from './branching-quest-template';

export const quest031FallenCompanion = createBranchingQuest({
  id: 'quest-031-fallen-companion',
  title: 'Fallen Companion',
  briefing: '[placeholder] A wounded traveller leans against a hollow log.',
  createdAt: 31,
  startStepId: 'companion-intro',
  availability: { minDay: 6 },
  steps: [
    {
      id: 'companion-intro',
      type: 'choice',
      text: '[placeholder] A traveller, pale and bleeding, slumps against a hollow log. They have not seen you yet.',
      choices: [
        {
          id: 'companion-bind',
          label: '[placeholder] Bind their wound and stay until they wake',
          completeQuest: true,
          effects: { modifiersDelta: { HealerClass: 1, Wisdom: 1 } },
        },
      ],
    },
  ],
});
