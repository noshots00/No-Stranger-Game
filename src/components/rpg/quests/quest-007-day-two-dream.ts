import {
  FEVER_DREAM_PENDING_FLAG,
  FEVER_DREAM_UNLOCKED_FLAG,
  QUEST_DAY_TWO_DREAM_ID,
  SWEET_DREAM_PENDING_FLAG,
  SWEET_DREAM_UNLOCKED_FLAG,
} from '../constants';
import { createBranchingQuest, type StepBlueprint } from './branching-quest-template';
import type { QuestDefinition, QuestState } from './types';

const SWEET_DREAM_ART = 'art/converted/wrenand-bear.webp';
const FEVER_DREAM_ART = 'art/converted/mushroom-dream.webp';

const sweetDreamVisual = {
  kind: 'image' as const,
  src: SWEET_DREAM_ART,
  alt: 'Wren and bear in a dreamlike wood',
};

const feverDreamVisual = {
  kind: 'image' as const,
  src: FEVER_DREAM_ART,
  alt: 'Mushroom dream',
};

export function resolveDayTwoDreamInitialStepId(state: QuestState): string {
  if (state.flags.includes(FEVER_DREAM_PENDING_FLAG)) return 'fever-dream-intro';
  return 'sweet-dream-intro';
}

const feverSteps = [
  {
    id: 'fever-dream-intro',
    type: 'choice' as const,
    text: 'Sweat mats your hair to your forehead. The fever paints visions that refuse to scatter at dawn—which nightmare owned your sleep?',
    choices: [
      {
        id: 'fever-dream-trident-court',
        label: 'Black halls beneath the tide',
        nextStepId: 'fever-dream-outcome-trident',
        effects: {

        },
        worldEventLogAdd: ['{playerName} recalls drowning halls hung with rusted tridents.'],
      },
      {
        id: 'fever-dream-white-sun',
        label: 'A sun that never sets',
        nextStepId: 'fever-dream-outcome-sun',
        effects: {

        },
        worldEventLogAdd: ['{playerName} woke tasting brass and salt wind—noon stretched into forever.'],
      },
      {
        id: 'fever-dream-lotus-ledger',
        label: 'Endless stairs of stamped contracts',
        nextStepId: 'fever-dream-outcome-ledger',
        effects: {

        },
        worldEventLogAdd: ['{playerName} fled ink wells and lotus seals that judged every footstep.'],
      },
      {
        id: 'fever-dream-moon-knives',
        label: 'Smiling shadows on the hunt',
        nextStepId: 'fever-dream-outcome-moon',
        effects: {

        },
        worldEventLogAdd: ['{playerName} heard steel kiss leaves—the moon watched with too many eyes.'],
      },
      {
        id: 'fever-dream-tusk-arena',
        label: 'Cheering crowds of sharpened teeth',
        nextStepId: 'fever-dream-outcome-arena',
        effects: {

        },
        worldEventLogAdd: ['{playerName} stumbled through sand circles where tusks roared approval.'],
      },
    ],
  },
  {
    id: 'fever-dream-outcome-trident',
    type: 'message' as const,
    text: 'You bolt upright, throat burning as if seawater had truly filled your lungs. Armor clangs in memory; the sheets are only linen, but your ribs still remember the weight.',
    nextStepId: 'day-two-wake-fever',
  },
  {
    id: 'fever-dream-outcome-sun',
    type: 'message' as const,
    text: 'You wake clawing at your chest—skin cool now, yet light still bleeds through your eyelids. For an hour the horizon feels watchful, too bright to blink away.',
    nextStepId: 'day-two-wake-fever',
  },
  {
    id: 'fever-dream-outcome-ledger',
    type: 'message' as const,
    text: 'Your fingers twitch as if sealing wax still burned them. The cabin wall has no staircases, yet order slips through your thoughts like ruled lines.',
    nextStepId: 'day-two-wake-fever',
  },
  {
    id: 'fever-dream-outcome-moon',
    type: 'message' as const,
    text: 'Breath returns in gasps. Moonlight through the boards stitches stripes across your chest—you tell yourself nothing pads the timber outside. Your pulse disagrees.',
    nextStepId: 'day-two-wake-fever',
  },
  {
    id: 'fever-dream-outcome-arena',
    type: 'message' as const,
    text: 'You sit up swinging at empty air. Echoes of chanting fade into cricket song; your knuckles ache from clenching fists that never landed a blow.',
    nextStepId: 'day-two-wake-fever',
  },
  {
    id: 'day-two-wake-fever',
    type: 'message' as const,
    text: 'Dawn breaks cold and gray.',
    completeQuest: true,
    effects: { flagsSet: [FEVER_DREAM_UNLOCKED_FLAG] },
  },
];

const sweetSteps = [
  {
    id: 'sweet-dream-intro',
    type: 'choice' as const,
    text: 'You had a wonderful dream... what do you remember?',
    choices: [
      {
        id: 'sweet-dream-flying',
        label: 'I was flying high above the trees.',
        nextStepId: 'sweet-dream-outcome-flying',
        effects: {

        },
        worldEventLogAdd: ['{playerName} woke light-footed, remembering the canopy from above.'],
      },
      {
        id: 'sweet-dream-swimming',
        label: 'I was swimming with a beautiful stranger.',
        nextStepId: 'sweet-dream-outcome-swimming',
        effects: {

        },
        worldEventLogAdd: ['{playerName} woke smiling—a stranger\'s easy current still carried them.'],
      },
      {
        id: 'sweet-dream-telekinesis',
        label: 'I could move objects with my mind.',
        nextStepId: 'sweet-dream-outcome-telekinesis',
        effects: {

        },
        worldEventLogAdd: ['{playerName} woke with tingling hands, sure the world had once answered thought alone.'],
      },
    ],
  },
  {
    id: 'sweet-dream-outcome-flying',
    type: 'message' as const,
    text: 'You wake with wind still in your hair and the treetops swaying though no breeze touches the cabin.',
    nextStepId: 'day-two-wake-sweet',
  },
  {
    id: 'sweet-dream-outcome-swimming',
    type: 'message' as const,
    text: 'You wake tasting salt you cannot place; warmth from the dream stranger still lingers on your skin.',
    nextStepId: 'day-two-wake-sweet',
  },
  {
    id: 'sweet-dream-outcome-telekinesis',
    type: 'message' as const,
    text: 'You wake flexing fingers that almost remember lifting cups and candles without touching them.',
    nextStepId: 'day-two-wake-sweet',
  },
  {
    id: 'day-two-wake-sweet',
    type: 'message' as const,
    text: 'Dawn arrives gentle and clear.',
    completeQuest: true,
    effects: { flagsSet: [SWEET_DREAM_UNLOCKED_FLAG] },
  },
];

const dayTwoDreamSteps = [...feverSteps, ...sweetSteps] as StepBlueprint[];

export const quest007DayTwoDream: QuestDefinition = {
  ...createBranchingQuest({
    id: QUEST_DAY_TWO_DREAM_ID,
    title: 'Dream',
    briefing: 'Sleep takes hold.',
    createdAt: 8,
    toneTag: 'vision',
    startStepId: 'fever-dream-intro',
    resolveInitialStepId: resolveDayTwoDreamInitialStepId,
    mainDailyQuest: true,
    availability: {
      requiresAnyCompletedQuestIds: ['quest-004-abandoned-shelter'],
      requiresAnyFlags: [FEVER_DREAM_PENDING_FLAG, SWEET_DREAM_PENDING_FLAG],
      minDay: 2,
    },
    steps: dayTwoDreamSteps,
  }),
  stepVisuals: {
    ...Object.fromEntries(feverSteps.map((step) => [step.id, [feverDreamVisual]])),
    ...Object.fromEntries(sweetSteps.map((step) => [step.id, [sweetDreamVisual]])),
  },
};
