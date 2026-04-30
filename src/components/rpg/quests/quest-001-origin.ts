import type { QuestDefinition } from './types';

export const quest001Origin: QuestDefinition = {
  id: 'quest-001-origin',
  title: 'The Forest Awakening',
  briefing: 'Remember who you are and decide what kind of person you become.',
  createdAt: 1,
  startStepId: 'start',
  isAvailable: () => true,
  steps: {
    start: {
      id: 'start',
      type: 'choice',
      text: 'You find yourself in a forest.',
      choices: [
        {
          id: 'q1-how-did-i-get-here',
          label: 'how did I get here',
          nextStepId: 'memory-gap',
        },
      ],
    },
    'memory-gap': {
      id: 'memory-gap',
      type: 'choice',
      text: "you can't remember.",
      choices: [
        {
          id: 'q1-who-am-i',
          label: 'who am I',
          nextStepId: 'name-input',
        },
      ],
    },
    'name-input': {
      id: 'name-input',
      type: 'input',
      text: 'Speak your name.',
      field: 'playerName',
      placeholder: 'Enter your character name',
      submitLabel: 'Confirm Name',
      nextStepId: 'name-confirm',
      minLength: 2,
      maxLength: 32,
    },
    'name-confirm': {
      id: 'name-confirm',
      type: 'message',
      text: 'Your name is... {playerName}!',
      completeQuest: true,
    },
  },
};
