import type { QuestDefinition } from './types';

export const quest001Origin: QuestDefinition = {
  id: 'quest-001-origin',
  title: 'The Forest',
  briefing: 'Remember who you are and decide what kind of person you become.',
  createdAt: 1,
  startStepId: 'start',
  isAvailable: () => true,
  steps: {
    start: {
      id: 'start',
      type: 'choice',
      text: 'You find yourself in a moonlit forest.',
      choices: [
        {
          id: 'q1-cant-see',
          label: 'I can barely see a thing... how did I get here?',
          nextStepId: 'memory-gap',
        },
      ],
    },
    'memory-gap': {
      id: 'memory-gap',
      type: 'choice',
      text: "I don't even know... who I am.",
      choices: [
        {
          id: 'q1-who-am-i',
          label: 'Wait... I think I remember something...',
          nextStepId: 'name-input',
        },
      ],
    },
    'name-input': {
      id: 'name-input',
      type: 'input',
      text: 'I remember my name is...',
      field: 'playerName',
      placeholder: 'Enter your character name',
      submitLabel: 'Confirm Name',
      nextStepId: 'name-confirm',
      minLength: 2,
      maxLength: 32,
      worldEventLogAfterSubmit: [
        'You found yourself in a forest.',
        '{playerName} remembered his name.',
        '{playerName} is exploring the forest.',
      ],
    },
    'name-confirm': {
      id: 'name-confirm',
      type: 'message',
      text: 'Your name is... {playerName}!',
      completeQuest: true,
    },
  },
};
