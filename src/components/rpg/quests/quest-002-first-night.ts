import { makeQuestAvailability } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';
import type { QuestChoice } from './types';

const SUNSET_QUEST_ART = 'art/converted/sophus-jacobsen-sunset-in-the-forest-1878.webp';
const TREE_CLIMB_ART = 'art/converted/treetops-against-sky-met-dt287184.webp';
const WATER_STREAM_ART = 'art/converted/gustave-courbet-stream-in-the-forest-55982-museum-of-fine-arts.webp';
const WILD_BOAR_ART = 'art/converted/eb1911-painting-plate-ii-fig-4.webp';

const treeClimbVisual = {
  kind: 'image' as const,
  src: TREE_CLIMB_ART,
  alt: 'Treetops against the sky',
};

const waterStreamVisual = {
  kind: 'image' as const,
  src: WATER_STREAM_ART,
  alt: 'A stream in the forest',
};

const wildBoarVisual = {
  kind: 'image' as const,
  src: WILD_BOAR_ART,
  alt: 'Cave painting of a wild boar',
  fit: 'contain' as const,
};

const TREE_VISTA_TEXT = 'The trees are still too thick to see much.';

function makeTreeGoDownChoice(): QuestChoice {
  return {
    id: 'q2-tree-go-down',
    label: 'Go back down',
    nextStepId: 'flavor-tree-fall',
    effects: {
      flagsSet: [FIRST_NIGHT_FLAG_TREE],
    },
    journalSummaryLineAdd: 'You fell from a tree and twisted your ankle.',
  };
}

function makeTreeClimbHigherChoice(nextStepId: string): QuestChoice {
  return {
    id: 'q2-tree-climb-higher',
    label: 'Climb higher',
    nextStepId,
  };
}

function makeBoarAftermathStep(id: string, outcomeLine: string) {
  return {
    id,
    type: 'message' as const,
    text: `${outcomeLine}\n\nThe boar misses and vanishes into the woods.`,
    requireContinueTap: true,
    nextStepId: 'night-router',
    visuals: [wildBoarVisual],
  };
}

export const FIRST_NIGHT_FLAG_SHELTER = 'quest-002-first-night-shelter';
export const FIRST_NIGHT_FLAG_POCKETS = 'quest-002-first-night-pockets';
export const FIRST_NIGHT_FLAG_TREE = 'quest-002-first-night-tree';
export const FIRST_NIGHT_FLAG_WATER = 'quest-002-first-night-water';
export const FIRST_NIGHT_FLAG_STREAM_DRINK = 'quest-002-first-night-stream-drink';
export const FIRST_NIGHT_FLAG_TRAILS = 'quest-002-first-night-trails';
export const FIRST_NIGHT_FLAG_CALL_HELP = 'quest-002-first-night-call-help';
export const FIRST_NIGHT_FLAG_FOOD = 'quest-002-first-night-food';
export const FIRST_NIGHT_FLAG_HIGH_GROUND = 'quest-002-first-night-high-ground';
/** @deprecated Legacy saves only */
export const FIRST_NIGHT_FLAG_STILL = 'quest-002-first-night-still';

function buildFirstNightMainChoices(): QuestChoice[] {
  return [
    {
      id: 'q2-build-shelter',
      label: 'Build a shelter',
      nextStepId: 'flavor-build-shelter',
      disabledIfAnyFlags: [FIRST_NIGHT_FLAG_SHELTER],
      effects: {
        flagsSet: [FIRST_NIGHT_FLAG_SHELTER],
      },
    },
    {
      id: 'q2-high-ground',
      label: 'Go to high ground',
      nextStepId: 'dir-north-steep',
      effects: {
        flagsSet: [FIRST_NIGHT_FLAG_HIGH_GROUND],
      },
    },
    {
      id: 'q2-look-food',
      label: 'Look for food',
      nextStepId: 'flavor-explore-south',
      effects: {
        flagsSet: [FIRST_NIGHT_FLAG_FOOD],
      },
    },
    {
      id: 'q2-look-water',
      label: 'Look for water',
      nextStepId: 'flavor-look-water',
      effects: {
        flagsSet: [FIRST_NIGHT_FLAG_WATER],
      },
    },
    {
      id: 'q2-look-trails',
      label: 'Look for animal trails',
      nextStepId: 'dir-south-path',
      disabledIfAnyFlags: [FIRST_NIGHT_FLAG_TRAILS],
      effects: {
        flagsSet: [FIRST_NIGHT_FLAG_TRAILS],
      },
    },
    {
      id: 'q2-check-pockets',
      label: 'Check your pockets',
      nextStepId: 'flavor-pockets',
      disabledIfAnyFlags: [FIRST_NIGHT_FLAG_POCKETS],
    },
    {
      id: 'q2-climb-tree',
      label: 'Climb a tree',
      nextStepId: 'flavor-tree-start',
      disabledIfAnyFlags: [FIRST_NIGHT_FLAG_TREE],
    },
    {
      id: 'q2-call-help',
      label: 'Call for help',
      nextStepId: 'flavor-call-help',
      disabledIfAnyFlags: [FIRST_NIGHT_FLAG_CALL_HELP],
      effects: {
        flagsSet: [FIRST_NIGHT_FLAG_CALL_HELP],
      },
    },
  ];
}

export const quest002FirstNight = createQuestDefinition({
  id: 'quest-002-first-night',
  title: 'Sunset',
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
      visuals: [
        {
          kind: 'image',
          src: SUNSET_QUEST_ART,
          alt: 'Sunset in the winter forest',
        },
      ],
      choices: buildFirstNightMainChoices(),
    },
    {
      id: 'flavor-five-hub',
      type: 'choice',
      text: 'What do you do now?',
      visuals: [
        {
          kind: 'image',
          src: SUNSET_QUEST_ART,
          alt: 'Sunset in the winter forest',
        },
      ],
      choices: buildFirstNightMainChoices(),
    },
    {
      id: 'flavor-build-shelter',
      type: 'message',
      text:
        'You shape a crude lean-to.',
      nextStepId: 'flavor-five-hub',
    },
    {
      id: 'flavor-call-help',
      type: 'message',
      text:
        'Every bird and insect suddenly stops its sound and the forest becomes eerily quiet...',
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
          },
        },
        {
          id: 'q2-pocket-cigarettes',
          label: 'cigarettes and a lighter',
          nextStepId: 'flavor-pockets-found-cigarettes',
          effects: {
            flagsSet: [FIRST_NIGHT_FLAG_POCKETS],
            questItemsAdd: ['cigarettes and a lighter'],
          },
        },
        {
          id: 'q2-pocket-cell-phone',
          label: 'a cell phone',
          nextStepId: 'flavor-pockets-cell-phone',
          effects: {
            flagsSet: [FIRST_NIGHT_FLAG_POCKETS],
            questItemsAdd: ['a cell phone'],

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
      visuals: [treeClimbVisual],
      nextStepId: 'flavor-tree-vista',
    },
    {
      id: 'flavor-tree-vista',
      type: 'message',
      text: TREE_VISTA_TEXT,
      visuals: [treeClimbVisual],
      nextStepId: 'flavor-tree-fork',
    },
    {
      id: 'flavor-tree-fork',
      type: 'choice',
      text: '',
      visuals: [treeClimbVisual],
      choices: [makeTreeClimbHigherChoice('flavor-tree-vista-2'), makeTreeGoDownChoice()],
    },
    {
      id: 'flavor-tree-vista-2',
      type: 'message',
      text: TREE_VISTA_TEXT,
      visuals: [treeClimbVisual],
      nextStepId: 'flavor-tree-fork-2',
    },
    {
      id: 'flavor-tree-fork-2',
      type: 'choice',
      text: '',
      visuals: [treeClimbVisual],
      choices: [makeTreeClimbHigherChoice('flavor-tree-vista-3'), makeTreeGoDownChoice()],
    },
    {
      id: 'flavor-tree-vista-3',
      type: 'message',
      text: TREE_VISTA_TEXT,
      visuals: [treeClimbVisual],
      nextStepId: 'flavor-tree-fork-3',
    },
    {
      id: 'flavor-tree-fork-3',
      type: 'choice',
      text: '',
      visuals: [treeClimbVisual],
      choices: [makeTreeClimbHigherChoice('flavor-tree-vista-4'), makeTreeGoDownChoice()],
    },
    {
      id: 'flavor-tree-vista-4',
      type: 'message',
      text: TREE_VISTA_TEXT,
      visuals: [treeClimbVisual],
      nextStepId: 'flavor-tree-fork-4',
    },
    {
      id: 'flavor-tree-fork-4',
      type: 'choice',
      text: '',
      visuals: [treeClimbVisual],
      choices: [makeTreeGoDownChoice()],
    },
    {
      id: 'flavor-tree-fall',
      type: 'message',
      text:
        'You fall from the tree and twist your ankle.',
      visuals: [treeClimbVisual],
      nextStepId: 'flavor-five-hub',
    },
    /** Legacy — old saves that chose a safe descent before go-back-down always fell. */
    {
      id: 'flavor-tree-safe-down',
      type: 'message',
      text: 'You return safely to the ground.',
      visuals: [treeClimbVisual],
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
    {
      id: 'flavor-look-water',
      type: 'message',
      text: 'You listen for running water and catch the faint sound of a trickle to the west.',
      visuals: [waterStreamVisual],
      nextStepId: 'dir-west-stream',
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
      visuals: [waterStreamVisual],
      choices: [
        {
          id: 'q2-west-drink',
          label: 'Take a drink',
          nextStepId: 'dir-west-drink',
          disabledIfAnyFlags: [FIRST_NIGHT_FLAG_STREAM_DRINK],
          disabledLabel: '',
          effects: {

            flagsSet: [FIRST_NIGHT_FLAG_STREAM_DRINK],
          },
        },
        {
          id: 'q2-west-upstream',
          label: 'Go upstream',
          nextStepId: 'boar-encounter',
        },
        {
          id: 'q2-west-downstream',
          label: 'Go downstream',
          nextStepId: 'boar-encounter',
        },
      ],
    },
    {
      id: 'dir-west-drink',
      type: 'message',
      text: 'You kneel and drink from the stream.',
      visuals: [waterStreamVisual],
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
        },
      ],
    },
    {
      id: 'dir-north-steep',
      type: 'message',
      text:
        'The ground begins to steepen, the footing is rocky. It is harder to travel.',
      nextStepId: 'boar-encounter',
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
      text: 'A wild boar charges straight at you!',
      visuals: [wildBoarVisual],
      choices: [
        {
          id: 'q1-origin-boar-strike',
          label: 'Attack',
          nextStepId: 'boar-aftermath-strike',
          journalSummaryLineAdd: 'You fended off the boar by attacking it.',
          effects: {

          },
        },
        {
          id: 'q1-origin-boar-spark',
          label: 'Cast a spell',
          nextStepId: 'boar-aftermath-spark',
          journalSummaryLineAdd: 'You fended off the boar by using magic.',
          effects: {

          },
        },
        {
          id: 'q1-origin-boar-dodge',
          label: 'Dodge',
          nextStepId: 'boar-aftermath-dodge',
          journalSummaryLineAdd: 'You fended off the boar by dodging it.',
          effects: {

          },
        },
        {
          id: 'q1-origin-boar-run',
          label: 'Run',
          nextStepId: 'boar-aftermath-run',
          journalSummaryLineAdd: 'You fended off the boar by running from it.',
          effects: {

          },
        },
      ],
    },
    makeBoarAftermathStep('boar-aftermath-strike', 'You fended off the boar by attacking it.'),
    makeBoarAftermathStep('boar-aftermath-spark', 'You fended off the boar by using magic.'),
    makeBoarAftermathStep('boar-aftermath-dodge', 'You fended off the boar by dodging it.'),
    makeBoarAftermathStep('boar-aftermath-run', 'You fended off the boar by running from it.'),
    /** Legacy — old saves mid-boar beat. */
    {
      id: 'boar-aftermath',
      type: 'message',
      text: "The boar misses and vanishes into the woods.",
      requireContinueTap: true,
      visuals: [wildBoarVisual],
      nextStepId: 'night-router',
    },
    {
      id: 'night-router',
      type: 'message',
      text: 'Dusk is closing in.  You build a primitive shelter and rest for the night.',
      completeQuest: true,
    },
  ],
});
