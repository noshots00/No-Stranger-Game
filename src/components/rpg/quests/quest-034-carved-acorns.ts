import { createBranchingQuest } from './branching-quest-template';

export const quest034CarvedAcorns = createBranchingQuest({
  id: 'quest-034-carved-acorns',
  title: 'Carved Acorns',
  briefing: '[placeholder] A small pile of acorns has been carved with tiny marks.',
  createdAt: 34,
  startStepId: 'acorns-intro',
  availability: { minDay: 8 },
  steps: [
    {
      id: 'acorns-intro',
      type: 'choice',
      text: '[placeholder] Acorns are arranged in a small spiral on a flat stone. Each one bears a tiny carved mark.',
      choices: [
        {
          id: 'acorns-pocket',
          label: '[placeholder] Pocket the acorns silently and walk on',
          completeQuest: true,
          effects: { modifiersDelta: { RogueClass: 1, Dexterity: 1 } },
        },
        {
          id: 'acorns-call',
          label: '[placeholder] Call out a challenge to whoever set them here',
          completeQuest: true,
          effects: { modifiersDelta: { WarriorClass: 1, Strength: 1 } },
        },
      ],
    },
  ],
});
