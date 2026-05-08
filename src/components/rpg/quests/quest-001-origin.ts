import { createQuestDefinition } from './quest-authoring-tool';

export const quest001Origin = createQuestDefinition({
  id: 'quest-001-origin',
  title: 'The Beginning',
  briefing: '(Quest 1 briefing placeholder — author fills after wilderness beat is tuned.)',
  createdAt: 1,
  mainDailyQuest: true,
  startStepId: 'start',
  journalSummaryFallback:
    '(Quest 1 journal recap placeholder — author fills; branches diverge at dusk and boar.)',
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
          label: "It's like I just woke up... only I can't remember a thing.",
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
          label: "It's like I just woke up... only I can't remember a thing.",
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
          label: "It's like I just woke up... only I can't remember a thing.",
          nextStepId: 'three',
        },
      ],
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
      nextStepId: 'five',
      journalSummaryLineAfterSubmit:
        "You find yourself in a forest.  You can't remember anything, except...\n\n...your name is {playerName}.",
    },
    {
      id: 'five',
      type: 'message',
      text: 'My name is... {playerName}!',
      nextStepId: 'flavor-five',
    },
    {
      id: 'flavor-five',
      type: 'choice',
      text: 'What do you do?\n\n(Flavor only for now — no mechanical effect yet.)\n\n(Quest 1 — opening beat placeholder — tighten prose.)',
      choices: [
        { id: 'q1-flavor-call-help', label: 'Call out for help', nextStepId: 'compass-four' },
        { id: 'q1-flavor-pockets', label: 'Check your pockets', nextStepId: 'compass-four' },
        { id: 'q1-flavor-tree', label: 'Climb a tree to look around', nextStepId: 'compass-four' },
        {
          id: 'q1-flavor-stream',
          label: 'Follow a stream if you hear one',
          nextStepId: 'compass-four',
        },
        { id: 'q1-flavor-still', label: 'Stay still and listen', nextStepId: 'compass-four' },
      ],
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
      worldEventLogAfterChoice: ['You fended off a wild boar!'],
      choices: [
        {
          id: 'q1-origin-boar-strike',
          label: 'Attack',
          nextStepId: 'boar-aftermath',
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
        },
        {
          id: 'q1-dusk-build-shelter',
          label: 'Build a shelter',
          nextStepId: 'shelter-lean-end',
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
