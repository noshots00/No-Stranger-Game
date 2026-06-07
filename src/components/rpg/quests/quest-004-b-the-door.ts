import {
  DOOR_APPROACH_HIDE_FLAG,
  DOOR_APPROACH_KNOCK_FLAG,
  DOOR_APPROACH_YELL_FLAG,
  QUEST_FOREST_CAVE_ID,
} from '../constants';
import { makeQuestAvailability } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';

const BATCH = 'art/converted';
const DOOR_IMG = `${BATCH}/door-in-the-forest.webp`;

/** After Forest Cave: a door in a great tree, then Carl (NPC dialog). */
export const quest004BTheDoor = createQuestDefinition({
  id: 'quest-004-b-the-door',
  title: 'The Door',
  briefing: 'You find a small door in a large tree.',
  createdAt: 11,
  startStepId: 'door-approach',
  questCardImageSide: 'right',
  isAvailable: makeQuestAvailability({
    requiresAnyCompletedQuestIds: [QUEST_FOREST_CAVE_ID],
  }),
  journalSummaryFallback: 'Answered the voice beyond the forest door.',
  steps: [
    {
      id: 'door-approach',
      type: 'choice',
      text:
        'A well-crafted door of wood and iron blocks the entrance to a small hole in an enormous tree. What do you do?',
      visuals: [{ kind: 'image', src: DOOR_IMG, alt: 'A door in the forest' }],
      choices: [
        {
          id: 'door-yell',
          label: "Yell out 'Is there anyone home?'",
          nextStepId: 'carl-hub',
          effects: { flagsSet: [DOOR_APPROACH_YELL_FLAG] },
        },
        {
          id: 'door-knock',
          label: 'Knock on the door',
          nextStepId: 'carl-hub',
          effects: { flagsSet: [DOOR_APPROACH_KNOCK_FLAG] },
        },
        {
          id: 'door-hide',
          label: 'Hide and wait to see if anyone comes.',
          nextStepId: 'carl-hub',
          effects: { flagsSet: [DOOR_APPROACH_HIDE_FLAG] },
        },
      ],
    },
    {
      id: 'carl-hub',
      type: 'choice',
      npcTalkId: 'carl',
      text: '',
      choices: [
        {
          id: 'carl-farewell',
          label: 'Farewell',
          completeQuest: true,
        },
      ],
    },
  ],
});
