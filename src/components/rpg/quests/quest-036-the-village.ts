import {
  DAY_PACING_ACTIVE_FLAG,
  QUEST_004_B_THE_DOOR_ID,
  VILLAGE_PHASE_FLAG,
} from '../constants';
import { makeQuestAvailability } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';

/** Unlocks after The Door; entering the endgame village hub. */
export const quest036TheVillage = createQuestDefinition({
  id: 'quest-036-the-village',
  title: 'The Village',
  briefing: 'Smoke, voices, and cobbles — the world beyond the trees.',
  createdAt: 36,
  startStepId: 'village-arrival',
  isAvailable: makeQuestAvailability({
    requiresAnyCompletedQuestIds: [QUEST_004_B_THE_DOOR_ID],
  }),
  journalSummaryFallback: 'You reached the village.',
  steps: [
    {
      id: 'village-arrival',
      type: 'choice',
      text: 'Congratulations you reached the village!',
      choices: [
        {
          id: 'village-approach',
          label: 'Approach the village',
          completeQuest: true,
          effects: {
            flagsSet: [VILLAGE_PHASE_FLAG, DAY_PACING_ACTIVE_FLAG],
            setCurrentLocation: 'Village',
          },
          worldEventLogAdd: ['{playerName} approached the village gates.'],
        },
      ],
    },
  ],
});
