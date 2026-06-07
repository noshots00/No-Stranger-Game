import {
  DAY_PACING_ACTIVE_FLAG,
  JOB_SLUG_ADVENTURER,
  JOB_SLUG_MINER,
  JOB_SLUG_STONECUTTER,
  JOB_SLUG_WOODCUTTER,
  QUEST_004_B_THE_DOOR_ID,
  VILLAGE_PHASE_FLAG,
} from '../constants';
import { VILLAGE_MAP_PATH } from '../village/villageArt';
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
      visuals: [{ kind: 'image', src: VILLAGE_MAP_PATH, alt: 'Strange Village', fit: 'contain' }],
      choices: [
        {
          id: 'village-approach',
          label: 'Approach the village',
          completeQuest: true,
          effects: {
            flagsSet: [VILLAGE_PHASE_FLAG, DAY_PACING_ACTIVE_FLAG],
            setCurrentLocation: 'Village',
            unlockJobSlugs: [
              JOB_SLUG_ADVENTURER,
              JOB_SLUG_STONECUTTER,
              JOB_SLUG_MINER,
              JOB_SLUG_WOODCUTTER,
            ],
          },
          worldEventLogAdd: ['{playerName} approached the village gates.'],
        },
      ],
    },
  ],
});
