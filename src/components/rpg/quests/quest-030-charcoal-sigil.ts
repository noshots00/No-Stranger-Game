import { createBranchingQuest } from './branching-quest-template';

export const quest030CharcoalSigil = createBranchingQuest({
  id: 'quest-030-charcoal-sigil',
  title: 'Charcoal Sigil',
  briefing: '[placeholder] A charcoal mark is scrawled across the trunk of an ironwood.',
  createdAt: 30,
  startStepId: 'sigil-intro',
  availability: { minDay: 5 },
  steps: [
    {
      id: 'sigil-intro',
      type: 'choice',
      text: '[placeholder] A black sigil is scrawled across the bark of an ironwood. The charcoal is still fresh.',
      choices: [
        {
          id: 'sigil-erase',
          label: '[placeholder] Smudge the mark away before it is seen',
          completeQuest: true,
        },
        {
          id: 'sigil-study',
          label: '[placeholder] Copy the sigil into your notes',
          completeQuest: true,
        },
      ],
    },
  ],
});
