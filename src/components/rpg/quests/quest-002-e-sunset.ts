import { QUEST_FIRST_NIGHT_ID } from '../constants';
import { makeQuestAvailability } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';
import {
  FIRST_NIGHT_FLAG_CALL_HELP,
  FIRST_NIGHT_FLAG_FOOD,
  FIRST_NIGHT_FLAG_HIGH_GROUND,
  FIRST_NIGHT_FLAG_POCKETS,
  FIRST_NIGHT_FLAG_POCKET_CELL_PHONE,
  FIRST_NIGHT_FLAG_POCKET_CIGARETTES,
  FIRST_NIGHT_FLAG_POCKET_FLASK,
  FIRST_NIGHT_FLAG_STREAM_DRINK,
  FIRST_NIGHT_FLAG_TREE,
  FIRST_NIGHT_FLAG_TRAILS,
  FIRST_NIGHT_FLAG_USED_CELL_PHONE,
  FIRST_NIGHT_FLAG_USED_CIGARETTES,
  FIRST_NIGHT_FLAG_USED_FLASK,
  FIRST_NIGHT_FLAG_WATER,
} from './quest-002-first-night';
import type { QuestChoice } from './types';

export const SUNSET_HUB_ART = 'art/converted/aerial-view-of-autumn-forest-colors.webp';
const SUNSET_QUEST_ART = 'art/converted/sophus-jacobsen-sunset-in-the-forest-1878.webp';
const TREE_CLIMB_ART = 'art/converted/treetops-against-sky-met-dt287184.webp';
const WATER_STREAM_ART = 'art/converted/gustave-courbet-stream-in-the-forest-55982-museum-of-fine-arts.webp';
const WILD_BOAR_ART = 'art/converted/eb1911-painting-plate-ii-fig-4.webp';
const DEER_TRAIL_ART = 'art/converted/deer-mountain-trail-saam-19801338-2.webp';
const LEMON_TREE_ART =
  'art/converted/henry-scott-tuke-1858-1929-the-lemon-tree-1898-002-cartwright-hall-art-gallery.webp';

const deerTrailVisual = {
  kind: 'image' as const,
  src: DEER_TRAIL_ART,
  alt: 'Deer on a mountain trail',
};

const lemonTreeVisual = {
  kind: 'image' as const,
  src: LEMON_TREE_ART,
  alt: 'A lemon tree',
};

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

const sunsetHubVisual = {
  kind: 'image' as const,
  src: SUNSET_HUB_ART,
  alt: 'Aerial view of autumn forest colors',
};

const sunsetVisual = {
  kind: 'image' as const,
  src: SUNSET_QUEST_ART,
  alt: 'Sunset in the forest',
};

const TREE_VISTA_INITIAL_TEXT = 'The trees are still too thick to see much.';

const TREE_CLIMB_VISTA_TEXTS = [
  'You are dangerously high in the air, yet nowhere near the canopy.',
  "Sweat stings your eyes. Your muscles burn. You're afraid to look down.",
  "The tree begins to sway under your weight... you can't go any higher. Unfortunately, there's nothing to see around you but trees.",
] as const;

const TREE_FALL_TEXT =
  "On the way down, you lose your grip and fall from the tree. Luckily, some branches broke your fall.";

function makeTreeGoDownChoice(): QuestChoice {
  return {
    id: 'q2-tree-go-down',
    label: 'Go back down',
    nextStepId: 'flavor-tree-fall',
    effects: {
      flagsSet: [FIRST_NIGHT_FLAG_TREE],
    },
    journalSummaryLineAdd: 'You fell from a tree on the way down.',
  };
}

function makeTreeClimbHigherChoice(nextStepId: string): QuestChoice {
  return {
    id: 'q2-tree-climb-higher',
    label: 'Climb higher',
    nextStepId,
  };
}

function makeSnakeReactChoices(): QuestChoice[] {
  return [
    { id: 'q2-snake-freeze', label: 'Freeze', nextStepId: 'food-snake-strike' },
    { id: 'q2-snake-run', label: 'Run', nextStepId: 'food-snake-strike' },
    { id: 'q2-snake-attack', label: 'Attack', nextStepId: 'food-snake-strike' },
    { id: 'q2-snake-talk', label: 'Talk to the snake', nextStepId: 'food-snake-strike' },
    { id: 'q2-snake-back-away', label: 'Slowly Back Away', nextStepId: 'food-snake-strike' },
  ];
}

function makeBoarAftermathStep(id: string, outcomeLine: string) {
  return {
    id,
    type: 'message' as const,
    text: `${outcomeLine}\n\nThe boar misses and vanishes into the woods.`,
    requireContinueTap: true,
    nextStepId: 'nightfall-wait',
    visuals: [wildBoarVisual],
  };
}

function buildFirstNightMainChoices(): QuestChoice[] {
  return [
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

/** Step ids moved from Instinct into Sunset — used for save migration. */
export const SUNSET_STEP_IDS = new Set([
  'flavor-five',
  'flavor-five-hub',
  'flavor-build-shelter',
  'flavor-call-help',
  'flavor-pockets',
  'flavor-pockets-pick',
  'flavor-pockets-found-flask',
  'flavor-pockets-found-cigarettes',
  'flavor-pockets-cell-phone',
  'flavor-tree-start',
  'flavor-tree-vista',
  'flavor-tree-fork',
  'flavor-tree-vista-2',
  'flavor-tree-fork-2',
  'flavor-tree-vista-3',
  'flavor-tree-fork-3',
  'flavor-tree-vista-4',
  'flavor-tree-fork-4',
  'flavor-tree-fall',
  'flavor-tree-safe-down',
  'flavor-still',
  'flavor-orient',
  'flavor-explore-north',
  'flavor-explore-south',
  'flavor-explore-east',
  'flavor-explore-west',
  'flavor-look-water',
  'flavor-stream',
  'dir-west-stream',
  'dir-west-drink',
  'dir-south-path',
  'dir-south-path-fork',
  'food-lemon-tree',
  'food-lemon-ground',
  'food-lemon-shake',
  'food-lemon-leave',
  'food-snake-react',
  'food-snake-strike',
  'food-eat-fruit',
  'food-feel-healthy',
  'food-fruit-after',
  'dir-north-steep',
  'dir-east-swamp',
  'compass-four',
  'boar-encounter',
  'boar-aftermath-strike',
  'boar-aftermath-spark',
  'boar-aftermath-dodge',
  'boar-aftermath-run',
  'boar-aftermath',
  'night-router',
  'nightfall-wait',
  'nightfall-flask',
  'nightfall-cigarettes',
  'nightfall-cell-phone',
]);

export const quest002Sunset = createQuestDefinition({
  id: 'quest-002-e-sunset',
  title: 'Sunset',
  briefing: 'Every choice is permanent. Choose wisely.',
  createdAt: 2,
  mainDailyQuest: true,
  startStepId: 'flavor-five',
  questCardImageSide: 'right',
  isAvailable: makeQuestAvailability({
    requiresAnyCompletedQuestIds: [QUEST_FIRST_NIGHT_ID],
  }),
  journalSummaryFallback: 'You had a strange night in the forest.',
  steps: [
    {
      id: 'flavor-five',
      type: 'choice',
      text: 'What do you do now?',
      visuals: [sunsetHubVisual],
      choices: buildFirstNightMainChoices(),
    },
    {
      id: 'flavor-five-hub',
      type: 'choice',
      text: 'What do you do now?',
      visuals: [sunsetHubVisual],
      choices: buildFirstNightMainChoices(),
    },
    {
      id: 'flavor-build-shelter',
      type: 'message',
      text: 'You shape a crude lean-to.',
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
            flagsSet: [FIRST_NIGHT_FLAG_POCKETS, FIRST_NIGHT_FLAG_POCKET_FLASK],
            questItemsAdd: ['a flask'],
          },
        },
        {
          id: 'q2-pocket-cigarettes',
          label: 'cigarettes and a lighter',
          nextStepId: 'flavor-pockets-found-cigarettes',
          effects: {
            flagsSet: [FIRST_NIGHT_FLAG_POCKETS, FIRST_NIGHT_FLAG_POCKET_CIGARETTES],
            questItemsAdd: ['cigarettes and a lighter'],
          },
        },
        {
          id: 'q2-pocket-cell-phone',
          label: 'a cell phone',
          nextStepId: 'flavor-pockets-cell-phone',
          effects: {
            flagsSet: [FIRST_NIGHT_FLAG_POCKETS, FIRST_NIGHT_FLAG_POCKET_CELL_PHONE],
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
      text: TREE_VISTA_INITIAL_TEXT,
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
      text: TREE_CLIMB_VISTA_TEXTS[0],
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
      text: TREE_CLIMB_VISTA_TEXTS[1],
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
      text: TREE_CLIMB_VISTA_TEXTS[2],
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
      text: TREE_FALL_TEXT,
      visuals: [treeClimbVisual],
      nextStepId: 'flavor-five-hub',
    },
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
      nextStepId: 'food-lemon-tree',
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
      visuals: [deerTrailVisual],
      nextStepId: 'dir-south-path-fork',
    },
    {
      id: 'dir-south-path-fork',
      type: 'choice',
      text: '',
      visuals: [deerTrailVisual],
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
      id: 'food-lemon-tree',
      type: 'choice',
      text: 'You are very hungry.',
      visuals: [lemonTreeVisual],
      choices: [
        {
          id: 'q2-food-eat-ground',
          label: 'Eat some fruit off the ground.',
          nextStepId: 'food-lemon-ground',
        },
        {
          id: 'q2-food-shake-tree',
          label: 'Try to shake off some ripe ones.',
          nextStepId: 'food-lemon-shake',
        },
        {
          id: 'q2-food-leave-tree',
          label: 'Leave',
          nextStepId: 'food-lemon-leave',
        },
      ],
    },
    {
      id: 'food-lemon-ground',
      type: 'message',
      text:
        'You reach down to pick one up when you meet eyes with an emerald green snake, just inches from your face.',
      visuals: [lemonTreeVisual],
      nextStepId: 'food-snake-react',
    },
    {
      id: 'food-lemon-shake',
      type: 'message',
      text:
        'You grip the trunk with both hands and prepare to give the tree a vigorous shake, when an emerald green snake lowers itself head first from the tree, just inches from your face.',
      visuals: [lemonTreeVisual],
      nextStepId: 'food-snake-react',
    },
    {
      id: 'food-lemon-leave',
      type: 'message',
      text:
        'You turn to leave when an emerald green snake slides into your path, just inches from your face.',
      visuals: [lemonTreeVisual],
      nextStepId: 'food-snake-react',
    },
    {
      id: 'food-snake-react',
      type: 'choice',
      text: '',
      visuals: [lemonTreeVisual],
      choices: makeSnakeReactChoices(),
    },
    {
      id: 'food-snake-strike',
      type: 'message',
      text: 'The snake hisses and strikes!',
      visuals: [lemonTreeVisual],
      effects: { healthLossFraction: 0.25 },
      nextStepId: 'food-eat-fruit',
    },
    {
      id: 'food-eat-fruit',
      type: 'choice',
      text: '',
      visuals: [lemonTreeVisual],
      choices: [
        {
          id: 'q2-food-eat-fruit',
          label: 'Eat a fruit',
          nextStepId: 'food-feel-healthy',
        },
        {
          id: 'q2-food-decline-fruit',
          label: 'Leave',
          nextStepId: 'boar-encounter',
        },
      ],
    },
    {
      id: 'food-feel-healthy',
      type: 'message',
      text: 'You feel healthy!',
      visuals: [lemonTreeVisual],
      effects: { healthSet: 100 },
      nextStepId: 'food-fruit-after',
    },
    {
      id: 'food-fruit-after',
      type: 'choice',
      text: '',
      visuals: [lemonTreeVisual],
      choices: [
        {
          id: 'q2-food-take-fruit',
          label: 'Take some fruit with you',
          nextStepId: 'boar-encounter',
          effects: { questItemsAdd: ['Fruit'] },
        },
        {
          id: 'q2-food-continue',
          label: 'Continue',
          nextStepId: 'boar-encounter',
        },
      ],
    },
    {
      id: 'dir-north-steep',
      type: 'message',
      text: 'The ground begins to steepen, the footing is rocky. It is harder to travel.',
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
          effects: {},
        },
        {
          id: 'q1-origin-boar-spark',
          label: 'Cast a spell',
          nextStepId: 'boar-aftermath-spark',
          journalSummaryLineAdd: 'You fended off the boar by using magic.',
          effects: {},
        },
        {
          id: 'q1-origin-boar-dodge',
          label: 'Dodge',
          nextStepId: 'boar-aftermath-dodge',
          journalSummaryLineAdd: 'You fended off the boar by dodging it.',
          effects: {},
        },
        {
          id: 'q1-origin-boar-run',
          label: 'Run',
          nextStepId: 'boar-aftermath-run',
          journalSummaryLineAdd: 'You fended off the boar by running from it.',
          effects: {},
        },
      ],
    },
    makeBoarAftermathStep('boar-aftermath-strike', 'You fended off the boar by attacking it.'),
    makeBoarAftermathStep('boar-aftermath-spark', 'You fended off the boar by using magic.'),
    makeBoarAftermathStep('boar-aftermath-dodge', 'You fended off the boar by dodging it.'),
    makeBoarAftermathStep('boar-aftermath-run', 'You fended off the boar by running from it.'),
    {
      id: 'boar-aftermath',
      type: 'message',
      text: 'The boar misses and vanishes into the woods.',
      requireContinueTap: true,
      visuals: [wildBoarVisual],
      nextStepId: 'nightfall-wait',
    },
    {
      id: 'night-router',
      type: 'message',
      text: 'The sun set quickly.  It is almost impossible to see.',
      nextStepId: 'nightfall-wait',
    },
    {
      id: 'nightfall-wait',
      type: 'choice',
      text: 'The sun set quickly.  It is almost impossible to see.',
      visuals: [sunsetVisual],
      choices: [
        {
          id: 'q2-night-use-flask',
          label: 'Drink from your flask',
          nextStepId: 'nightfall-flask',
          enabledIfAnyFlags: [FIRST_NIGHT_FLAG_POCKET_FLASK],
          disabledIfAnyFlags: [FIRST_NIGHT_FLAG_USED_FLASK],
          effects: {
            flagsSet: [FIRST_NIGHT_FLAG_USED_FLASK],
          },
        },
        {
          id: 'q2-night-use-cigarettes',
          label: 'Smoke a cigarette',
          nextStepId: 'nightfall-cigarettes',
          enabledIfAnyFlags: [FIRST_NIGHT_FLAG_POCKET_CIGARETTES],
          disabledIfAnyFlags: [FIRST_NIGHT_FLAG_USED_CIGARETTES],
          effects: {
            flagsSet: [FIRST_NIGHT_FLAG_USED_CIGARETTES],
          },
        },
        {
          id: 'q2-night-use-cell-phone',
          label: 'Check your cell phone',
          nextStepId: 'nightfall-cell-phone',
          enabledIfAnyFlags: [FIRST_NIGHT_FLAG_POCKET_CELL_PHONE],
          disabledIfAnyFlags: [FIRST_NIGHT_FLAG_USED_CELL_PHONE],
          effects: {
            flagsSet: [FIRST_NIGHT_FLAG_USED_CELL_PHONE],
          },
        },
        {
          id: 'q2-night-wait-morning',
          label: 'Wait here until morning.',
          completeQuest: true,
        },
      ],
    },
    {
      id: 'nightfall-flask',
      type: 'message',
      text: 'You drink yourself to sleep and wake to the sound of morning birds.',
      visuals: [sunsetVisual],
      nextStepId: 'nightfall-wait',
    },
    {
      id: 'nightfall-cigarettes',
      type: 'message',
      text: 'The forest at night was terrifying, but at least you had some cigarettes.  You stayed awake all night.',
      visuals: [sunsetVisual],
      nextStepId: 'nightfall-wait',
    },
    {
      id: 'nightfall-cell-phone',
      type: 'message',
      text: 'You took comfort in your phone but you fretted about your battery.  You were afraid the light would draw attention to you so you kept it off most of the night.',
      visuals: [sunsetVisual],
      nextStepId: 'nightfall-wait',
    },
  ],
});
