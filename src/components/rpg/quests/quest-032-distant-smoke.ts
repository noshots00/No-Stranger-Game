import { createBranchingQuest } from './branching-quest-template';

export const quest032DistantSmoke = createBranchingQuest({
  id: 'quest-032-distant-smoke',
  title: 'Distant Smoke',
  briefing: '[placeholder] A column of smoke rises far off through the canopy.',
  createdAt: 32,
  startStepId: 'smoke-intro',
  availability: { minDay: 6 },
  steps: [
    {
      id: 'smoke-intro',
      type: 'choice',
      text: '[placeholder] A thin column of smoke rises from beyond the next ridge. You cannot tell yet what burns.',
      choices: [
        {
          id: 'smoke-charge',
          label: '[placeholder] March toward the smoke at speed',
          completeQuest: true,
          effects: { modifiersDelta: { WarriorClass: 1, Strength: 1 } },
        },
        {
          id: 'smoke-divine',
          label: '[placeholder] Read the wind for signs before approaching',
          completeQuest: true,
          effects: { modifiersDelta: { MageClass: 1, Intelligence: 1 } },
        },
        {
          id: 'smoke-circle',
          label: '[placeholder] Circle wide and watch from the trees',
          completeQuest: true,
          effects: { modifiersDelta: { RogueClass: 1, Dexterity: 1 } },
        },
      ],
    },
  ],
});
