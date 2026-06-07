// modifiersDelta intentionally omitted while authoring quests.
import {
  ANCIENT_CEMETERY_DISCOVERED_FLAG,
  ANCIENT_CEMETERY_LOCATION,
  FEVER_DREAM_PENDING_FLAG,
  QUEST_DYERS_CRYPT_ID,
  SEVERE_INJURY_MAGNITUDE,
  SWEET_DREAM_PENDING_FLAG,
  WOUNDED_SHOULDER_INJURY_KEY,
} from '../constants';
import {
  FIRST_NIGHT_FLAG_CALL_HELP,
  FIRST_NIGHT_FLAG_FOOD,
  FIRST_NIGHT_FLAG_HIGH_GROUND,
  FIRST_NIGHT_FLAG_POCKETS,
  FIRST_NIGHT_FLAG_SHELTER,
  FIRST_NIGHT_FLAG_TREE,
  FIRST_NIGHT_FLAG_TRAILS,
  FIRST_NIGHT_FLAG_WATER,
} from './quest-002-first-night';
import {
  availabilityForSagaUnveil,
  makeQuestAvailability,
  makeQuestUnveilEligibility,
} from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';
import type { QuestState } from './types';

const DYERS_CRYPT_ART = 'art/converted/monastery-graveyard-under-snow-caspar-david-friedrich.webp';

const dyersCryptVisual = {
  kind: 'image' as const,
  src: DYERS_CRYPT_ART,
  alt: 'A snow-covered graveyard and ruined abbey',
};

export const DYERS_CRYPT_MUSHROOM_EAT_1_FLAG = 'dyers-crypt-mushroom-eat-1';
export const DYERS_CRYPT_MUSHROOM_EAT_2_FLAG = 'dyers-crypt-mushroom-eat-2';
export const DYERS_CRYPT_MUSHROOM_EAT_3_FLAG = 'dyers-crypt-mushroom-eat-3';

const CONTEXT_FALLBACK = 'context-fallback';
const CONTEXT_WATER = 'context-water';
const CONTEXT_TRAILS = 'context-trails';
const CONTEXT_FOOD = 'context-food';
const CONTEXT_HIGH_GROUND = 'context-high-ground';
const CONTEXT_SHELTER = 'context-shelter';
const CONTEXT_TREE = 'context-tree';
const CONTEXT_POCKETS = 'context-pockets';
const CONTEXT_CALL_HELP = 'context-call-help';

const MUSHROOM_INTRO = 'dyers-mushroom-intro';

/** Priority-ordered Sunset flag → contextual opener step (see QUEST_COPY_STYLE.md). */
export function resolveDyersCryptInitialStepId(state: QuestState): string {
  const flags = state.flags;
  if (flags.includes(FIRST_NIGHT_FLAG_WATER)) return CONTEXT_WATER;
  if (flags.includes(FIRST_NIGHT_FLAG_TRAILS)) return CONTEXT_TRAILS;
  if (flags.includes(FIRST_NIGHT_FLAG_FOOD)) return CONTEXT_FOOD;
  if (flags.includes(FIRST_NIGHT_FLAG_HIGH_GROUND)) return CONTEXT_HIGH_GROUND;
  if (flags.includes(FIRST_NIGHT_FLAG_SHELTER)) return CONTEXT_SHELTER;
  if (flags.includes(FIRST_NIGHT_FLAG_TREE)) return CONTEXT_TREE;
  if (flags.includes(FIRST_NIGHT_FLAG_POCKETS)) return CONTEXT_POCKETS;
  if (flags.includes(FIRST_NIGHT_FLAG_CALL_HELP)) return CONTEXT_CALL_HELP;
  return CONTEXT_FALLBACK;
}

export const quest003DyersCrypt = createQuestDefinition({
  id: QUEST_DYERS_CRYPT_ID,
  title: "Dyer's Crypt",
  briefing: 'There is evil here...',
  createdAt: 3,
  startStepId: CONTEXT_FALLBACK,
  resolveInitialStepId: resolveDyersCryptInitialStepId,
  isAvailable: makeQuestAvailability({
    requiresAnyCompletedQuestIds: ['quest-002-first-night'],
    minDay: 2,
  }),
  isUnveilEligible: makeQuestUnveilEligibility(
    availabilityForSagaUnveil({
      requiresAnyCompletedQuestIds: ['quest-002-first-night'],
      minDay: 2,
    })
  ),
  journalSummaryFallback: "Dyer's Crypt",
  steps: [
    {
      id: CONTEXT_WATER,
      type: 'message',
      text: 'You are following the water downstream when you find a patch of mushrooms.',
      nextStepId: MUSHROOM_INTRO,
    },
    {
      id: CONTEXT_TRAILS,
      type: 'message',
      text: 'You are following an animal trail when you find a patch of mushrooms.',
      nextStepId: MUSHROOM_INTRO,
    },
    {
      id: CONTEXT_FOOD,
      type: 'message',
      text: 'You are searching for food when you find a patch of mushrooms.',
      nextStepId: MUSHROOM_INTRO,
    },
    {
      id: CONTEXT_HIGH_GROUND,
      type: 'message',
      text: 'You climb toward higher ground when you find a patch of mushrooms.',
      nextStepId: MUSHROOM_INTRO,
    },
    {
      id: CONTEXT_SHELTER,
      type: 'message',
      text: 'You leave your shelter when you find a patch of mushrooms.',
      nextStepId: MUSHROOM_INTRO,
    },
    {
      id: CONTEXT_TREE,
      type: 'message',
      text: 'You climb down from the tree when you find a patch of mushrooms.',
      nextStepId: MUSHROOM_INTRO,
    },
    {
      id: CONTEXT_POCKETS,
      type: 'message',
      text: 'You move on when you find a patch of mushrooms.',
      nextStepId: MUSHROOM_INTRO,
    },
    {
      id: CONTEXT_CALL_HELP,
      type: 'message',
      text: 'You push deeper into the forest when you find a patch of mushrooms.',
      nextStepId: MUSHROOM_INTRO,
    },
    {
      id: CONTEXT_FALLBACK,
      type: 'message',
      text: 'You press on when you find a patch of mushrooms.',
      nextStepId: MUSHROOM_INTRO,
    },
    {
      id: MUSHROOM_INTRO,
      type: 'choice',
      text: 'What do you do?',
      choices: [
        { id: 'dyers-taste', label: 'Taste one', nextStepId: 'dyers-mushroom-taste' },
        {
          id: 'dyers-leave',
          label: 'Leave',
          nextStepId: 'dyers-mushroom-leave',
          effects: { flagsSet: [SWEET_DREAM_PENDING_FLAG] },
        },
      ],
    },
    {
      id: 'dyers-mushroom-taste',
      type: 'choice',
      text: "It's earthy and slightly sweet.",
      choices: [
        {
          id: 'dyers-eat-more',
          label: 'Eat more',
          nextStepId: 'dyers-mushroom-eat-1',
          effects: { flagsSet: [DYERS_CRYPT_MUSHROOM_EAT_1_FLAG] },
        },
        {
          id: 'dyers-continue-after-taste',
          label: 'Continue',
          nextStepId: 'skeleton-intro',
          effects: { flagsSet: [FEVER_DREAM_PENDING_FLAG] },
        },
      ],
    },
    {
      id: 'dyers-mushroom-eat-1',
      type: 'message',
      text: 'The taste deepens.',
      nextStepId: 'dyers-mushroom-hub-1',
    },
    {
      id: 'dyers-mushroom-hub-1',
      type: 'choice',
      text: 'Your head swims.',
      choices: [
        {
          id: 'dyers-eat-more-2',
          label: 'Eat more',
          nextStepId: 'dyers-mushroom-eat-2',
          effects: { flagsSet: [DYERS_CRYPT_MUSHROOM_EAT_2_FLAG] },
        },
        {
          id: 'dyers-continue-1',
          label: 'Continue',
          nextStepId: 'skeleton-intro',
          effects: { flagsSet: [FEVER_DREAM_PENDING_FLAG] },
        },
      ],
    },
    {
      id: 'dyers-mushroom-eat-2',
      type: 'message',
      text: 'Colors bleed at the edges of your sight.',
      nextStepId: 'dyers-mushroom-hub-2',
    },
    {
      id: 'dyers-mushroom-hub-2',
      type: 'choice',
      text: 'The ground tilts.',
      choices: [
        {
          id: 'dyers-eat-more-3',
          label: 'Eat more',
          nextStepId: 'dyers-mushroom-eat-3',
          effects: {
            flagsSet: [DYERS_CRYPT_MUSHROOM_EAT_3_FLAG, FEVER_DREAM_PENDING_FLAG],
          },
        },
        {
          id: 'dyers-continue-2',
          label: 'Continue',
          nextStepId: 'skeleton-intro',
          effects: { flagsSet: [FEVER_DREAM_PENDING_FLAG] },
        },
      ],
    },
    {
      id: 'dyers-mushroom-eat-3',
      type: 'message',
      text: 'You cannot tell forest from fever.',
      nextStepId: 'dyers-mushroom-hub-3',
    },
    {
      id: 'dyers-mushroom-hub-3',
      type: 'message',
      text: 'Your stomach knots. No more.',
      nextStepId: 'skeleton-intro',
    },
    {
      id: 'dyers-mushroom-leave',
      type: 'message',
      text: 'You left the mushrooms alone.',
      nextStepId: 'skeleton-intro',
    },
    {
      id: 'skeleton-intro',
      type: 'choice',
      text: 'You hear a rustling sound... a living skeleton is shambling through the woods.',
      choices: [
        {
          id: 'skeleton-attack',
          label: 'Attack!',
          nextStepId: 'skeleton-attack-outcome',
        },
        {
          id: 'skeleton-cast',
          label: 'Cast a spell!',
          nextStepId: 'skeleton-cast-outcome',
        },
        {
          id: 'skeleton-follow',
          label: 'Stay hidden and follow the skeleton.',
          nextStepId: 'skeleton-cemetery-approach',
          effects: {
            flagsSet: [ANCIENT_CEMETERY_DISCOVERED_FLAG],
          },
        },
        {
          id: 'skeleton-hide',
          label: "Hide until it's gone.",
          nextStepId: 'skeleton-hide-outcome',
        },
      ],
    },
    {
      id: 'skeleton-attack-outcome',
      type: 'choice',
      text: 'Sensing your presence the skeleton turns in your direction. Wielding the axe above his head he charges you.',
      choices: [
        {
          id: 'skeleton-attack-flee',
          label: 'Perhaps challenging the living dead without a weapon was a bad idea (Run Away).',
          nextStepId: 'skeleton-flee-into-cemetery',
        },
      ],
    },
    {
      id: 'skeleton-cast-outcome',
      type: 'choice',
      text: "Your body relaxes a little as energy gathers in the palm of your hand. With a gesture in the skeleton's direction a tiny spark jumps through the air, but fizzles out in mid air. The skeleton finally sees you and instantly starts running in your direction, swinging the axe wildly.",
      choices: [
        {
          id: 'skeleton-cast-flee',
          label: 'You are not powerful enough to face this creature - FLEE!',
          nextStepId: 'skeleton-flee-into-cemetery',
        },
      ],
    },
    {
      id: 'skeleton-flee-into-cemetery',
      type: 'message',
      text: 'You bolt through the forest, heart pounding—and run straight into an iron picket fence. A massive gate stands open before you: a cemetery, and the skeleton is already inside.',
      visuals: [dyersCryptVisual],
      nextStepId: 'skeleton-inside-gate',
      effects: {
        flagsSet: [ANCIENT_CEMETERY_DISCOVERED_FLAG],
        setCurrentLocation: ANCIENT_CEMETERY_LOCATION,
      },
    },
    {
      id: 'skeleton-cemetery-approach',
      type: 'choice',
      text: 'You follow the skeleton to a cemetary surrounded by an iron picket fence. A massive gate lies open in front of you and an ancient trail leads over a hill. You wonder how large the cemetary could be.',
      visuals: [dyersCryptVisual],
      choices: [
        {
          id: 'skeleton-follow-inside',
          label: 'Follow the skeleton into the cemetary',
          nextStepId: 'skeleton-inside-gate',
          effects: {
            setCurrentLocation: ANCIENT_CEMETERY_LOCATION,
          },
        },
        {
          id: 'skeleton-come-back-later',
          label: 'come back later',
          nextStepId: 'skeleton-sneak-away',
        },
      ],
    },
    {
      id: 'skeleton-sneak-away',
      type: 'message',
      text: 'You sneak away for now',
      completeQuest: true,
    },
    {
      id: 'skeleton-inside-gate',
      type: 'choice',
      text: 'Once inside the gate skeletons began climbing out of the earth.',
      visuals: [dyersCryptVisual],
      choices: [
        {
          id: 'skeleton-fight',
          label: 'Fight them',
          nextStepId: 'skeleton-fight-outcome',
          effects: {
            healthLossFraction: 0.5,
            modifiersDelta: { [WOUNDED_SHOULDER_INJURY_KEY]: SEVERE_INJURY_MAGNITUDE },
          },
        },
        {
          id: 'skeleton-run-away-inside',
          label: 'Run Away',
          nextStepId: 'skeleton-escaped',
        },
      ],
    },
    {
      id: 'skeleton-fight-outcome',
      type: 'choice',
      text: 'You smash the skeleton closest to you across the face. It falls the ground with a satisfying clatter. Bony fingers wrap around your collar bone and you feel the flesh ripped from your bone. (FLEE)',
      choices: [
        {
          id: 'skeleton-fight-flee',
          label: 'FLEE',
          nextStepId: 'skeleton-escaped',
        },
      ],
    },
    {
      id: 'skeleton-escaped',
      type: 'message',
      text: 'You escaped into the forest.',
      completeQuest: true,
    },
    {
      id: 'skeleton-hide-outcome',
      type: 'message',
      text: "You stay hidden until it's gone.",
      nextStepId: 'skeleton-find-cemetery',
    },
    {
      id: 'skeleton-find-cemetery',
      type: 'message',
      text: 'You wander on and find a cemetery surrounded by an iron picket fence. A massive gate lies open in front of you and an ancient trail leads over a hill. You wonder how large the cemetery could be.',
      visuals: [dyersCryptVisual],
      nextStepId: 'skeleton-cemetery-found',
      effects: {
        flagsSet: [ANCIENT_CEMETERY_DISCOVERED_FLAG],
      },
    },
    {
      id: 'skeleton-cemetery-found',
      type: 'choice',
      text: 'The woods are quiet. The open gate waits.',
      visuals: [dyersCryptVisual],
      choices: [
        {
          id: 'skeleton-found-enter',
          label: 'Enter the cemetery',
          nextStepId: 'skeleton-inside-gate',
          effects: {
            setCurrentLocation: ANCIENT_CEMETERY_LOCATION,
          },
        },
        {
          id: 'skeleton-found-leave',
          label: 'come back later',
          nextStepId: 'skeleton-sneak-away',
        },
      ],
    },
  ],
});
