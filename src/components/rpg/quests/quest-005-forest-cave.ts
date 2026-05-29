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
import type { QuestState } from './types';

const CONTEXT_FALLBACK = 'cave-fallback';
const CONTEXT_WATER = 'cave-water';
const CONTEXT_TRAILS = 'cave-trails';
const CONTEXT_FOOD = 'cave-food';
const CONTEXT_HIGH_GROUND = 'cave-high-ground';
const CONTEXT_SHELTER = 'cave-shelter';
const CONTEXT_TREE = 'cave-tree';
const CONTEXT_POCKETS = 'cave-pockets';
const CONTEXT_CALL_HELP = 'cave-call-help';

const CAVE_ENTER = 'cave-enter';

/** Priority-ordered Sunset flag → cave discovery (matches Dyer's Crypt resolver). */
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

export const quest005ForestCave = createQuestDefinition({
  id: QUEST_FOREST_CAVE_ID,
  title: 'The Cave',
  briefing: 'Sunset choices lead here — a cave mouth, and no way forward but in.',
  createdAt: 5,
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
  journalSummaryFallback: 'You entered a cave deep in the forest.',
  steps: [
    {
      id: CONTEXT_WATER,
      type: 'message',
      text: 'You follow the stream until the water pours into a black mouth in the rock. The current tugs toward darkness. You have no choice but to go in after it.',
      nextStepId: CAVE_ENTER,
    },
    {
      id: CONTEXT_TRAILS,
      type: 'message',
      text: 'The animal trail ends at a reeking cave — a bear den, littered with gnawed bone. The opening gapes in the hillside. You step inside.',
      nextStepId: CAVE_ENTER,
    },
    {
      id: CONTEXT_FOOD,
      type: 'message',
      text: 'While searching for food you find a hollow beneath an outcrop, then a deeper passage behind it — a cave rank with old roots and gnawed shells. You duck into the dark.',
      nextStepId: CAVE_ENTER,
    },
    {
      id: CONTEXT_HIGH_GROUND,
      type: 'message',
      text: 'From the ridge you spot a cave mouth cut into the cliff below. The only way forward is down the slope and in.',
      nextStepId: CAVE_ENTER,
    },
    {
      id: CONTEXT_SHELTER,
      type: 'message',
      text: 'Behind where you built your lean-to, the rock wall gives way to a deeper hollow — a cave you never noticed in the failing light. You go in.',
      nextStepId: CAVE_ENTER,
    },
    {
      id: CONTEXT_TREE,
      type: 'message',
      text: 'At the base of the great tree the roots part around a sinkhole that opens into a stone throat. You climb down into the cave beneath.',
      nextStepId: CAVE_ENTER,
    },
    {
      id: CONTEXT_POCKETS,
      type: 'message',
      text: 'Something you found in your pockets — a scrap of map, or the memory of one — draws your eye to a crack in the stone that widens into a cave. You slip inside.',
      nextStepId: CAVE_ENTER,
    },
    {
      id: CONTEXT_CALL_HELP,
      type: 'message',
      text: 'Your call rolls back from the stone. The echo came from a cave you did not see until you turned. You walk toward it and enter.',
      nextStepId: CAVE_ENTER,
    },
    {
      id: CONTEXT_FALLBACK,
      type: 'message',
      text: 'A cave mouth opens in the forest with no warning. You go in because there is nowhere else to go.',
      nextStepId: CAVE_ENTER,
    },
    {
      id: CAVE_ENTER,
      type: 'message',
      text: 'You enter the cave. The air changes.',
      completeQuest: true,
      effects: {
        flagsSet: [FOREST_CAVE_DISCOVERED_FLAG],
      },
    },
  ],
});
