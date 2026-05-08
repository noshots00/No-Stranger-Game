import { createQuestDefinition } from './quest-authoring-tool';

export const quest001Origin = createQuestDefinition({
  id: 'quest-001-origin',
  title: 'The Beginning',
  briefing: 'Click here to continue.',
  createdAt: 1,
  startStepId: 'start',
  steps: [
    {
      id: 'start',
      type: 'choice',
      text: 'You will have many choices to make in this game.  Pick a choice to continue.',
      visuals: [
        {
          kind: 'image',
          src: 'art/To be converted/NSWoods.jpg',
          alt: 'Forest',
        },
      ],
      choices: [
        {
          id: 'q1-a-continue',
          label: 'A) Please make a choice to continue...',
          nextStepId: 'two-a',
          
        },
        {
          id: 'q1-b-continue',
          label: 'B) Please make a choice to continue...',
          nextStepId: 'two-b',
        },
        {
          id: 'q1-c-continue',
          label: 'C) Please make a choice to continue...',
          nextStepId: 'two-c',
        },
      ],
    },
    {
      id: 'two-a',
      type: 'choice',
      text: 'You chose A.\n\nHow did I get here?',
      
      choices: [
        {
          id: 'q2-i-dont-know',
          label: 'It\'s like I just woke up... only I can\'t remember a thing.',
          nextStepId: 'three',
        },
      ],
    },
    {
      id: 'two-b',
      type: 'choice',
      text: 'You chose B.\n\nHow did I get here?',
      
      choices: [
        {
          id: 'q2-i-dont-know',
          label: 'It\'s like I just woke up... only I can\'t remember a thing.',
          nextStepId: 'three',
        },
      ],
    },
    {
      id: 'two-c',
      type: 'choice',
      text: 'You chose C.\n\nHow did I get here?',
      
      choices: [
        {
          id: 'q2-i-dont-know',
          label: 'It\'s like I just woke up... only I can\'t remember a thing.',
          nextStepId: 'three',
        },
      ],
    },
    {
      id: 'three',
      type: 'choice',
      text: 'What am I doing here? Why can\'t I remember anything?',
      choices: [
        {
          id: 'q3-my-name-is-',
          label: 'Wait... I think I remember something...',
          nextStepId: 'four',
        },
      ],
    },
    {
      id: 'four',
      type: 'input',
      /** Narrator omits input-step copy; use `placeholder` for the prompt. */
      text: '',
      field: 'playerName',
      placeholder: 'Please type your name here.',
      submitLabel: 'Confirm Name',
      nextStepId: 'five',
      journalSummaryLineAfterSubmit: 'You find yourself in a forest.  You can\'t remember anything, except...\n\n...your name is {playerName}.',
    },
    {
      id: 'five',
      type: 'message',
      text: 'My name is... {playerName}!',
      completeQuest: true,
    },
  ],
});
