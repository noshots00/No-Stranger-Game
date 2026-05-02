import { createBranchingQuest } from './branching-quest-template';

export const quest025CrookedCairn = createBranchingQuest({
  id: 'quest-025-crooked-cairn',
  title: 'Crooked Cairn',
  briefing: '[placeholder] A pile of stones leans on a forest path, freshly disturbed.',
  createdAt: 25,
  startStepId: 'cairn-intro',
  availability: { minDay: 3 },
  steps: [
    {
      id: 'cairn-intro',
      type: 'choice',
      text: '[placeholder] A cairn of moss-covered stones leans crooked at the trail fork. Something has been moved.',
      choices: [
        {
          id: 'cairn-follow',
          label: '[placeholder] Follow the disturbance into the brush',
          completeQuest: true,
          effects: { modifiersDelta: { RangerClass: 1, Wisdom: 1 } },
        },
        {
          id: 'cairn-pocket',
          label: '[placeholder] Pocket whatever was hidden beneath the stones',
          completeQuest: true,
          effects: { modifiersDelta: { RogueClass: 1, Dexterity: 1 } },
        },
      ],
    },
  ],
});
