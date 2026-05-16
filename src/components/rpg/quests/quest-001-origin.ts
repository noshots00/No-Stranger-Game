import { createQuestDefinition } from './quest-authoring-tool';

const ORIGIN_ASKED_HOW_FLAG = 'quest-001-origin-asked-how';
const ORIGIN_ASKED_WHERE_FLAG = 'quest-001-origin-asked-where';

export const quest001Origin = createQuestDefinition({
  id: 'quest-001-origin',
  title: 'The Beginning',
  briefing: 'Click here to continue...',
  createdAt: 1,
  mainDailyQuest: true,
  startStepId: 'start',
  journalSummaryFallback:
    '(Quest 1 journal recap placeholder — author fills; branches diverge at dusk and boar.)',
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
      nextStepId: 'flavor-five',
      journalSummaryLineAfterSubmit:
        "You find yourself in a forest.  You can't remember anything, except...\n\n...your name is {playerName}.",
    },
    {
      id: 'flavor-five',
      type: 'choice',
      text:
        "You find yourself in a forest.  You can't remember anything, except...\n\n...your name is {playerName}.\n\nWhat do you do now?",
      choices: [
        {
          id: 'q1-flavor-call-help',
          label: 'Call out for help',
          nextStepId: 'flavor-call-help',
          journalSummaryLineAdd: 'You tried to call for help.',
        },
        {
          id: 'q1-flavor-pockets',
          label: 'Check your pockets',
          nextStepId: 'flavor-pockets',
          journalSummaryLineAdd: 'You checked your pockets.',
        },
        {
          id: 'q1-flavor-tree',
          label: 'Climb a tree to look around',
          nextStepId: 'flavor-tree',
          journalSummaryLineAdd: 'You climbed a tree to look around.',
        },
        {
          id: 'q1-flavor-stream',
          label: 'Follow a stream if you hear one',
          nextStepId: 'flavor-stream',
          journalSummaryLineAdd: 'You listened for a stream and tried to follow it.',
        },
        {
          id: 'q1-flavor-still',
          label: 'Stay still and listen',
          nextStepId: 'flavor-still',
          journalSummaryLineAdd: 'You stay in one place and listen.',
        },
      ],
    },
    {
      id: 'flavor-call-help',
      type: 'message',
      text: 'You try to call for help.',
      nextStepId: 'compass-four',
    },
    {
      id: 'flavor-pockets',
      type: 'message',
      text: 'You check your pockets.',
      nextStepId: 'compass-four',
    },
    {
      id: 'flavor-tree',
      type: 'message',
      text: 'You climb a tree to look around.',
      nextStepId: 'compass-four',
    },
    {
      id: 'flavor-stream',
      type: 'message',
      text: 'You listen for running water and try to follow it.',
      nextStepId: 'compass-four',
    },
    {
      id: 'flavor-still',
      type: 'message',
      text: 'You stay in one place and listen.',
      nextStepId: 'compass-four',
    },
    {
      id: 'compass-four',
      type: 'choice',
      text: 'Pick a direction.',
      choices: [
        {
          id: 'q1-dir-north',
          label: 'North — Trees thin slightly.',
          nextStepId: 'boar-encounter',
        },
        {
          id: 'q1-dir-east',
          label: 'East — A faint animal trail.',
          nextStepId: 'boar-encounter',
        },
        {
          id: 'q1-dir-south',
          label: 'South — Denser ferns, damp ground.',
          nextStepId: 'boar-encounter',
        },
        {
          id: 'q1-dir-west',
          label: 'West — Towards the setting sun.',
          nextStepId: 'boar-encounter',
        },
      ],
    },
    {
      id: 'boar-encounter',
      type: 'choice',
      text: 'A wild boar rushes you. Instinct takes over.\n\n(Quest 1 — boar encounter sensory placeholder.)',
      choices: [
        {
          id: 'q1-origin-boar-strike',
          label: 'Attack',
          nextStepId: 'boar-aftermath',
          journalSummaryLineAdd: 'You fended off a boar by attacking it.',
          effects: {
            modifiersDelta: {
              WarriorClass: 1,
              Strength: 1,
              OrcRace: 1,
              DwarfRace: 1,
              AtlantiansRace: 1,
            },
          },
        },
        {
          id: 'q1-origin-boar-spark',
          label: 'Cast a spell (you produce a small spark—surprising even you)',
          nextStepId: 'boar-aftermath',
          journalSummaryLineAdd: 'You fended off a boar by using magic.',
          effects: {
            modifiersDelta: {
              MageClass: 1,
              Intelligence: 1,
              HighElfRace: 1,
              GnomeRace: 1,
              RiverKingdomRace: 1,
            },
          },
        },
        {
          id: 'q1-origin-boar-dodge',
          label: 'Dodge',
          nextStepId: 'boar-aftermath',
          journalSummaryLineAdd: 'You fended off a boar by dodging it.',
          effects: {
            modifiersDelta: {
              RogueClass: 1,
              Evasion: 1,
              Dodge: 1,
              HalflingRace: 1,
              GoblinRace: 1,
              WoodElfRace: 1,
              CatfolkRace: 1,
            },
          },
        },
        {
          id: 'q1-origin-boar-run',
          label: 'Run',
          nextStepId: 'boar-aftermath',
          journalSummaryLineAdd: 'You fended off a boar by running from it.',
          effects: {
            modifiersDelta: {
              Coward: 1,
              FastFeet: 1,
              SurvivalInstinct: 1,
              GoblinRace: 1,
              HalflingRace: 1,
              RiverKingdomRace: 1,
            },
          },
        },
      ],
    },
    {
      id: 'boar-aftermath',
      type: 'message',
      text:
        "The boar misses and vanishes into the woods. You're unharmed.\n\n(Quest 1 — boar aftermath: optional extra sensory beat placeholder.)",
      nextStepId: 'dusk-choice',
    },
    {
      id: 'dusk-choice',
      type: 'choice',
      text: "Dusk falls.\n\nIt's getting dark fast. You can barely see the trees ahead.",
      choices: [
        {
          id: 'q1-dusk-keep-going',
          label: 'Keep going',
          nextStepId: 'dark-pitch',
          journalSummaryLineAdd:
            'You had a strange night in the forest before eventually falling asleep.',
        },
        {
          id: 'q1-dusk-build-shelter',
          label: 'Build a shelter',
          nextStepId: 'shelter-lean-end',
          journalSummaryLineAdd: 'You built a primitive lean-to and slept for the night.',
        },
      ],
    },
    {
      id: 'shelter-lean-end',
      type: 'message',
      text:
        'You craft a crude lean-to from branches and leaf litter. Exhaustion wins — you curl up inside.\n\nDay ends.\n\n(Quest 1 — lean-to epilogue placeholder.)',
      completeQuest: true,
    },
    {
      id: 'dark-pitch',
      type: 'message',
      text:
        'You stumble onward until the forest becomes pitch black.\n\n(Quest 1 — darkness transition placeholder.)',
      nextStepId: 'dark-branch',
    },
    {
      id: 'dark-branch',
      type: 'choice',
      text: 'What do you try?',
      choices: [
        {
          id: 'q1-dark-creep',
          label: 'Slowly creep forward in the dark',
          nextStepId: 'creep-moonlit',
        },
        {
          id: 'q1-dark-stay',
          label: 'Stay in one place',
          nextStepId: 'stay-blue-bugs',
        },
        {
          id: 'q1-dark-yell',
          label: 'Yell out for help',
          nextStepId: 'yell-help-end',
        },
      ],
    },
    {
      id: 'yell-help-end',
      type: 'message',
      text:
        '(Quest 1 — yell-for-help outcome placeholder — author fills. Someone answers? Something answers?)\n\nDay ends.',
      completeQuest: true,
    },
    {
      id: 'creep-moonlit',
      type: 'message',
      text:
        'Your hands find roots and cold stone. Eventually the canopy opens onto a moonlit rock outcropping — enough shelter from the wind.\n\n(Quest 1 — creep-forward interim beat placeholder.)',
      nextStepId: 'creep-sleep-end',
    },
    {
      id: 'creep-sleep-end',
      type: 'message',
      text:
        'You tuck yourself against the stone and fade toward sleep.\n\nDay ends.\n\n(Quest 1 — moonlit rock epilogue placeholder.)',
      completeQuest: true,
    },
    {
      id: 'stay-blue-bugs',
      type: 'message',
      text:
        'Hours blur. Then — motion overhead: a river of blue sparks drifts through the black trees. Lightning bugs? Something stranger?\n\n(Quest 1 — blue-light spectacle placeholder.)',
      nextStepId: 'bugs-fork',
    },
    {
      id: 'bugs-fork',
      type: 'choice',
      text: 'What do you do?',
      choices: [
        {
          id: 'q1-bugs-follow',
          label: 'Follow the lights',
          nextStepId: 'follow-ravine',
        },
        {
          id: 'q1-bugs-shelter',
          label: 'Take shelter and try to sleep',
          nextStepId: 'bugs-shelter-end',
        },
      ],
    },
    {
      id: 'bugs-shelter-end',
      type: 'message',
      text:
        '(Quest 1 — shelter-under-bugs outcome placeholder — dreams? Visitors?)\n\nDay ends.',
      completeQuest: true,
    },
    {
      id: 'follow-ravine',
      type: 'message',
      text:
        'The glow leads you until the ground drops away — a ravine too steep to cross. The blue sparks thin and scatter.\n\n(Quest 1 — ravine approach placeholder.)',
      nextStepId: 'follow-outcrop-end',
    },
    {
      id: 'follow-outcrop-end',
      type: 'message',
      text:
        'You find a little ledge beneath an overhang — barely enough to wait out the night.\n\nDay ends.\n\n(Quest 1 — ravine ledge epilogue placeholder.)',
      completeQuest: true,
    },
  ],
});
