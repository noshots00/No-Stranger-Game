import { QUEST_018_SILVER_LAKE_REFLECTION_ID, VILLAGE_PHASE_FLAG } from '../constants';
import { makeQuestAvailability } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';

/** Unlocks after Silver Lake reflection; entering the endgame village hub. */
export const quest036TheVillage = createQuestDefinition({
  id: 'quest-036-the-village',
  title: 'The Village',
  briefing: 'Smoke, voices, and cobbles — the world beyond the trees.',
  createdAt: 36,
  startStepId: 'village-arrival',
  isAvailable: makeQuestAvailability({
    requiresAnyCompletedQuestIds: [QUEST_018_SILVER_LAKE_REFLECTION_ID],
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
            flagsSet: [VILLAGE_PHASE_FLAG],
            setCurrentLocation: 'Village',
          },
          worldEventLogAdd: ['{playerName} approached the village gates.'],
        },
      ],
    },
  ],
});
