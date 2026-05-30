import { FOREST_CAVE_DISCOVERED_FLAG, QUEST_DAY_TWO_DREAM_ID, QUEST_FOREST_CAVE_ID } from '../constants';
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
import { forestCaveVignetteSteps } from './quest-005-forest-cave-vignettes';
import type { QuestState } from './types';

export const CONTEXT_FALLBACK = 'cave-fallback';
export const CONTEXT_WATER = 'cave-water';
export const CONTEXT_TRAILS = 'cave-trails';
export const CONTEXT_FOOD = 'cave-food';
export const CONTEXT_HIGH_GROUND = 'cave-high-ground';
export const CONTEXT_SHELTER = 'cave-shelter';
export const CONTEXT_TREE = 'cave-tree';
export const CONTEXT_POCKETS = 'cave-pockets';
export const CONTEXT_CALL_HELP = 'cave-call-help';

export const KNOCKOUT_WATER = 'knockout-water';
export const KNOCKOUT_TRAILS = 'knockout-trails';
export const KNOCKOUT_FOOD = 'knockout-food';
export const KNOCKOUT_HIGH_GROUND = 'knockout-high-ground';
export const KNOCKOUT_GENERIC = 'knockout-generic';

export const WAKE_WATER = 'wake-water';
export const WAKE_TRAILS = 'wake-trails';
export const WAKE_FOOD = 'wake-food';
export const WAKE_HIGH_GROUND = 'wake-high-ground';
export const WAKE_GENERIC = 'wake-generic';

const WAKE_ROUTE = 'wake-route';
const CAVE_CLOSE = 'cave-close';

const PRIMARY_SUNSET_FLAGS = [
  FIRST_NIGHT_FLAG_WATER,
  FIRST_NIGHT_FLAG_TRAILS,
  FIRST_NIGHT_FLAG_FOOD,
  FIRST_NIGHT_FLAG_HIGH_GROUND,
] as const;

/** Priority-ordered primary Sunset flag → knockout / wake step. */
export function resolveForestCavePrimaryKnockoutStepId(flags: readonly string[]): string {
  if (flags.includes(FIRST_NIGHT_FLAG_WATER)) return KNOCKOUT_WATER;
  if (flags.includes(FIRST_NIGHT_FLAG_TRAILS)) return KNOCKOUT_TRAILS;
  if (flags.includes(FIRST_NIGHT_FLAG_FOOD)) return KNOCKOUT_FOOD;
  if (flags.includes(FIRST_NIGHT_FLAG_HIGH_GROUND)) return KNOCKOUT_HIGH_GROUND;
  return KNOCKOUT_GENERIC;
}

export function resolveForestCavePrimaryWakeStepId(flags: readonly string[]): string {
  if (flags.includes(FIRST_NIGHT_FLAG_WATER)) return WAKE_WATER;
  if (flags.includes(FIRST_NIGHT_FLAG_TRAILS)) return WAKE_TRAILS;
  if (flags.includes(FIRST_NIGHT_FLAG_FOOD)) return WAKE_FOOD;
  if (flags.includes(FIRST_NIGHT_FLAG_HIGH_GROUND)) return WAKE_HIGH_GROUND;
  return WAKE_GENERIC;
}

/** Opener step from Sunset flags (matches Dyer's Crypt resolver). */
export function resolveForestCaveInitialStepId(state: QuestState): string {
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

function openerNextStepId(contextStepId: string): string {
  switch (contextStepId) {
    case CONTEXT_WATER:
      return KNOCKOUT_WATER;
    case CONTEXT_TRAILS:
      return KNOCKOUT_TRAILS;
    case CONTEXT_FOOD:
      return KNOCKOUT_FOOD;
    case CONTEXT_HIGH_GROUND:
      return KNOCKOUT_HIGH_GROUND;
    default:
      return KNOCKOUT_GENERIC;
  }
}

export const quest005ForestCave = createQuestDefinition({
  id: QUEST_FOREST_CAVE_ID,
  title: 'The Cave',
  briefing: 'Sunset choices lead here — a cave mouth, and no way forward but in.',
  createdAt: 5,
  mainDailyQuest: true,
  startStepId: CONTEXT_FALLBACK,
  resolveInitialStepId: resolveForestCaveInitialStepId,
  isAvailable: makeQuestAvailability({
    requiresAnyCompletedQuestIds: [QUEST_DAY_TWO_DREAM_ID],
    minDay: 3,
  }),
  isUnveilEligible: makeQuestUnveilEligibility(
    availabilityForSagaUnveil({
      requiresAnyCompletedQuestIds: [QUEST_DAY_TWO_DREAM_ID],
      minDay: 3,
    })
  ),
  journalSummaryFallback: 'You entered a cave and woke a day later, changed by strange memories.',
  steps: [
    {
      id: CONTEXT_WATER,
      type: 'message',
      text: 'You follow the stream until the water pours into a black mouth in the rock. The current tugs toward darkness. You have no choice but to go in after it.',
      nextStepId: openerNextStepId(CONTEXT_WATER),
    },
    {
      id: CONTEXT_TRAILS,
      type: 'message',
      text: 'The animal trail ends at a reeking cave — a bear den, littered with gnawed bone. The opening gapes in the hillside. You step inside.',
      nextStepId: openerNextStepId(CONTEXT_TRAILS),
    },
    {
      id: CONTEXT_FOOD,
      type: 'message',
      text: 'While searching for food you find a hollow beneath an outcrop, then a deeper passage behind it — a cave rank with old roots and gnawed shells. You duck into the dark.',
      nextStepId: openerNextStepId(CONTEXT_FOOD),
    },
    {
      id: CONTEXT_HIGH_GROUND,
      type: 'message',
      text: 'From the ridge you spot a cave mouth cut into the cliff below. The only way forward is down the slope and in.',
      nextStepId: openerNextStepId(CONTEXT_HIGH_GROUND),
    },
    {
      id: CONTEXT_SHELTER,
      type: 'message',
      text: 'Behind where you built your lean-to, the rock wall gives way to a deeper hollow — a cave you never noticed in the failing light. You go in.',
      nextStepId: openerNextStepId(CONTEXT_SHELTER),
    },
    {
      id: CONTEXT_TREE,
      type: 'message',
      text: 'At the base of the great tree the roots part around a sinkhole that opens into a stone throat. You climb down into the cave beneath.',
      nextStepId: openerNextStepId(CONTEXT_TREE),
    },
    {
      id: CONTEXT_POCKETS,
      type: 'message',
      text: 'Something you found in your pockets — a scrap of map, or the memory of one — draws your eye to a crack in the stone that widens into a cave. You slip inside.',
      nextStepId: openerNextStepId(CONTEXT_POCKETS),
    },
    {
      id: CONTEXT_CALL_HELP,
      type: 'message',
      text: 'Your call rolls back from the stone. The echo came from a cave you did not see until you turned. You walk toward it and enter.',
      nextStepId: openerNextStepId(CONTEXT_CALL_HELP),
    },
    {
      id: CONTEXT_FALLBACK,
      type: 'message',
      text: 'A cave mouth opens in the forest with no warning. You go in because there is nowhere else to go.',
      nextStepId: openerNextStepId(CONTEXT_FALLBACK),
    },
    {
      id: KNOCKOUT_WATER,
      type: 'message',
      text: 'The stream runs through the cave floor. You slip on wet stone and fall in. The current takes you under.',
      nextStepId: 'dream-bridge',
    },
    {
      id: KNOCKOUT_TRAILS,
      type: 'message',
      text: 'A giant cave bear rises from the dark. You do not even have time to scream before the world goes black.',
      nextStepId: 'dream-bridge',
    },
    {
      id: KNOCKOUT_FOOD,
      type: 'message',
      text: 'Glowing mushrooms line the walls. You breathe the spores before you can cover your mouth. The light swells, then goes out.',
      nextStepId: 'dream-bridge',
    },
    {
      id: KNOCKOUT_HIGH_GROUND,
      type: 'message',
      text: 'The cave opens into an abandoned mine shaft. You climb a rotted ladder; the rungs give way and you fall into the dark below.',
      nextStepId: 'dream-bridge',
    },
    {
      id: KNOCKOUT_GENERIC,
      type: 'message',
      text: 'The air thickens. Your knees buckle and the stone rushes up to meet you.',
      nextStepId: 'dream-bridge',
    },
    ...forestCaveVignetteSteps,
    {
      id: WAKE_ROUTE,
      type: 'choice',
      text: 'The memories release you.',
      choices: [
        {
          id: 'route-wake-water',
          label: 'Continue',
          nextStepId: WAKE_WATER,
          enabledIfAnyFlags: [FIRST_NIGHT_FLAG_WATER],
        },
        {
          id: 'route-wake-trails',
          label: 'Continue',
          nextStepId: WAKE_TRAILS,
          enabledIfAnyFlags: [FIRST_NIGHT_FLAG_TRAILS],
          disabledIfAnyFlags: [FIRST_NIGHT_FLAG_WATER],
        },
        {
          id: 'route-wake-food',
          label: 'Continue',
          nextStepId: WAKE_FOOD,
          enabledIfAnyFlags: [FIRST_NIGHT_FLAG_FOOD],
          disabledIfAnyFlags: [FIRST_NIGHT_FLAG_WATER, FIRST_NIGHT_FLAG_TRAILS],
        },
        {
          id: 'route-wake-high-ground',
          label: 'Continue',
          nextStepId: WAKE_HIGH_GROUND,
          enabledIfAnyFlags: [FIRST_NIGHT_FLAG_HIGH_GROUND],
          disabledIfAnyFlags: [
            FIRST_NIGHT_FLAG_WATER,
            FIRST_NIGHT_FLAG_TRAILS,
            FIRST_NIGHT_FLAG_FOOD,
          ],
        },
        {
          id: 'route-wake-generic',
          label: 'Continue',
          nextStepId: WAKE_GENERIC,
          disabledIfAnyFlags: [...PRIMARY_SUNSET_FLAGS],
        },
      ],
    },
    {
      id: WAKE_WATER,
      type: 'message',
      text: 'You wake on the far side of the cave. The stream runs out into open forest. You crawled through in your sleep, or something carried you.',
      nextStepId: CAVE_CLOSE,
    },
    {
      id: WAKE_TRAILS,
      type: 'message',
      text: 'You wake in the bear den. The giant bear is gone — only crushed bone and a rank hollow where it slept.',
      nextStepId: CAVE_CLOSE,
    },
    {
      id: WAKE_FOOD,
      type: 'message',
      text: 'You wake among the mushrooms. The glow has faded; the spores hang thin in the air, as if the cave exhaled them while you slept.',
      nextStepId: CAVE_CLOSE,
    },
    {
      id: WAKE_HIGH_GROUND,
      type: 'message',
      text: 'You wake at the bottom of the shaft, bruised but breathing. The broken ladder hangs above. You climb out hand over hand.',
      nextStepId: CAVE_CLOSE,
    },
    {
      id: WAKE_GENERIC,
      type: 'message',
      text: 'You wake at the cave mouth. The forest is unchanged, but you are not.',
      nextStepId: CAVE_CLOSE,
    },
    {
      id: CAVE_CLOSE,
      type: 'message',
      text: 'You get your bearings. A whole day has passed while you were under.',
      completeQuest: true,
      effects: {
        flagsSet: [FOREST_CAVE_DISCOVERED_FLAG],
      },
    },
  ],
});
