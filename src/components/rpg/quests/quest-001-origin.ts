import { createQuestDefinition } from './quest-authoring-tool';

const ORIGIN_ASKED_HOW_FLAG = 'quest-001-origin-asked-how';
const ORIGIN_ASKED_WHERE_FLAG = 'quest-001-origin-asked-where';

export const quest001Origin = createQuestDefinition({
  id: 'quest-001-origin',
  title: 'The Beginning',
  briefing: 'Click here to continue...',
  createdAt: 1,
  startStepId: 'start',
  journalSummaryFallback:
    'You awakened in the forest with no memory — except your name.',
  steps: [
    {
      id: 'start',
      type: 'choice',
      text: 'You find yourself in a forest.  Please choose from the options below to continue.',
      visuals: [
        {
          kind: 'image',
          src: 'art/To be converted/NSWoods.jpg',
          alt: 'Forest',
        },
      ],
      choices: [
        {
          id: 'q1-origin-ask-how-first',
          label: 'How did I get here?',
          nextStepId: 'how-did-i-get-here-first',
          effects: {
            flagsSet: [ORIGIN_ASKED_HOW_FLAG],
          },
        },
        {
          id: 'q1-origin-ask-where-first',
          label: 'Where am I?',
          nextStepId: 'where-am-i-first',
          effects: {
            flagsSet: [ORIGIN_ASKED_WHERE_FLAG],
          },
        },
      ],
    },
    {
      id: 'how-did-i-get-here-first',
      type: 'message',
      text: "It's like I just woke up... only I can't remember a thing",
      nextStepId: 'opening-after-how',
    },
    {
      id: 'where-am-i-first',
      type: 'message',
      text: 'You see trees in every direction.',
      nextStepId: 'opening-after-where',
    },
    {
      id: 'opening-after-how',
      type: 'choice',
      text: '',
      choices: [
        {
          id: 'q1-origin-ask-how-disabled',
          label: 'How did I get here',
          disabledIfAnyFlags: [ORIGIN_ASKED_HOW_FLAG],
          disabledLabel: '',
          nextStepId: 'opening-after-how',
        },
        {
          id: 'q1-origin-ask-where-second',
          label: 'Where am I?',
          nextStepId: 'where-am-i-second',
          effects: {
            flagsSet: [ORIGIN_ASKED_WHERE_FLAG],
          },
        },
      ],
    },
    {
      id: 'opening-after-where',
      type: 'choice',
      text: '',
      choices: [
        {
          id: 'q1-origin-ask-how-second',
          label: 'How did I get here',
          nextStepId: 'how-did-i-get-here-second',
          effects: {
            flagsSet: [ORIGIN_ASKED_HOW_FLAG],
          },
        },
        {
          id: 'q1-origin-ask-where-disabled',
          label: 'Where am I?',
          disabledIfAnyFlags: [ORIGIN_ASKED_WHERE_FLAG],
          disabledLabel: '',
          nextStepId: 'opening-after-where',
        },
      ],
    },
    {
      id: 'how-did-i-get-here-second',
      type: 'message',
      text: "It's like I just woke up... only I can't remember a thing",
      nextStepId: 'three',
    },
    {
      id: 'where-am-i-second',
      type: 'message',
      text: 'You are in a dense forest with uneven terrain... all you see in every direction are trees.',
      nextStepId: 'three',
    },
    {
      id: 'three',
      type: 'choice',
      text: "What am I doing here? Why can't I remember anything?",
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
      text: '',
      field: 'playerName',
      placeholder: 'Please type your name here.',
      submitLabel: 'Confirm Name',
      journalSummaryLineAfterSubmit:
        "You find yourself in a forest.  You can't remember anything, except...\n\n...your name is {playerName}.",
    },
  ],
});
