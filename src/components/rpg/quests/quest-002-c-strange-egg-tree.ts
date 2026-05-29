import { createQuestDefinition } from './quest-authoring-tool';

const FALL_TEXT =
  'A piece of bark rips off the tree and you tumble backwards from the tree. A series of low branches cushion your fall but you sustain a minor injury.';

export const quest002CStrangeEggTree = createQuestDefinition({
  id: 'quest-002-c-strange-egg-tree',
  title: 'The High Tree',
  briefing: 'A tall tree beckons. Climb carefully — the top may hold a secret.',
  createdAt: 2.5,
  startStepId: 'tree-intro',
  isAvailable: () => false,
  journalSummaryFallback: 'You climbed a high tree in the forest.',
  steps: [
    {
      id: 'tree-intro',
      type: 'message',
      text: 'This is harder than it looks...',
      nextStepId: 'tree-vista',
    },
    {
      id: 'tree-vista',
      type: 'message',
      text:
        'You shimmy up the tree with surprising agility but the activity exhausts you... you feel hungry and a little cold. Resting on a high branch you take a good look around...\n\nThere is higher ground to the North. To the East it looks like the trees thin. That is all you can see.',
      nextStepId: 'climb-attempt-1',
    },
    {
      id: 'climb-attempt-1',
      type: 'choice',
      text: 'The crown is still above you.',
      choices: [
        {
          id: 'q-tree-climb-1',
          label: 'Climb higher',
          randomBranch: { successStepId: 'nest-egg', failStepId: 'fall-1' },
        },
      ],
    },
    {
      id: 'fall-1',
      type: 'message',
      text: FALL_TEXT,
      nextStepId: 'climb-attempt-2',
    },
    {
      id: 'climb-attempt-2',
      type: 'choice',
      text: 'You try again.',
      choices: [
        {
          id: 'q-tree-climb-2',
          label: 'Climb higher',
          randomBranch: { successStepId: 'nest-egg', failStepId: 'fall-2' },
        },
      ],
    },
    {
      id: 'fall-2',
      type: 'message',
      text: FALL_TEXT,
      nextStepId: 'climb-attempt-3',
    },
    {
      id: 'climb-attempt-3',
      type: 'choice',
      text: 'You try again.',
      choices: [
        {
          id: 'q-tree-climb-3',
          label: 'Climb higher',
          randomBranch: { successStepId: 'nest-egg', failStepId: 'fall-3' },
        },
      ],
    },
    {
      id: 'fall-3',
      type: 'message',
      text: FALL_TEXT,
      nextStepId: 'climb-attempt-4',
    },
    {
      id: 'climb-attempt-4',
      type: 'choice',
      text: 'You try again.',
      choices: [
        {
          id: 'q-tree-climb-4',
          label: 'Climb higher',
          randomBranch: { successStepId: 'nest-egg', failStepId: 'fall-4' },
        },
      ],
    },
    {
      id: 'fall-4',
      type: 'message',
      text: FALL_TEXT,
      nextStepId: 'climb-attempt-5',
    },
    {
      id: 'climb-attempt-5',
      type: 'choice',
      text: 'One last try.',
      choices: [
        {
          id: 'q-tree-climb-5',
          label: 'Climb higher',
          randomBranch: { successStepId: 'nest-egg', failStepId: 'exhausted-end' },
        },
      ],
    },
    {
      id: 'nest-egg',
      type: 'message',
      text:
        'At the top you find a bird\'s nest tucked in the highest fork. Inside rests a strange egg — warm to the touch, faintly luminous in the failing light.',
      nextStepId: 'nest-egg-take',
    },
    {
      id: 'nest-egg-take',
      type: 'choice',
      text: '',
      choices: [
        {
          id: 'q-tree-take-egg',
          label: 'Take the strange egg',
          completeQuest: true,
          effects: {
            questItemsAdd: ['a strange egg'],
          },
          journalSummaryLineAdd: 'You found a strange egg in a nest at the top of a tree.',
        },
      ],
    },
    {
      id: 'exhausted-end',
      type: 'message',
      text:
        'You tumble down once more and give up. The crown of the tree stays out of reach — for now.',
      completeQuest: true,
    },
  ],
});
