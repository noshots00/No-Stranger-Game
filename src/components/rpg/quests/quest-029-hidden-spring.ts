import { createBranchingQuest } from './branching-quest-template';

export const quest029HiddenSpring = createBranchingQuest({
  id: 'quest-029-hidden-spring',
  title: 'Hidden Spring',
  briefing: '[placeholder] A clear spring bubbles up beneath a stand of birch.',
  createdAt: 29,
  startStepId: 'spring-intro',
  availability: { minDay: 5 },
  steps: [
    {
      id: 'spring-intro',
      type: 'choice',
      text: '[placeholder] A small hidden spring murmurs at the foot of pale birches. The water is clearer than any you have seen.',
      choices: [
        {
          id: 'spring-bottle',
          label: '[placeholder] Fill a vessel for the wounded back at camp',
          completeQuest: true,
          effects: { modifiersDelta: { HealerClass: 1, Wisdom: 1 } },
        },
        {
          id: 'spring-mark',
          label: '[placeholder] Mark the spot for hunters and travellers',
          completeQuest: true,
          effects: { modifiersDelta: { RangerClass: 1, Wisdom: 1 } },
        },
      ],
    },
  ],
});
