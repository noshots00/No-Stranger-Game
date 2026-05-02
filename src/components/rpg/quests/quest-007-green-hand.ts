import { createBranchingQuest } from './branching-quest-template';

export const quest007GreenHand = createBranchingQuest({
  id: 'quest-007-green-hand',
  title: 'The Green Hand',
  briefing: 'Something hard in the forest floor reveals a strange green hand.',
  createdAt: 8,
  startStepId: 'green-hand-intro',
  availability: { minForagingLevel: 2 },
  steps: [
    {
      id: 'green-hand-intro',
      type: 'choice',
      text: 'You trip over something hard, sending you face first into the ground. A bright green hand is sticking straight up out of the ground.',
      choices: [
        {
          id: 'green-hand-closer-look',
          label: 'Take a closer look',
          nextStepId: 'green-hand-discovery',
          worldEventLogAdd: ['{playerName} found the Green Hand!'],
        },
        { id: 'green-hand-leave', label: 'Leave for now', completeQuest: true },
      ],
    },
    {
      id: 'green-hand-discovery',
      type: 'message',
      text: 'You dig down as far as you can with your hands and a stick, exposing a life sized human arm and the top of a head, carved out of a brilliant green mineral. It appears there is an entire statue buried in the ground. If we had a shovel...',
      completeQuest: true,
    },
  ],
});
