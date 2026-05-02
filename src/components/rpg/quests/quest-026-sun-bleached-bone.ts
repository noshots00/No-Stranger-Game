import { createBranchingQuest } from './branching-quest-template';

export const quest026SunBleachedBone = createBranchingQuest({
  id: 'quest-026-sun-bleached-bone',
  title: 'Sun-Bleached Bone',
  briefing: '[placeholder] A bone juts from the leaf litter beside a small leather pouch.',
  createdAt: 26,
  startStepId: 'bone-intro',
  availability: { minDay: 3 },
  steps: [
    {
      id: 'bone-intro',
      type: 'choice',
      text: '[placeholder] A weathered bone and a small leather pouch lie together at the foot of a stump.',
      choices: [
        {
          id: 'bone-bury',
          label: '[placeholder] Bury the bone with quiet words',
          completeQuest: true,
          effects: { modifiersDelta: { HealerClass: 1, Wisdom: 1 } },
        },
        {
          id: 'bone-take-pouch',
          label: '[placeholder] Take the pouch and leave the bone where it lies',
          completeQuest: true,
          effects: { modifiersDelta: { RogueClass: 1, Dexterity: 1 } },
        },
      ],
    },
  ],
});
