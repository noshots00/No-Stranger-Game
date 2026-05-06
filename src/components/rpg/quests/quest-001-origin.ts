import type { QuestDefinition } from './types';

export const quest001Origin: QuestDefinition = {
  id: 'quest-001-origin',
  title: 'The Forest',
  briefing: 'You find yourself in the forest.',
  createdAt: 1,
  startStepId: 'start',
  isAvailable: () => true,
  journalSummariesByChoicePath: {
    'q1-click-here-to-continue|q2-i-dont-know|q3-my-name-is-':
      'You found yourself in a forest with no memory of how you got there. You remembered your name is {playerName}.',
  },
  stepVisuals: {
    start: [
      {
        kind: 'image-row',
        images: [
          {
            src: 'art/converted/batch-2026-05-02_21-10-35/pleasant-forest.webp',
            alt: 'Forest',
          },
          {
            src: 'art/converted/batch-2026-05-02_21-10-35/door-in-the-forest.webp',
            alt: 'Door in the forest',
          },
          {
            src: 'art/converted/batch-2026-05-02_21-10-35/dream-of-fae.webp',
            alt: 'Dream of fae',
          },
        ],
      },
    ],
    two: [
      {
        kind: 'image',
        src: 'art/converted/batch-2026-05-02_21-10-35/forest-gnomes.webp',
        alt: 'Forest gnomes',
      },
    ],
  },
  steps: {
    start: {
      id: 'start',
      type: 'choice',
      text: 'You find yourself in a forest.',
      choices: [
        {
          id: 'q1-click-here-to-continue',
          label: 'Click here to continue...',
          nextStepId: 'two',
        },
      ],
    },
    'two': {
      id: 'two',
      type: 'choice',
      text: "How did I get here?",
      choices: [
        {
          id: 'q2-i-dont-know',
          label: 'It\'s like I just woke up... only I don\'t remember a thing.',
          nextStepId: 'three',
         
        },
      ],
    },
    'three': {
      id: 'three',
      type: 'choice',
      text: 'I don\'t even remember my name...',
      choices: [
        {
          id: 'q3-my-name-is-',
          label: 'Wait... I think I remember something...',
          nextStepId: 'four',
        },
      ],
    },
    'four': {
      id: 'four',
      type: 'input',
      text: 'What is your name?',
      field: 'playerName',
      placeholder: 'Enter your name',
      submitLabel: 'Confirm Name',
      nextStepId: 'five',
    },
    'five': {
      id: 'five',
      type: 'message',
      text: 'Your name is... {playerName}!',
      completeQuest: true,
    },
  },
};
