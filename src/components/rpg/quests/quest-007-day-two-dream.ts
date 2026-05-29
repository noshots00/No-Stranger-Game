import {
  FEVER_DREAM_PENDING_FLAG,
  FEVER_DREAM_UNLOCKED_FLAG,
  QUEST_DAY_TWO_DREAM_ID,
  SWEET_DREAM_PENDING_FLAG,
  SWEET_DREAM_UNLOCKED_FLAG,
} from '../constants';
import { createBranchingQuest, type StepBlueprint } from './branching-quest-template';
import type { QuestState } from './types';

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
    text: 'Warmth lingers behind your ribs at dawn. Sleep felt kind—which dream stayed with you?',
    choices: [
      {
        id: 'sweet-dream-dawn-choir',
        label: 'Voices raised in a rose-colored dawn',
        nextStepId: 'sweet-dream-outcome-dawn',
        effects: {

        },
        worldEventLogAdd: ['{playerName} woke smiling—somewhere a chorus still thanked the horizon.'],
      },
      {
        id: 'sweet-dream-moss-glade',
        label: 'A glade where deer breathe beside you',
        nextStepId: 'sweet-dream-outcome-glade',
        effects: {

        },
        worldEventLogAdd: ['{playerName} carried forest quiet into morning like a blanket.'],
      },
      {
        id: 'sweet-dream-hill-feast',
        label: 'A long table and an arrow that finds the center',
        nextStepId: 'sweet-dream-outcome-feast',
        effects: {

        },
        worldEventLogAdd: ['{playerName} tasted honey and cordial—and the target rang true.'],
      },
      {
        id: 'sweet-dream-crystal-hall',
        label: 'Mirrors that show you at your kindest',
        nextStepId: 'sweet-dream-outcome-hall',
        effects: {

        },
        worldEventLogAdd: ['{playerName} opened kind eyes in every reflection.'],
      },
      {
        id: 'sweet-dream-lantern-spirits',
        label: 'Tiny lights that guide you home',
        nextStepId: 'sweet-dream-outcome-lanterns',
        effects: {

        },
        worldEventLogAdd: ['{playerName} followed laughter small as bells through friendly dark.'],
      },
    ],
  },
  {
    id: 'sweet-dream-outcome-dawn',
    type: 'message' as const,
    text: 'You stretch without hurry. The air feels redder than yesterday, as if the whole sky wished you well.',
    nextStepId: 'day-two-wake-sweet',
  },
  {
    id: 'sweet-dream-outcome-glade',
    type: 'message' as const,
    text: 'Leaves scrape the roof like soft footsteps; you half-expect a warm muzzle at your palm. Your shoulders drop further than they have in weeks.',
    nextStepId: 'day-two-wake-sweet',
  },
  {
    id: 'sweet-dream-outcome-feast',
    type: 'message' as const,
    text: 'Your belly remembers bread and laughter. Outside, the forest sounds patient—there is time enough for everything worth doing.',
    nextStepId: 'day-two-wake-sweet',
  },
  {
    id: 'sweet-dream-outcome-hall',
    type: 'message' as const,
    text: 'You rise believing your own courtesy was never wasted. The cabin boards are plain wood again, but your reflection still straightens its shoulders.',
    nextStepId: 'day-two-wake-sweet',
  },
  {
    id: 'sweet-dream-outcome-lanterns',
    type: 'message' as const,
    text: 'You tuck your boots under the cot smiling. Even the crickets seem to answer one another on purpose—like old friends checking in.',
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

export const quest007DayTwoDream = createBranchingQuest({
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
  steps: [...feverSteps, ...sweetSteps] as StepBlueprint[],
});
