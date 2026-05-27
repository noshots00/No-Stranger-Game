import { makeQuestAvailability } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';
import type { QuestChoice } from './types';

export const FIRST_NIGHT_FLAG_CALL_HELP = 'quest-002-first-night-call-help';
export const FIRST_NIGHT_FLAG_POCKETS = 'quest-002-first-night-pockets';
export const FIRST_NIGHT_FLAG_TREE = 'quest-002-first-night-tree';
export const FIRST_NIGHT_FLAG_STILL = 'quest-002-first-night-still';

const CALL_HELP_MODIFIERS = {
  BraveTrait: 1,
  FoolhardyTrait: 1,
  WarriorClass: 1,
  OrcRace: 1,
  LoudMouth: 1,
  Social: 1,
  DiplomaticTrait: 1,
  Charisma: 1,
  StupidTrait: 1,
  BoldTrait: 1,
  CrazyTrait: 1,
};

const FLASK_MODIFIERS = {
  Drunk: 1,
  Social: 1,
  Confident: 1,
  Leadership: 1,
  Fighter: 1,
  Brash: 1,
  Rude: 1,
  Antisocial: 1,
  RogueClass: 1,
  HealerClass: 1,
};

const CIGARETTES_MODIFIERS = {
  MageClass: 1,
  HealerClass: 1,
  Leadership: 1,
  Confident: 1,
  Reckless: 1,
};

function buildFirstNightMainChoices(includeDirections: boolean): QuestChoice[] {
  const choices: QuestChoice[] = [
    {
      id: 'q2-flavor-call-help',
      label: 'Call out for help',
      nextStepId: 'flavor-call-help',
      disabledIfAnyFlags: [FIRST_NIGHT_FLAG_CALL_HELP],
      disabledLabel: '',
      effects: {
        flagsSet: [FIRST_NIGHT_FLAG_CALL_HELP],
        modifiersDelta: CALL_HELP_MODIFIERS,
      },
      journalSummaryLineAdd: 'You called out for help.',
    },
    {
      id: 'q2-flavor-pockets',
      label: 'Check your pockets',
      nextStepId: 'flavor-pockets',
      disabledIfAnyFlags: [FIRST_NIGHT_FLAG_POCKETS],
      disabledLabel: '',
      journalSummaryLineAdd: 'You checked your pockets.',
    },
    {
      id: 'q2-flavor-tree',
      label: 'Climb a tree to look around',
      nextStepId: 'flavor-tree-start',
      disabledIfAnyFlags: [FIRST_NIGHT_FLAG_TREE],
      disabledLabel: '',
      journalSummaryLineAdd: 'You climbed a tree to look around.',
    },
    {
      id: 'q2-flavor-still',
      label: 'Stay still and listen',
      nextStepId: 'flavor-still',
      disabledIfAnyFlags: [FIRST_NIGHT_FLAG_STILL],
      disabledLabel: '',
      effects: {
        flagsSet: [FIRST_NIGHT_FLAG_STILL],
      },
      journalSummaryLineAdd: 'You stayed still and listened.',
    },
  ];

  if (includeDirections) {
    choices.push(
      {
        id: 'q2-go-south',
        label: 'Go South',
        nextStepId: 'boar-encounter',
        enabledIfAnyFlags: [FIRST_NIGHT_FLAG_STILL],
        journalSummaryLineAdd: 'You headed south.',
      },
      {
        id: 'q2-go-west',
        label: 'Go West',
        nextStepId: 'boar-encounter',
        enabledIfAnyFlags: [FIRST_NIGHT_FLAG_STILL],
        journalSummaryLineAdd: 'You headed west.',
      },
      {
        id: 'q2-go-north',
        label: 'Go North',
        nextStepId: 'boar-encounter',
        enabledIfAnyFlags: [FIRST_NIGHT_FLAG_TREE],
        journalSummaryLineAdd: 'You headed north.',
      },
      {
        id: 'q2-go-east',
        label: 'Go East',
        nextStepId: 'boar-encounter',
        enabledIfAnyFlags: [FIRST_NIGHT_FLAG_TREE],
        journalSummaryLineAdd: 'You headed east.',
      }
    );
  }

  return choices;
}

export const quest002FirstNight = createQuestDefinition({
  id: 'quest-002-first-night',
  title: 'First Night',
  briefing: 'Every choice is permanent.  Choose wisely.',
  createdAt: 2,
  mainDailyQuest: true,
  startStepId: 'flavor-five',
  isAvailable: makeQuestAvailability({
    requiresAnyCompletedQuestIds: ['quest-001-origin'],
  }),
  journalSummaryFallback:
    '(Quest 2 journal recap placeholder — author fills; branches diverge at dusk and boar.)',
  steps: [
    {
      id: 'flavor-five',
      type: 'choice',
      text: 'What do you do now?',
      choices: buildFirstNightMainChoices(false),
    },
    {
      id: 'flavor-five-hub',
      type: 'choice',
      text: 'What do you do now?',
      choices: buildFirstNightMainChoices(true),
    },
    {
      id: 'flavor-call-help',
      type: 'message',
      text:
        'You become aware of the sound of silence as every bird and bug suddenly stops its hum and the forest becomes eerily quiet...',
      nextStepId: 'flavor-five-hub',
    },
    {
      id: 'flavor-pockets',
      type: 'message',
      text: 'Your hand finds the familiar shape of...',
      nextStepId: 'flavor-pockets-pick',
    },
    {
      id: 'flavor-pockets-pick',
      type: 'choice',
      text: '',
      choices: [
        {
          id: 'q2-pocket-flask',
          label: 'a flask',
          nextStepId: 'flavor-pockets-found-flask',
          effects: {
            flagsSet: [FIRST_NIGHT_FLAG_POCKETS],
            questItemsAdd: ['a flask'],
            modifiersDelta: FLASK_MODIFIERS,
          },
        },
        {
          id: 'q2-pocket-cigarettes',
          label: 'cigarettes and a lighter',
          nextStepId: 'flavor-pockets-found-cigarettes',
          effects: {
            flagsSet: [FIRST_NIGHT_FLAG_POCKETS],
            questItemsAdd: ['cigarettes and a lighter'],
            modifiersDelta: CIGARETTES_MODIFIERS,
          },
        },
        {
          id: 'q2-pocket-cell-phone',
          label: 'a cell phone',
          nextStepId: 'flavor-pockets-cell-phone',
          effects: {
            flagsSet: [FIRST_NIGHT_FLAG_POCKETS],
            questItemsAdd: ['a cell phone'],
            modifiersDelta: { Placeholder: 1 },
          },
        },
      ],
    },
    {
      id: 'flavor-pockets-found-flask',
      type: 'message',
      text: 'You found a flask.',
      nextStepId: 'flavor-five-hub',
    },
    {
      id: 'flavor-pockets-found-cigarettes',
      type: 'message',
      text: 'You found cigarettes and a lighter.',
      nextStepId: 'flavor-five-hub',
    },
    {
      id: 'flavor-pockets-cell-phone',
      type: 'message',
      text: "It won't turn on...",
      nextStepId: 'flavor-five-hub',
    },
    {
      id: 'flavor-tree-start',
      type: 'message',
      text: 'This is harder than it looks...',
      nextStepId: 'flavor-tree-continue',
    },
    {
      id: 'flavor-tree-continue',
      type: 'choice',
      text: '',
      choices: [
        {
          id: 'q2-tree-continue',
          label: 'Continue...',
          nextStepId: 'flavor-tree-vista',
        },
      ],
    },
    {
      id: 'flavor-tree-vista',
      type: 'message',
      text:
        'You shimmy up the tree with surprising agility but the activity exhausts you... you feel hungry and a little cold. Resting on a high branch you take a good look around...\n\nThere is higher ground to the North. To the East it looks like the trees thin. That is all you can see.',
      nextStepId: 'flavor-tree-fork',
    },
    {
      id: 'flavor-tree-fork',
      type: 'choice',
      text: '',
      choices: [
        {
          id: 'q2-tree-climb-higher',
          label: 'Climb higher',
          nextStepId: 'flavor-tree-fall',
          effects: {
            flagsSet: [FIRST_NIGHT_FLAG_TREE],
          },
        },
        {
          id: 'q2-tree-go-down',
          label: 'Go back down',
          nextStepId: 'flavor-tree-safe-down',
          effects: {
            flagsSet: [FIRST_NIGHT_FLAG_TREE],
          },
        },
      ],
    },
    {
      id: 'flavor-tree-fall',
      type: 'message',
      text:
        'A piece of bark rips off the tree and you tumble backwards from the tree. A series of low branches cushion your fall but you sustain a minor injury.',
      nextStepId: 'flavor-five-hub',
    },
    {
      id: 'flavor-tree-safe-down',
      type: 'message',
      text: 'You return safely to the ground.',
      nextStepId: 'flavor-five-hub',
    },
    {
      id: 'flavor-still',
      type: 'message',
      text:
        'You hear the sound of running water to the west... suddenly a fawn bursts out of the brush near you and disappears southward.',
      nextStepId: 'flavor-five-hub',
    },
    /** Legacy step ids — old saves only. */
    {
      id: 'flavor-orient',
      type: 'message',
      text: "The sun is setting in the East. It's impossible to see far in any direction.",
      nextStepId: 'flavor-five-hub',
    },
    {
      id: 'flavor-explore-north',
      type: 'message',
      text: 'You head north.',
      nextStepId: 'boar-encounter',
    },
    {
      id: 'flavor-explore-south',
      type: 'message',
      text: 'You head south.',
      nextStepId: 'boar-encounter',
    },
    {
      id: 'flavor-explore-east',
      type: 'message',
      text: 'You head east.',
      nextStepId: 'boar-encounter',
    },
    {
      id: 'flavor-explore-west',
      type: 'message',
      text: 'You head west.',
      nextStepId: 'boar-encounter',
    },
    /** Legacy step id — old saves only; stream branch removed. */
    {
      id: 'flavor-stream',
      type: 'message',
      text: 'You listen for running water but hear none.',
      nextStepId: 'flavor-five-hub',
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
      text: 'A wild boar rushes you. Instinct takes over.\n\n(Quest 2 — boar encounter sensory placeholder.)',
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
        "The boar misses and vanishes into the woods. You're unharmed.\n\n(Quest 2 — boar aftermath: optional extra sensory beat placeholder.)",
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
        'You craft a crude lean-to from branches and leaf litter. Exhaustion wins — you curl up inside.\n\nDay ends.\n\n(Quest 2 — lean-to epilogue placeholder.)',
      completeQuest: true,
    },
    {
      id: 'dark-pitch',
      type: 'message',
      text:
        'You stumble onward until the forest becomes pitch black.\n\n(Quest 2 — darkness transition placeholder.)',
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
        '(Quest 2 — yell-for-help outcome placeholder — author fills. Someone answers? Something answers?)\n\nDay ends.',
      completeQuest: true,
    },
    {
      id: 'creep-moonlit',
      type: 'message',
      text:
        'Your hands find roots and cold stone. Eventually the canopy opens onto a moonlit rock outcropping — enough shelter from the wind.\n\n(Quest 2 — creep-forward interim beat placeholder.)',
      nextStepId: 'creep-sleep-end',
    },
    {
      id: 'creep-sleep-end',
      type: 'message',
      text:
        'You tuck yourself against the stone and fade toward sleep.\n\nDay ends.\n\n(Quest 2 — moonlit rock epilogue placeholder.)',
      completeQuest: true,
    },
    {
      id: 'stay-blue-bugs',
      type: 'message',
      text:
        'Hours blur. Then — motion overhead: a river of blue sparks drifts through the black trees. Lightning bugs? Something stranger?\n\n(Quest 2 — blue-light spectacle placeholder.)',
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
        '(Quest 2 — shelter-under-bugs outcome placeholder — dreams? Visitors?)\n\nDay ends.',
      completeQuest: true,
    },
    {
      id: 'follow-ravine',
      type: 'message',
      text:
        'The glow leads you until the ground drops away — a ravine too steep to cross. The blue sparks thin and scatter.\n\n(Quest 2 — ravine approach placeholder.)',
      nextStepId: 'follow-outcrop-end',
    },
    {
      id: 'follow-outcrop-end',
      type: 'message',
      text:
        'You find a little ledge beneath an overhang — barely enough to wait out the night.\n\nDay ends.\n\n(Quest 2 — ravine ledge epilogue placeholder.)',
      completeQuest: true,
    },
  ],
});
