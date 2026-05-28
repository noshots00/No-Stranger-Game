import { makeQuestAvailability } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';
import type { QuestChoice } from './types';

export const FIRST_NIGHT_FLAG_SHELTER = 'quest-002-first-night-shelter';
export const FIRST_NIGHT_FLAG_POCKETS = 'quest-002-first-night-pockets';
export const FIRST_NIGHT_FLAG_TREE = 'quest-002-first-night-tree';
export const FIRST_NIGHT_FLAG_WATER = 'quest-002-first-night-water';
export const FIRST_NIGHT_FLAG_STREAM_DRINK = 'quest-002-first-night-stream-drink';

/** @deprecated Legacy saves only */
export const FIRST_NIGHT_FLAG_CALL_HELP = 'quest-002-first-night-call-help';
/** @deprecated Legacy saves only */
export const FIRST_NIGHT_FLAG_STILL = 'quest-002-first-night-still';

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

function buildFirstNightMainChoices(): QuestChoice[] {
  return [
    {
      id: 'q2-build-shelter',
      label: 'Build a shelter',
      nextStepId: 'boar-encounter',
      effects: {
        flagsSet: [FIRST_NIGHT_FLAG_SHELTER],
      },
      journalSummaryLineAdd: 'You worked on a shelter.',
    },
    {
      id: 'q2-high-ground',
      label: 'Go to high ground',
      nextStepId: 'boar-encounter',
      journalSummaryLineAdd: 'You climbed toward high ground.',
    },
    {
      id: 'q2-look-food',
      label: 'Look for food',
      nextStepId: 'boar-encounter',
      journalSummaryLineAdd: 'You looked for food.',
    },
    {
      id: 'q2-look-water',
      label: 'Look for water',
      nextStepId: 'boar-encounter',
      journalSummaryLineAdd: 'You looked for water.',
    },
  ];
}

export const quest002FirstNight = createQuestDefinition({
  id: 'quest-002-first-night',
  title: 'The Sun Sets in the West',
  briefing: 'Every choice is permanent.  Choose wisely.',
  createdAt: 2,
  mainDailyQuest: true,
  startStepId: 'flavor-five',
  questCardImageSide: 'right',
  isAvailable: makeQuestAvailability({
    requiresAnyCompletedQuestIds: ['quest-001-origin'],
  }),
  journalSummaryFallback: 'You had a strange night in the forest.',
  steps: [
    {
      id: 'flavor-five',
      type: 'choice',
      text: 'What do you do now?',
      choices: buildFirstNightMainChoices(),
    },
    {
      id: 'flavor-five-hub',
      type: 'choice',
      text: 'What do you do now?',
      choices: buildFirstNightMainChoices(),
    },
    {
      id: 'flavor-build-shelter',
      type: 'message',
      text:
        'You gather branches and leaf litter, shaping a crude lean-to. Your hands ache and the light is failing — it will have to do for now.',
      nextStepId: 'flavor-five-hub',
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
    /** Legacy step id — old saves only. */
    {
      id: 'flavor-stream',
      type: 'message',
      text: 'You listen for running water but hear none.',
      nextStepId: 'flavor-five-hub',
    },
    {
      id: 'dir-west-stream',
      type: 'choice',
      text: 'You soon find a trickling stream.\n\nWhat now?',
      choices: [
        {
          id: 'q2-west-drink',
          label: 'Take a drink',
          nextStepId: 'dir-west-drink',
          disabledIfAnyFlags: [FIRST_NIGHT_FLAG_STREAM_DRINK],
          disabledLabel: '',
          effects: {
            modifiersDelta: { PlaceholderDrink: 1 },
            flagsSet: [FIRST_NIGHT_FLAG_STREAM_DRINK],
          },
          journalSummaryLineAdd: 'You drank from the stream.',
        },
        {
          id: 'q2-west-upstream',
          label: 'Go upstream',
          nextStepId: 'boar-encounter',
          journalSummaryLineAdd: 'You followed the stream upstream.',
        },
        {
          id: 'q2-west-downstream',
          label: 'Go downstream',
          nextStepId: 'boar-encounter',
          journalSummaryLineAdd: 'You followed the stream downstream.',
        },
      ],
    },
    {
      id: 'dir-west-drink',
      type: 'message',
      text: 'You kneel and drink from the stream.',
      nextStepId: 'dir-west-stream',
    },
    {
      id: 'dir-south-path',
      type: 'message',
      text: 'You come upon a well beaten animal path.',
      nextStepId: 'dir-south-path-fork',
    },
    {
      id: 'dir-south-path-fork',
      type: 'choice',
      text: '',
      choices: [
        {
          id: 'q2-south-left',
          label: 'Follow it left',
          nextStepId: 'boar-encounter',
          journalSummaryLineAdd: 'You followed the path to the left.',
        },
        {
          id: 'q2-south-right',
          label: 'Follow it right',
          nextStepId: 'boar-encounter',
          journalSummaryLineAdd: 'You followed the path to the right.',
        },
      ],
    },
    {
      id: 'dir-north-steep',
      type: 'message',
      text:
        'The ground begins to steepen, the footing is rocky. It is harder to travel.',
      nextStepId: 'dir-north-continue',
    },
    {
      id: 'dir-north-continue',
      type: 'choice',
      text: '',
      choices: [
        {
          id: 'q2-north-continue',
          label: 'Continue',
          nextStepId: 'boar-encounter',
          journalSummaryLineAdd: 'You pressed on up the rocky slope.',
        },
      ],
    },
    {
      id: 'dir-east-swamp',
      type: 'message',
      text:
        'The putrid smell of a rotting bog whiffs through your nose from time to time... you are entering a swamp.',
      nextStepId: 'boar-encounter',
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
      text:
        'You are startled by a loud rustling sound!  A wild boar with sharp tusks bounds out of the nearby brush and charges straight at you... What do you do?',
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
      text: "The boar misses and vanishes into the woods. You're unharmed.",
      nextStepId: 'night-router',
    },
    {
      id: 'night-router',
      type: 'choice',
      text: 'Dusk is closing in.',
      choices: [
        {
          id: 'q2-night-hub-shelter',
          label: 'Continue',
          nextStepId: 'night-hub-shelter',
          enabledIfAnyFlags: [FIRST_NIGHT_FLAG_SHELTER],
        },
        {
          id: 'q2-night-dusk',
          label: 'Continue',
          nextStepId: 'dusk-choice',
          disabledIfAnyFlags: [FIRST_NIGHT_FLAG_SHELTER],
        },
      ],
    },
    {
      id: 'night-hub-shelter',
      type: 'message',
      text:
        'You return to the crude lean-to you started. The forest darkens around you. You stay put and wait — the wind shifts, and the night deepens.',
      nextStepId: 'stay-blue-bugs',
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
        'You craft a crude lean-to from branches and leaf litter. Exhaustion wins — you curl up inside.\n\nDay ends.',
      completeQuest: true,
    },
    {
      id: 'dark-pitch',
      type: 'message',
      text: 'You stumble onward until the forest becomes pitch black.',
      nextStepId: 'dark-branch',
    },
    {
      id: 'dark-branch',
      type: 'choice',
      text: 'What do you do?',
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
        'Day ends.',
      completeQuest: true,
    },
    {
      id: 'creep-moonlit',
      type: 'message',
      text:
        'Your hands find roots and cold stone. Eventually the canopy opens onto a moonlit rock outcropping — enough shelter from the wind.',
      nextStepId: 'creep-sleep-end',
    },
    {
      id: 'creep-sleep-end',
      type: 'message',
      text:
        'You tuck yourself against the stone and fade toward sleep.\n\nDay ends.',
      completeQuest: true,
    },
    {
      id: 'stay-blue-bugs',
      type: 'message',
      text:
        'Hours blur. Then — motion overhead: a river of blue sparks drifts through the black trees. Lightning bugs? Something stranger?',
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
        'Day ends.',
      completeQuest: true,
    },
    {
      id: 'follow-ravine',
      type: 'message',
      text:
        'The glow leads you until the ground drops away — a ravine too steep to cross. The blue sparks thin and scatter.',
      nextStepId: 'follow-outcrop-end',
    },
    {
      id: 'follow-outcrop-end',
      type: 'message',
      text:
        'You find a little ledge beneath an overhang — barely enough to wait out the night.\n\nDay ends.',
      completeQuest: true,
    },
  ],
});
