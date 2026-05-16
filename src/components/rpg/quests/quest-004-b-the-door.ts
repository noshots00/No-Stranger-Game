import { makeQuestAvailability } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';

const BATCH = 'art/converted/batch-2026-05-02_21-10-35';
const DOOR_IMG = `${BATCH}/door-in-the-forest.webp`;

/** After meeting the merchant: voice in the woods, then Carl (NPC dialog) behind a strange door. */
export const quest004BTheDoor = createQuestDefinition({
  id: 'quest-004-b-the-door',
  title: 'The Door',
  briefing: 'Something blocks the path—voice, wood, and patience.',
  createdAt: 11,
  startStepId: 'door-halt',
  questCardLayout: 'title-overlay',
  isAvailable: makeQuestAvailability({
    requiresAnyCompletedQuestIds: ['quest-003-b-meet-merchant'],
  }),
  journalSummaryFallback: 'Answered the voice beyond the forest door.',
  steps: [
    {
      id: 'door-halt',
      type: 'choice',
      text:
        'The trail narrows. A great voice rolls through the trees—deep as distant thunder.\n\n“HALT, TRAVELER!”\n\nYou freeze.',
      visuals: [{ kind: 'image', src: DOOR_IMG, alt: 'A door in the forest' }],
      choices: [
        {
          id: 'door-continue',
          label: 'Continue...',
          nextStepId: 'carl-hub',
        },
      ],
    },
    {
      id: 'carl-hub',
      type: 'choice',
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
