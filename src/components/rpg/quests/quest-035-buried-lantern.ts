import { createBranchingQuest } from './branching-quest-template';

export const quest035BuriedLantern = createBranchingQuest({
  id: 'quest-035-buried-lantern',
  title: 'Buried Lantern',
  briefing: '[placeholder] A lantern, half-buried, still flickers under shallow earth.',
  createdAt: 35,
  startStepId: 'lantern-intro',
  availability: { minDay: 9 },
  steps: [
    {
      id: 'lantern-intro',
      type: 'choice',
      text: '[placeholder] A faint glow pulses beneath shallow earth. A buried lantern, somehow still alight.',
      choices: [
        {
          id: 'lantern-claim',
          label: '[placeholder] Dig it free and claim the light for yourself',
          completeQuest: true,
          effects: { modifiersDelta: { WarriorClass: 1, Strength: 1 } },
        },
        {
          id: 'lantern-shelter',
          label: '[placeholder] Shield the flame and carry it gently to a shrine',
          completeQuest: true,
          effects: { modifiersDelta: { HealerClass: 1, Wisdom: 1 } },
        },
      ],
    },
  ],
});
